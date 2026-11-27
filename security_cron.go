package main

import (
	"encoding/base64"
	"fmt"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ==============================================================================
// Security & SSL Audit Models
// ==============================================================================

type SecurityCheckItem struct {
	ID      string `json:"id"`     // ssh_root | ssh_pass | ssh_port | fail2ban | firewall | updates | ssl_expiry
	Status  string `json:"status"` // pass | warn | fail
	Points  int    `json:"points"`
	MaxPts  int    `json:"maxPts"`
	Value   string `json:"value"`
	FixHint string `json:"fixHint"`
}

type SSLCertInfo struct {
	Domain    string `json:"domain"`
	Path      string `json:"path"`
	ExpiresAt string `json:"expiresAt"`
	DaysLeft  int    `json:"daysLeft"`
	Status    string `json:"status"` // ok | expiring | expired
}

type SecurityAuditReport struct {
	ServerID    string              `json:"serverId"`
	Score       int                 `json:"score"`
	Grade       string              `json:"grade"` // A | B | C | D | F
	Checks      []SecurityCheckItem `json:"checks"`
	Certs       []SSLCertInfo       `json:"certs"`
	GeneratedAt string              `json:"generatedAt"`
	Error       string              `json:"error"`
}

// ==============================================================================
// Cron Job & Systemd Timers Models
// ==============================================================================

type CronJobItem struct {
	LineIndex int    `json:"lineIndex"`
	Schedule  string `json:"schedule"`
	Command   string `json:"command"`
	Comment   string `json:"comment"`
	Enabled   bool   `json:"enabled"`
	Source    string `json:"source"` // user | system
}

type SystemdTimerItem struct {
	Unit      string `json:"unit"`
	NextRun   string `json:"nextRun"`
	LastRun   string `json:"lastRun"`
	Activates string `json:"activates"`
	Active    bool   `json:"active"`
}

type ScheduledTasksReport struct {
	ServerID    string             `json:"serverId"`
	CronJobs    []CronJobItem      `json:"cronJobs"`
	Timers      []SystemdTimerItem `json:"timers"`
	GeneratedAt string             `json:"generatedAt"`
	Error       string             `json:"error"`
}

const cronDisabledPrefix = "# [ZentraDeck-Disabled] "

var (
	demoCronMu   sync.Mutex
	demoCronData = map[string][]string{}
)

func initDemoCronIfNeeded(serverID string) []string {
	if lines, ok := demoCronData[serverID]; ok {
		return lines
	}
	lines := []string{
		"# Nightly PostgreSQL backup",
		"0 3 * * * /usr/local/bin/pg_backup.sh >> /var/log/pg_backup.log 2>&1",
		"# Clean unused Docker images every Sunday",
		"30 4 * * 0 docker system prune -af --filter \"until=168h\"",
		"# Health check ping every 5 minutes",
		"*/5 * * * * /opt/scripts/healthcheck.sh",
		cronDisabledPrefix + "0 1 * * * /opt/scripts/legacy_sync.sh",
	}
	demoCronData[serverID] = lines
	return lines
}

// ==============================================================================
// 1-Click Security & SSL Audit (Zero Outbound HTTP, Pure SSH)
// ==============================================================================

func (a *App) GetSecurityAudit(serverID string) SecurityAuditReport {
	defer debug.FreeOSMemory()

	rep := SecurityAuditReport{
		ServerID:    serverID,
		Checks:      []SecurityCheckItem{},
		Certs:       []SSLCertInfo{},
		GeneratedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	cfg, ok := a.findServer(serverID)
	if !ok {
		rep.Error = "server_not_found"
		return rep
	}

	if cfg.IsDemo {
		return buildDemoSecurityAudit(cfg)
	}

	script := `LC_ALL=C sh -c '
echo "===SSH==="
SSHD_CFG=$(cat /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null | grep -vE "^[[:space:]]*(#|$)" || true)
ROOT_LOGIN=$(echo "$SSHD_CFG" | grep -iE "^PermitRootLogin[[:space:]]+" | tail -n 1 | awk "{print \$2}")
PASS_AUTH=$(echo "$SSHD_CFG" | grep -iE "^PasswordAuthentication[[:space:]]+" | tail -n 1 | awk "{print \$2}")
SSH_PORT=$(echo "$SSHD_CFG" | grep -iE "^Port[[:space:]]+" | tail -n 1 | awk "{print \$2}")
echo "ROOT=${ROOT_LOGIN:-default}"
echo "PASS=${PASS_AUTH:-default}"
echo "PORT=${SSH_PORT:-22}"

echo "===F2B==="
if systemctl is-active --quiet fail2ban 2>/dev/null || pgrep -x fail2ban-server >/dev/null 2>&1; then
  echo "ACTIVE=1"
else
  echo "ACTIVE=0"
fi

echo "===FW==="
FW="none"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -qi "Status: active"; then
  FW="ufw"
elif systemctl is-active --quiet firewalld 2>/dev/null; then
  FW="firewalld"
elif systemctl is-active --quiet nftables 2>/dev/null; then
  FW="nftables"
elif iptables -L INPUT -n 2>/dev/null | grep -qE "DROP|REJECT"; then
  FW="iptables"
fi
echo "FW=$FW"

echo "===UPDATES==="
SEC_UPD=-1
if [ -x /usr/lib/update-notifier/apt-check ]; then
  SEC_UPD=$(/usr/lib/update-notifier/apt-check 2>&1 | cut -d";" -f2)
elif command -v apt-get >/dev/null 2>&1; then
  SEC_UPD=$(apt-get -s upgrade 2>/dev/null | grep -i "^Inst " | grep -ic "security" || echo 0)
elif command -v dnf >/dev/null 2>&1; then
  SEC_UPD=$(dnf check-update --security -q 2>/dev/null | grep -cE "^[a-zA-Z0-9]" || echo 0)
fi
echo "SEC_UPD=$SEC_UPD"

echo "===SSL==="
if command -v openssl >/dev/null 2>&1; then
  for cert in /etc/letsencrypt/live/*/fullchain.pem /etc/nginx/ssl/*.pem /etc/nginx/ssl/*.crt /etc/ssl/private/*.crt; do
    [ -f "$cert" ] || continue
    END=$(openssl x509 -enddate -noout -in "$cert" 2>/dev/null | cut -d= -f2)
    SUBJ=$(openssl x509 -subject -noout -in "$cert" 2>/dev/null | sed -n "s/.*CN[[:space:]]*=[[:space:]]*//p" | cut -d/ -f1 | cut -d, -f1)
    if [ -n "$END" ]; then
      echo "$cert|$SUBJ|$END"
    fi
  done
fi
'`
	out, err := a.runSSHCommand(cfg, script)
	if err != nil && strings.TrimSpace(out) == "" {
		rep.Error = err.Error()
		return rep
	}

	sec := splitHistorySections(out)
	score := 0

	// 1. SSH Root Login (20 pts)
	rootVal := parseKVLine(sec["SSH"], "ROOT")
	rootLower := strings.ToLower(rootVal)
	if rootLower == "no" || rootLower == "prohibit-password" || rootLower == "without-password" {
		score += 20
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssh_root", Status: "pass", Points: 20, MaxPts: 20, Value: rootVal,
		})
	} else if rootLower == "default" || rootLower == "" {
		score += 12
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssh_root", Status: "warn", Points: 12, MaxPts: 20, Value: "default",
			FixHint: "Set PermitRootLogin prohibit-password (or no) in /etc/ssh/sshd_config",
		})
	} else {
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssh_root", Status: "fail", Points: 0, MaxPts: 20, Value: rootVal,
			FixHint: "Set PermitRootLogin no in /etc/ssh/sshd_config && systemctl reload sshd",
		})
	}

	// 2. SSH Password Auth (20 pts)
	passVal := parseKVLine(sec["SSH"], "PASS")
	passLower := strings.ToLower(passVal)
	if passLower == "no" {
		score += 20
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssh_pass", Status: "pass", Points: 20, MaxPts: 20, Value: "disabled (key-only)",
		})
	} else {
		score += 5
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssh_pass", Status: "warn", Points: 5, MaxPts: 20, Value: passVal,
			FixHint: "Use SSH keys and set PasswordAuthentication no in /etc/ssh/sshd_config",
		})
	}

	// 3. Fail2ban (15 pts)
	f2b := parseKVLine(sec["F2B"], "ACTIVE") == "1"
	if f2b {
		score += 15
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "fail2ban", Status: "pass", Points: 15, MaxPts: 15, Value: "active",
		})
	} else {
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "fail2ban", Status: "warn", Points: 0, MaxPts: 15, Value: "inactive",
			FixHint: "sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban",
		})
	}

	// 4. Firewall (15 pts)
	fw := parseKVLine(sec["FW"], "FW")
	if fw != "" && fw != "none" {
		score += 15
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "firewall", Status: "pass", Points: 15, MaxPts: 15, Value: fw,
		})
	} else {
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "firewall", Status: "fail", Points: 0, MaxPts: 15, Value: "none detected",
			FixHint: "sudo ufw allow 22/tcp && sudo ufw enable",
		})
	}

	// 5. Pending Security Updates (15 pts)
	updStr := parseKVLine(sec["UPDATES"], "SEC_UPD")
	updCount, uErr := strconv.Atoi(updStr)
	if uErr != nil || updCount < 0 {
		score += 10
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "updates", Status: "warn", Points: 10, MaxPts: 15, Value: "unknown",
		})
	} else if updCount == 0 {
		score += 15
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "updates", Status: "pass", Points: 15, MaxPts: 15, Value: "0 pending",
		})
	} else if updCount <= 5 {
		score += 8
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "updates", Status: "warn", Points: 8, MaxPts: 15, Value: fmt.Sprintf("%d pending", updCount),
			FixHint: "sudo apt update && sudo apt upgrade -y",
		})
	} else {
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "updates", Status: "fail", Points: 0, MaxPts: 15, Value: fmt.Sprintf("%d pending", updCount),
			FixHint: "sudo apt update && sudo apt upgrade -y",
		})
	}

	// 6. SSL Certificates (15 pts)
	expiringCount := 0
	expiredCount := 0
	for _, line := range strings.Split(sec["SSL"], "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "|", 3)
		if len(parts) < 3 {
			continue
		}
		certPath, domain, endRaw := parts[0], strings.TrimSpace(parts[1]), strings.TrimSpace(parts[2])
		if domain == "" {
			domain = certPath
		}
		expTime, okT := parseOpenSSLDate(endRaw)
		if !okT {
			continue
		}
		daysLeft := int(time.Until(expTime).Hours() / 24)
		st := "ok"
		if daysLeft <= 0 {
			st = "expired"
			expiredCount++
		} else if daysLeft <= 30 {
			st = "expiring"
			expiringCount++
		}
		rep.Certs = append(rep.Certs, SSLCertInfo{
			Domain:    domain,
			Path:      certPath,
			ExpiresAt: expTime.Format("2006-01-02"),
			DaysLeft:  daysLeft,
			Status:    st,
		})
	}
	sort.Slice(rep.Certs, func(i, j int) bool { return rep.Certs[i].DaysLeft < rep.Certs[j].DaysLeft })

	if expiredCount > 0 {
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssl_expiry", Status: "fail", Points: 0, MaxPts: 15,
			Value:   fmt.Sprintf("%d expired", expiredCount),
			FixHint: "Run sudo certbot renew --dry-run and reload nginx/caddy",
		})
	} else if expiringCount > 0 {
		score += 7
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssl_expiry", Status: "warn", Points: 7, MaxPts: 15,
			Value:   fmt.Sprintf("%d expiring <30d", expiringCount),
			FixHint: "Verify certbot.timer is active: systemctl status certbot.timer",
		})
	} else {
		score += 15
		val := "all valid"
		if len(rep.Certs) == 0 {
			val = "no local certs"
		}
		rep.Checks = append(rep.Checks, SecurityCheckItem{
			ID: "ssl_expiry", Status: "pass", Points: 15, MaxPts: 15, Value: val,
		})
	}

	rep.Score = score
	rep.Grade = scoreToGrade(score)
	return rep
}

