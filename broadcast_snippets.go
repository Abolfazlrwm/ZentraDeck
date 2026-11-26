package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"
	"time"
)

type CommandSnippet struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Command     string `json:"command"`
	Category    string `json:"category"` // system | storage | network | docker | security | logs | packages | custom
	Description string `json:"description"`
}

type BroadcastResult struct {
	ServerID   string `json:"serverId"`
	ServerName string `json:"serverName"`
	Success    bool   `json:"success"`
	Output     string `json:"output"`
	Error      string `json:"error"`
	DurationMs int64  `json:"durationMs"`
}

var snippetsMu sync.Mutex

func defaultSnippets() []CommandSnippet {
	return []CommandSnippet{
		// System
		{
			ID:          "builtin-uptime",
			Title:       "Uptime & Load Average",
			Command:     "uptime && uname -sr",
			Category:    "system",
			Description: "Shows how long the server has been running, current CPU load average, and Linux kernel version.",
		},
		{
			ID:          "builtin-mem",
			Title:       "Memory & Top RAM Processes",
			Command:     "free -h && echo '---' && ps aux --sort=-%mem | head -n 8",
			Category:    "system",
			Description: "Displays RAM/Swap usage and lists the top processes consuming the most memory.",
		},
		{
			ID:          "builtin-cpu",
			Title:       "Top CPU Processes",
			Command:     "ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 10",
			Category:    "system",
			Description: "Lists the top 10 processes currently using the highest CPU percentage.",
		},
		// Storage / Disk
		{
			ID:          "builtin-disk",
			Title:       "Disk Usage Summary",
			Command:     "df -hT -x tmpfs -x devtmpfs",
			Category:    "storage",
			Description: "Shows all mounted hard drives/partitions, filesystem type, used space, and free space.",
		},
		{
			ID:          "builtin-du",
			Title:       "Largest Root Folders",
			Command:     "du -h --max-depth=1 /var /home /opt 2>/dev/null | sort -hr | head -n 15",
			Category:    "storage",
			Description: "Finds the largest directories inside /var, /home, and /opt to locate what is filling up your disk.",
		},
		{
			ID:          "builtin-lsblk",
			Title:       "Block Devices & Partitions",
			Command:     "lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT",
			Category:    "storage",
			Description: "Displays a clean tree of physical disks, partitions, sizes, and mount points.",
		},
		// Network
		{
			ID:          "builtin-ports",
			Title:       "Listening TCP/UDP Ports",
			Command:     "ss -tulnp | head -n 25",
			Category:    "network",
			Description: "Lists all open listening network ports and which service is bound to each port.",
		},
		{
			ID:          "builtin-ip",
			Title:       "Network Interfaces & IPs",
			Command:     "ip -brief addr show && echo '---' && ip route | head -n 5",
			Category:    "network",
			Description: "Shows active network interfaces, assigned IP addresses, and default gateway routes.",
		},
		{
			ID:          "builtin-ping",
			Title:       "DNS & Internet Connectivity",
			Command:     "ping -c 3 -W 2 1.1.1.1 && getent hosts github.com",
			Category:    "network",
			Description: "Tests outbound internet latency (Cloudflare 1.1.1.1) and checks if DNS resolution works.",
		},
		// Docker
		{
			ID:          "builtin-docker-ps",
			Title:       "Running Docker Containers",
			Command:     "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
			Category:    "docker",
			Description: "Compact table of all currently running Docker containers, uptime, and exposed ports.",
		},
		{
			ID:          "builtin-docker-stats",
			Title:       "Docker Resource Usage",
			Command:     "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}'",
			Category:    "docker",
			Description: "Takes a single snapshot of CPU, RAM, and network usage for every running container.",
		},
		{
			ID:          "builtin-docker-df",
			Title:       "Docker Disk Footprint",
			Command:     "docker system df",
			Category:    "docker",
			Description: "Shows how much disk space Docker images, containers, volumes, and build cache are using.",
		},
		// Security
		{
			ID:          "builtin-fw",
			Title:       "Firewall Status Check",
			Command:     "ufw status verbose 2>/dev/null || firewall-cmd --state 2>/dev/null || echo 'No UFW/Firewalld active'",
			Category:    "security",
			Description: "Checks whether UFW or Firewalld is active and lists allowed/blocked rules.",
		},
		{
			ID:          "builtin-last-logins",
			Title:       "Recent SSH Logins",
			Command:     "last -n 10 -a",
			Category:    "security",
			Description: "Shows the last 10 successful user logins along with their source IP addresses and timestamps.",
		},
		// Logs & Services
		{
			ID:          "builtin-failed-svc",
			Title:       "Failed Systemd Services",
			Command:     "systemctl --failed --no-pager",
			Category:    "logs",
			Description: "Lists any Linux systemd services that are currently crashed or in a failed state.",
		},
		{
			ID:          "builtin-journal-err",
			Title:       "Recent System Errors (journald)",
			Command:     "journalctl -p err -n 20 --no-pager",
			Category:    "logs",
			Description: "Displays the last 20 error-level log entries recorded by the kernel and system services.",
		},
		// Packages / Updates
		{
			ID:          "builtin-updates",
			Title:       "Check Pending Updates",
			Command:     "apt list --upgradable 2>/dev/null | head -n 25 || dnf check-update -q 2>/dev/null | head -n 25",
			Category:    "packages",
			Description: "Lists available OS package updates without installing anything.",
		},
	}
}

