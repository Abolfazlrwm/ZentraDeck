package main

import (
	"context"
	_ "embed"
	"fmt"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"path/filepath"
	"time"
)

//go:embed build/appicon.png
var notifIconPNG []byte

type AlertRules struct {
	Configured    bool `json:"configured"`
	Muted         bool `json:"muted"`
	OnOutage      bool `json:"onOutage"`
	OnFailedSvc   bool `json:"onFailedSvc"`
	CPUThreshold  int  `json:"cpuThreshold"`
	RAMThreshold  int  `json:"ramThreshold"`
	DiskThreshold int  `json:"diskThreshold"`
	CooldownMin   int  `json:"cooldownMin"`
}

type TriggeredAlert struct {
	ID         string `json:"id"`
	ServerID   string `json:"serverId"`
	ServerName string `json:"serverName"`
	Type       string `json:"type"`
	Detail     string `json:"detail"`
	Time       string `json:"time"`
}

type serverAlertState struct {
	initialized    bool
	wasOnline      bool
	offlineStrikes int
	cpuStrikes     int
	ramStrikes     int
	diskStrikes    int
	lastFailedSvc  int
	lastSent       map[string]time.Time
	lastPoll       time.Time
}

func defaultAlertRules() AlertRules {
	return AlertRules{
		Configured:    true,
		Muted:         false,
		OnOutage:      true,
		OnFailedSvc:   true,
		CPUThreshold:  90,
		RAMThreshold:  90,
		DiskThreshold: 85,
		CooldownMin:   10,
	}
}

func normalizeAlertRules(r AlertRules) AlertRules {
	if !r.Configured {
		return defaultAlertRules()
	}
	if r.CPUThreshold < 0 {
		r.CPUThreshold = 0
	} else if r.CPUThreshold > 100 {
		r.CPUThreshold = 100
	}
	if r.RAMThreshold < 0 {
		r.RAMThreshold = 0
	} else if r.RAMThreshold > 100 {
		r.RAMThreshold = 100
	}
	if r.DiskThreshold < 0 {
		r.DiskThreshold = 0
	} else if r.DiskThreshold > 100 {
		r.DiskThreshold = 100
	}
	if r.CooldownMin <= 0 {
		r.CooldownMin = 10
	} else if r.CooldownMin > 1440 {
		r.CooldownMin = 1440
	}
	return r
}

func (a *App) initAlertsAndTray() {
	iconDir, err := getVaultDir()
	if err != nil || iconDir == "" {
		iconDir = os.TempDir()
	}
	iconPath := filepath.Join(iconDir, "zentradeck-notif-icon.png")
	if err := os.WriteFile(iconPath, notifIconPNG, 0644); err == nil {
		a.notifIcon = iconPath
	}

	a.mu.Lock()
	if !a.settings.AlertPrefsInit {
		a.settings.DesktopAlerts = true
		a.settings.MinimizeToTray = true
		a.settings.AlertPrefsInit = true
	}
	for i := range a.servers {
		a.servers[i].AlertRules = normalizeAlertRules(a.servers[i].AlertRules)
	}
	a.mu.Unlock()

	a.startTray()
	go a.trayMonitorLoop()
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	a.mu.Lock()
	quit := a.forceQuit
	minTray := a.settings.MinimizeToTray
	a.mu.Unlock()

	if !quit && minTray {
		a.setWindowHidden(true)
		go trimProcessMemory()
		wailsruntime.WindowHide(ctx)
		return true
	}
	return false
}

func (a *App) shutdown(ctx context.Context) {
	a.closeAllPTY()
	a.closeAllSFTP()
	a.stopTray()
}

func (a *App) QuitApp() {
	a.mu.Lock()
	a.forceQuit = true
	a.mu.Unlock()
	a.stopTray()
	if a.ctx != nil {
		wailsruntime.Quit(a.ctx)
	}
}

func (a *App) setWindowHidden(hidden bool) {
	a.mu.Lock()
	a.windowHidden = hidden
	a.mu.Unlock()
}

func (a *App) isWindowHidden() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.windowHidden
}

func (a *App) sendOSNotification(title, body string) {
	icon := a.notifIcon
	go func() {
		_ = platformNotify(title, body, icon)
	}()
}

func (a *App) SendTestNotification() ActionResult {
	if err := platformNotify("ZentraDeck", "OS notifications with sound are working! Your per-server alert rules are ready.", a.notifIcon); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "OK"}
}

func (a *App) showMainWindow() {
	a.setWindowHidden(false)
	if a.ctx != nil {
		wailsruntime.WindowShow(a.ctx)
		wailsruntime.WindowUnminimise(a.ctx)
		wailsruntime.WindowSetAlwaysOnTop(a.ctx, true)
		wailsruntime.WindowSetAlwaysOnTop(a.ctx, false)
	}
}

func (a *App) UpdateTraySummary(online, total int) {
	if total <= 0 {
		a.updateTrayText("ZentraDeck - No servers configured")
		return
	}
	a.updateTrayText(fmt.Sprintf("ZentraDeck - %d/%d servers online", online, total))
}

func (a *App) getRulesForServer(serverID string) AlertRules {
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, s := range a.servers {
		if s.ID == serverID {
			return normalizeAlertRules(s.AlertRules)
		}
	}
	if r, ok := a.demoRules[serverID]; ok {
		return normalizeAlertRules(r)
	}
	return defaultAlertRules()
}