func parseKVLine(section, key string) string {
	prefix := key + "="
	for _, line := range strings.Split(section, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, prefix) {
			return strings.TrimSpace(strings.TrimPrefix(line, prefix))
		}
	}
	return ""
}

func parseOpenSSLDate(raw string) (time.Time, bool) {
	layouts := []string{
		"Jan _2 15:04:05 2006 MST",
		"Jan 2 15:04:05 2006 MST",
		time.RFC1123,
	}
	for _, l := range layouts {
		if t, err := time.Parse(l, raw); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func scoreToGrade(score int) string {
	switch {
	case score >= 90:
		return "A"
	case score >= 75:
		return "B"
	case score >= 60:
		return "C"
	case score >= 45:
		return "D"
	default:
		return "F"
	}
}

func buildDemoSecurityAudit(cfg ServerConfig) SecurityAuditReport {
	now := time.Now()
	lower := strings.ToLower(cfg.ID + " " + cfg.Name)
	if strings.Contains(lower, "2") || strings.Contains(lower, "db") || strings.Contains(lower, "staging") {
		return SecurityAuditReport{
			ServerID:    cfg.ID,
			Score:       95,
			Grade:       "A",
			GeneratedAt: now.Format("2006-01-02 15:04:05"),
			Checks: []SecurityCheckItem{
				{ID: "ssh_root", Status: "pass", Points: 20, MaxPts: 20, Value: "no"},
				{ID: "ssh_pass", Status: "pass", Points: 20, MaxPts: 20, Value: "disabled (key-only)"},
				{ID: "fail2ban", Status: "pass", Points: 15, MaxPts: 15, Value: "active"},
				{ID: "firewall", Status: "pass", Points: 15, MaxPts: 15, Value: "ufw"},
				{ID: "updates", Status: "warn", Points: 10, MaxPts: 15, Value: "1 pending", FixHint: "sudo apt update && sudo apt upgrade -y"},
				{ID: "ssl_expiry", Status: "pass", Points: 15, MaxPts: 15, Value: "all valid"},
			},
			Certs: []SSLCertInfo{
				{Domain: "db-internal.example.com", Path: "/etc/letsencrypt/live/db-internal.example.com/fullchain.pem", ExpiresAt: now.AddDate(0, 0, 74).Format("2006-01-02"), DaysLeft: 74, Status: "ok"},
			},
		}
	}
	return SecurityAuditReport{
		ServerID:    cfg.ID,
		Score:       72,
		Grade:       "C",
		GeneratedAt: now.Format("2006-01-02 15:04:05"),
		Checks: []SecurityCheckItem{
			{ID: "ssh_root", Status: "pass", Points: 20, MaxPts: 20, Value: "prohibit-password"},
			{ID: "ssh_pass", Status: "warn", Points: 5, MaxPts: 20, Value: "yes", FixHint: "Set PasswordAuthentication no in /etc/ssh/sshd_config"},
			{ID: "fail2ban", Status: "pass", Points: 15, MaxPts: 15, Value: "active"},
			{ID: "firewall", Status: "pass", Points: 15, MaxPts: 15, Value: "ufw"},
			{ID: "updates", Status: "warn", Points: 10, MaxPts: 15, Value: "3 pending", FixHint: "sudo apt update && sudo apt upgrade -y"},
			{ID: "ssl_expiry", Status: "warn", Points: 7, MaxPts: 15, Value: "1 expiring <30d", FixHint: "Run sudo certbot renew --dry-run"},
		},
		Certs: []SSLCertInfo{
			{Domain: "api.zentradeck.demo", Path: "/etc/letsencrypt/live/api.zentradeck.demo/fullchain.pem", ExpiresAt: now.AddDate(0, 0, 12).Format("2006-01-02"), DaysLeft: 12, Status: "expiring"},
			{Domain: "zentradeck.demo", Path: "/etc/letsencrypt/live/zentradeck.demo/fullchain.pem", ExpiresAt: now.AddDate(0, 0, 68).Format("2006-01-02"), DaysLeft: 68, Status: "ok"},
		},
	}
}

// ==============================================================================
// Visual Cron Job & Systemd Timers Manager
// ==============================================================================

func parseUserCronLines(raw string) []CronJobItem {
	lines := strings.Split(strings.ReplaceAll(raw, "\r\n", "\n"), "\n")
	items := make([]CronJobItem, 0)
	lastComment := ""
	for idx, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			lastComment = ""
			continue
		}
		if strings.HasPrefix(trimmed, cronDisabledPrefix) {
			body := strings.TrimSpace(strings.TrimPrefix(trimmed, cronDisabledPrefix))
			if sched, cmd, ok := splitCronExpr(body); ok {
				items = append(items, CronJobItem{
					LineIndex: idx,
					Schedule:  sched,
					Command:   cmd,
					Comment:   lastComment,
					Enabled:   false,
					Source:    "user",
				})
			}
			lastComment = ""
			continue
		}
		if strings.HasPrefix(trimmed, "#") {
			lastComment = strings.TrimSpace(strings.TrimPrefix(trimmed, "#"))
			continue
		}
		if strings.Contains(trimmed, "=") && !strings.Contains(strings.SplitN(trimmed, "=", 2)[0], " ") {
			lastComment = ""
			continue
		}
		if sched, cmd, ok := splitCronExpr(trimmed); ok {
			items = append(items, CronJobItem{
				LineIndex: idx,
				Schedule:  sched,
				Command:   cmd,
				Comment:   lastComment,
				Enabled:   true,
				Source:    "user",
			})
		}
		lastComment = ""
	}
	return items
}