func getSnippetsFilePath() (string, error) {
	dir, err := getVaultDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "snippets.json"), nil
}

func loadSnippetsLocked() []CommandSnippet {
	fp, err := getSnippetsFilePath()
	if err != nil {
		return defaultSnippets()
	}
	data, err := os.ReadFile(fp)
	if err != nil {
		defs := defaultSnippets()
		if b, merr := json.MarshalIndent(defs, "", "  "); merr == nil {
			_ = os.WriteFile(fp, b, 0600)
		}
		return defs
	}
	var list []CommandSnippet
	if err := json.Unmarshal(data, &list); err != nil {
		return defaultSnippets()
	}

	// Merge any newly added builtin snippets + update old builtin categories
	existing := make(map[string]int, len(list))
	for i, item := range list {
		existing[item.ID] = i
	}
	changed := false
	for _, def := range defaultSnippets() {
		if idx, ok := existing[def.ID]; ok {
			if list[idx].Category != def.Category && strings.HasPrefix(def.ID, "builtin-") {
				list[idx].Category = def.Category
				changed = true
			}
		} else {
			list = append(list, def)
			changed = true
		}
	}
	if changed {
		_ = saveSnippetsLocked(list)
	}
	return list
}

func saveSnippetsLocked(list []CommandSnippet) error {
	fp, err := getSnippetsFilePath()
	if err != nil {
		return err
	}
	b, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fp, b, 0600)
}

func (a *App) GetSnippets() []CommandSnippet {
	snippetsMu.Lock()
	defer snippetsMu.Unlock()
	return loadSnippetsLocked()
}

func (a *App) SaveSnippet(sn CommandSnippet) ActionResult {
	snippetsMu.Lock()
	defer snippetsMu.Unlock()

	sn.Title = strings.TrimSpace(sn.Title)
	sn.Command = strings.TrimSpace(sn.Command)
	sn.Description = strings.TrimSpace(sn.Description)
	sn.Category = strings.TrimSpace(sn.Category)
	if sn.Category == "" {
		sn.Category = "custom"
	}
	if sn.Title == "" || sn.Command == "" {
		return ActionResult{Success: false, Message: "title and command are required"}
	}

	list := loadSnippetsLocked()
	if sn.ID == "" {
		sn.ID = fmt.Sprintf("snip-%d", time.Now().UnixNano())
		list = append([]CommandSnippet{sn}, list...)
	} else {
		updated := false
		for i := range list {
			if list[i].ID == sn.ID {
				list[i] = sn
				updated = true
				break
			}
		}
		if !updated {
			list = append([]CommandSnippet{sn}, list...)
		}
	}

	if err := saveSnippetsLocked(list); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Snippet saved"}
}