func (a *App) EvaluateServerAlerts(serverID, serverName string, isDemo bool, m ServerMetrics) []TriggeredAlert {
	rules := a.getRulesForServer(serverID)
	now := time.Now()
	ts := m.Timestamp
	if ts == "" {
		ts = now.Format("15:04:05")
	}

	a.alertMu.Lock()
	st, ok := a.alertStates[serverID]
	if !ok {
		st = &serverAlertState{
			lastSent: make(map[string]time.Time),
		}
		a.alertStates[serverID] = st
	}
	st.lastPoll = now

	var triggered []TriggeredAlert
	cooldown := time.Duration(rules.CooldownMin) * time.Minute

	canFire := func(kind string) bool {
		if rules.Muted {
			return false
		}
		last, exists := st.lastSent[kind]
		return !exists || now.Sub(last) >= cooldown
	}

	addAlert := func(kind, detail string) {
		st.lastSent[kind] = now
		triggered = append(triggered, TriggeredAlert{
			ID:         fmt.Sprintf("%d-%s-%s", now.UnixNano(), serverID, kind),
			ServerID:   serverID,
			ServerName: serverName,
			Type:       kind,
			Detail:     detail,
			Time:       ts,
		})
	}

	if !m.Online {
		st.offlineStrikes++
		required := 2
		if isDemo {
			required = 1
		}
		if st.initialized && st.wasOnline && st.offlineStrikes >= required {
			st.wasOnline = false
			if rules.OnOutage && !rules.Muted {
				addAlert("outage", "Server is unreachable")
			}
		} else if !st.initialized {
			st.wasOnline = false
			st.initialized = true
		}
	} else {
		st.offlineStrikes = 0
		if st.initialized && !st.wasOnline {
			if rules.OnOutage && !rules.Muted {
				addAlert("recovered", "Server is back online")
			}
		}

		// CPU threshold (2 consecutive polls + 5% hysteresis)
		if rules.CPUThreshold > 0 {
			if m.CPUPercent >= float64(rules.CPUThreshold) {
				st.cpuStrikes++
				if st.cpuStrikes >= 2 && canFire("cpu") {
					addAlert("cpu", fmt.Sprintf("CPU %.1f%% (>= %d%%)", m.CPUPercent, rules.CPUThreshold))
				}
			} else if m.CPUPercent < float64(rules.CPUThreshold)-5 {
				st.cpuStrikes = 0
			}
		}

		// RAM threshold
		if rules.RAMThreshold > 0 {
			if m.RAMPercent >= float64(rules.RAMThreshold) {
				st.ramStrikes++
				if st.ramStrikes >= 2 && canFire("ram") {
					addAlert("ram", fmt.Sprintf("RAM %.1f%% (>= %d%%)", m.RAMPercent, rules.RAMThreshold))
				}
			} else if m.RAMPercent < float64(rules.RAMThreshold)-5 {
				st.ramStrikes = 0
			}
		}

		// Disk threshold
		if rules.DiskThreshold > 0 {
			if m.DiskPercent >= float64(rules.DiskThreshold) {
				st.diskStrikes++
				if st.diskStrikes >= 2 && canFire("disk") {
					addAlert("disk", fmt.Sprintf("Disk %.1f%% (>= %d%%)", m.DiskPercent, rules.DiskThreshold))
				}
			} else if m.DiskPercent < float64(rules.DiskThreshold)-5 {
				st.diskStrikes = 0
			}
		}

		// Failed systemd services increase
		if rules.OnFailedSvc && st.initialized && m.FailedServices > st.lastFailedSvc && canFire("service") {
			addAlert("service", fmt.Sprintf("%d failed systemd service(s)", m.FailedServices))
		}
		st.lastFailedSvc = m.FailedServices
		st.wasOnline = true
		st.initialized = true
	}
	a.alertMu.Unlock()

	a.mu.Lock()
	desktopOn := a.settings.DesktopAlerts
	a.mu.Unlock()

	if desktopOn {
		for _, al := range triggered {
			title := fmt.Sprintf("ZentraDeck: %s", al.ServerName)
			a.sendOSNotification(title, al.Detail)
		}
	}

	return triggered
}

func (a *App) trayMonitorLoop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-a.trayStopCh:
			return
		case <-ticker.C:
			if !a.isWindowHidden() {
				continue
			}

			a.mu.Lock()
			servers := make([]ServerConfig, len(a.servers))
			copy(servers, a.servers)
			pollSec := a.settings.PollIntervalSec
			a.mu.Unlock()

			if pollSec < 5 {
				pollSec = 5
			}
			if len(servers) == 0 {
				a.UpdateTraySummary(0, 0)
				continue
			}

			onlineCount := 0
			for _, srv := range servers {
				a.alertMu.Lock()
				st := a.alertStates[srv.ID]
				var last time.Time
				wasUp := false
				if st != nil {
					last = st.lastPoll
					wasUp = st.wasOnline
				}
				a.alertMu.Unlock()

				if time.Since(last) < time.Duration(pollSec)*time.Second {
					if wasUp {
						onlineCount++
					}
					continue
				}

				m := a.GetServerMetrics(srv.ID)
				if m.Online {
					onlineCount++
				}
				alerts := a.EvaluateServerAlerts(srv.ID, srv.Name, srv.IsDemo, m)
				if a.ctx != nil {
					for _, al := range alerts {
						wailsruntime.EventsEmit(a.ctx, "zentradeck:alert", al)
					}
				}
			}
			a.UpdateTraySummary(onlineCount, len(servers))
		}
	}
}