func splitCronExpr(line string) (string, string, bool) {
	fields := strings.Fields(line)
	if len(fields) < 2 {
		return "", "", false
	}
	if strings.HasPrefix(fields[0], "@") {
		cmd := strings.TrimSpace(strings.TrimPrefix(line, fields[0]))
		return fields[0], cmd, cmd != ""
	}
	if len(fields) < 6 {
		return "", "", false
	}
	sched := strings.Join(fields[:5], " ")
	cmd := strings.Join(fields[5:], " ")
	return sched, cmd, true
}

func (a *App) GetScheduledTasks(serverID string) ScheduledTasksReport {
	defer debug.FreeOSMemory()

	rep := ScheduledTasksReport{
		ServerID:    serverID,
		CronJobs:    []CronJobItem{},
		Timers:      []SystemdTimerItem{},
		GeneratedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	cfg, ok := a.findServer(serverID)
	if !ok {
		rep.Error = "server_not_found"
		return rep
	}

	if cfg.IsDemo {
		demoCronMu.Lock()
		lines := initDemoCronIfNeeded(serverID)
		raw := strings.Join(lines, "\n")
		demoCronMu.Unlock()
		rep.CronJobs = parseUserCronLines(raw)
		rep.Timers = []SystemdTimerItem{
			{Unit: "certbot.timer", NextRun: "in 6h 14m", LastRun: "5h 45m ago", Activates: "certbot.service", Active: true},
			{Unit: "sysstat-collect.timer", NextRun: "in 4m 12s", LastRun: "5m 48s ago", Activates: "sysstat-collect.service", Active: true},
			{Unit: "apt-daily-upgrade.timer", NextRun: "in 11h 20m", LastRun: "12h 40m ago", Activates: "apt-daily-upgrade.service", Active: true},
			{Unit: "logrotate.timer", NextRun: "in 7h 50m", LastRun: "16h 10m ago", Activates: "logrotate.service", Active: true},
		}
		return rep
	}

	cmd := `LC_ALL=C sh -c '
echo "===USERCRON==="
crontab -l 2>/dev/null || true
echo "===TIMERS==="
systemctl list-timers --all --no-pager --no-legend 2>/dev/null | head -n 30 || true
'`
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil && strings.TrimSpace(out) == "" {
		rep.Error = err.Error()
		return rep
	}
	sec := splitHistorySections(out)
	rep.CronJobs = parseUserCronLines(sec["USERCRON"])

	for _, line := range strings.Split(sec["TIMERS"], "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}
		unit := ""
		activates := ""
		for i := len(fields) - 1; i >= 0; i-- {
			if strings.HasSuffix(fields[i], ".timer") {
				unit = fields[i]
				if i+1 < len(fields) {
					activates = fields[i+1]
				}
				break
			}
		}
		if unit == "" {
			continue
		}
		nextRun := fields[0]
		if len(fields) > 2 && fields[0] != "n/a" && fields[0] != "-" {
			nextRun = strings.Join(fields[0:3], " ")
		}
		rep.Timers = append(rep.Timers, SystemdTimerItem{
			Unit:      unit,
			NextRun:   nextRun,
			LastRun:   "",
			Activates: activates,
			Active:    nextRun != "n/a" && nextRun != "-",
		})
	}
	return rep
}

func (a *App) readRawUserCrontab(cfg ServerConfig) ([]string, error) {
	if cfg.IsDemo {
		demoCronMu.Lock()
		defer demoCronMu.Unlock()
		src := initDemoCronIfNeeded(cfg.ID)
		cp := make([]string, len(src))
		copy(cp, src)
		return cp, nil
	}
	out, err := a.runSSHCommand(cfg, "crontab -l 2>/dev/null || true")
	if err != nil {
		// The '|| true' suffix guarantees the shell itself exits 0, so err
		// can only be a transport/session failure. Reporting that as an
		// empty crontab would let SaveCronJob's add path replace the whole
		// remote crontab with just the new job, wiping every existing one.
		// (A genuinely empty crontab arrives as err == nil with empty
		// output and is handled below.)
		return nil, err
	}
	raw := strings.ReplaceAll(out, "\r\n", "\n")
	if strings.TrimSpace(raw) == "" {
		return []string{}, nil
	}
	return strings.Split(strings.TrimRight(raw, "\n"), "\n"), nil
}

func (a *App) writeRawUserCrontab(cfg ServerConfig, lines []string) error {
	if cfg.IsDemo {
		demoCronMu.Lock()
		demoCronData[cfg.ID] = lines
		demoCronMu.Unlock()
		return nil
	}
	payload := strings.Join(lines, "\n") + "\n"
	b64 := base64.StdEncoding.EncodeToString([]byte(payload))
	cmd := fmt.Sprintf("printf '%%s' '%s' | base64 -d | crontab -", b64)
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil {
		msg := strings.TrimSpace(out)
		if msg == "" {
			msg = err.Error()
		}
		return fmt.Errorf("%s", msg)
	}
	return nil
}

func (a *App) ToggleCronJob(serverID string, lineIndex int, enable bool) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	lines, err := a.readRawUserCrontab(cfg)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if lineIndex < 0 || lineIndex >= len(lines) {
		return ActionResult{Success: false, Message: "invalid cron line"}
	}
	trimmed := strings.TrimSpace(lines[lineIndex])
	if enable {
		if strings.HasPrefix(trimmed, cronDisabledPrefix) {
			lines[lineIndex] = strings.TrimSpace(strings.TrimPrefix(trimmed, cronDisabledPrefix))
		}
	} else {
		if !strings.HasPrefix(trimmed, cronDisabledPrefix) {
			lines[lineIndex] = cronDisabledPrefix + trimmed
		}
	}
	if err := a.writeRawUserCrontab(cfg, lines); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Crontab updated"}
}