func (a *App) DeleteSnippet(id string) ActionResult {
	snippetsMu.Lock()
	defer snippetsMu.Unlock()

	list := loadSnippetsLocked()
	next := make([]CommandSnippet, 0, len(list))
	for _, item := range list {
		if item.ID != id {
			next = append(next, item)
		}
	}
	if err := saveSnippetsLocked(next); err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Snippet deleted"}
}

func simulateDemoBroadcast(cfg ServerConfig, command string) (string, int64) {
	lower := strings.ToLower(command)
	switch {
	case strings.Contains(lower, "uptime"):
		return fmt.Sprintf(" 15:42:10 up 24 days,  6:12,  1 user,  load average: 0.42, 0.38, 0.31\nLinux 6.8.0-48-generic (%s)", cfg.Name), 48
	case strings.Contains(lower, "df -h"):
		return "Filesystem     Type      Size  Used Avail Use% Mounted on\n/dev/vda1      ext4       78G   29G   46G  39% /", 62
	case strings.Contains(lower, "lsblk"):
		return "NAME   SIZE TYPE FSTYPE MOUNTPOINT\nvda     80G disk\n└─vda1  79G part ext4   /", 49
	case strings.Contains(lower, "free"):
		return "               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       3.4Gi       1.9Gi       112Mi       2.5Gi       4.1Gi\nSwap:          2.0Gi       120Mi       1.9Gi", 55
	case strings.Contains(lower, "docker"):
		return "NAMES            STATUS          PORTS\nnginx-proxy      Up 14 days      0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp\napi-backend      Up 6 days       0.0.0.0:8080->8080/tcp\npostgres-main    Up 24 days      5432/tcp", 74
	case strings.Contains(lower, "systemctl"):
		return "  UNIT LOAD ACTIVE SUB DESCRIPTION\n0 loaded units listed.", 44
	case strings.Contains(lower, "ss "):
		return "Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port\ntcp   LISTEN 0      128    0.0.0.0:22         0.0.0.0:*\ntcp   LISTEN 0      511    0.0.0.0:80         0.0.0.0:*\ntcp   LISTEN 0      511    0.0.0.0:443        0.0.0.0:*", 51
	default:
		return fmt.Sprintf("[%s demo] Command executed successfully:\n$ %s\nOK", cfg.Name, command), 65
	}
}

func (a *App) BroadcastCommand(serverIDs []string, command string) []BroadcastResult {
	defer debug.FreeOSMemory()

	command = strings.TrimSpace(command)
	if command == "" || len(serverIDs) == 0 {
		return []BroadcastResult{}
	}

	results := make([]BroadcastResult, len(serverIDs))
	var wg sync.WaitGroup
	sem := make(chan struct{}, 6)

	for idx, sid := range serverIDs {
		wg.Add(1)
		go func(i int, serverID string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			cfg, ok := a.findServer(serverID)
			if !ok {
				results[i] = BroadcastResult{
					ServerID:   serverID,
					ServerName: serverID,
					Success:    false,
					Error:      "server_not_found",
				}
				return
			}

			if cfg.IsDemo {
				out, ms := simulateDemoBroadcast(cfg, command)
				results[i] = BroadcastResult{
					ServerID:   cfg.ID,
					ServerName: cfg.Name,
					Success:    true,
					Output:     out,
					DurationMs: ms,
				}
				return
			}

			start := time.Now()
			out, err := a.runSSHCommand(cfg, command)
			ms := time.Since(start).Milliseconds()
			if err != nil {
				results[i] = BroadcastResult{
					ServerID:   cfg.ID,
					ServerName: cfg.Name,
					Success:    false,
					Output:     strings.TrimSpace(out),
					Error:      err.Error(),
					DurationMs: ms,
				}
				return
			}
			results[i] = BroadcastResult{
				ServerID:   cfg.ID,
				ServerName: cfg.Name,
				Success:    true,
				Output:     strings.TrimSpace(out),
				DurationMs: ms,
			}
		}(idx, sid)
	}

	wg.Wait()
	return results
}