func (a *App) SaveCronJob(serverID string, lineIndex int, schedule, command, comment string) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	schedule = strings.TrimSpace(schedule)
	command = strings.TrimSpace(command)
	comment = strings.TrimSpace(strings.ReplaceAll(comment, "\n", " "))
	if schedule == "" || command == "" || strings.ContainsAny(schedule, "\r\n") || strings.ContainsAny(command, "\r\n") {
		return ActionResult{Success: false, Message: "invalid schedule or command"}
	}
	entry := schedule + " " + command
	lines, err := a.readRawUserCrontab(cfg)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}

	if lineIndex >= 0 && lineIndex < len(lines) {
		wasDisabled := strings.HasPrefix(strings.TrimSpace(lines[lineIndex]), cronDisabledPrefix)
		if wasDisabled {
			lines[lineIndex] = cronDisabledPrefix + entry
		} else {
			lines[lineIndex] = entry
		}
	} else {
		if comment != "" {
			lines = append(lines, "# "+comment)
		}
		lines = append(lines, entry)
	}

	if err := a.writeRawUserCrontab(cfg, lines); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Cron job saved"}
}

func (a *App) DeleteCronJob(serverID string, lineIndex int) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	lines, err := a.readRawUserCrontab(cfg)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if lineIndex < 0 || lineIndex >= len(lines) {
		return ActionResult{Success: false, Message: "invalid cron line"}
	}
	lines = append(lines[:lineIndex], lines[lineIndex+1:]...)
	if err := a.writeRawUserCrontab(cfg, lines); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Cron job deleted"}
}
