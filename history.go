package main

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type HistoryPoint struct {
	Timestamp   string  `json:"timestamp"`
	FullTime    string  `json:"fullTime"`
	CPUUser     float64 `json:"cpuUser"`
	CPUSystem   float64 `json:"cpuSystem"`
	CPUIOWait   float64 `json:"cpuIOWait"`
	CPUSteal    float64 `json:"cpuSteal"`
	CPUTotal    float64 `json:"cpuTotal"`
	RAMPercent  float64 `json:"ramPercent"`
	SwapPercent float64 `json:"swapPercent"`
	Load1       float64 `json:"load1"`
	Load5       float64 `json:"load5"`
	NetRxKBps   float64 `json:"netRxKBps"`
	NetTxKBps   float64 `json:"netTxKBps"`
}

type HistoryIncident struct {
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Category  string `json:"category"` // reboot | oom | service | ssh_auth
	Severity  string `json:"severity"` // critical | warning | info
	Service   string `json:"service"`
	Summary   string `json:"summary"`
	RawLog    string `json:"rawLog"`
}

type HistoryPeak struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

type HistorySummary struct {
	AvgCPU         float64     `json:"avgCpu"`
	PeakCPU        HistoryPeak `json:"peakCpu"`
	AvgRAM         float64     `json:"avgRam"`
	PeakRAM        HistoryPeak `json:"peakRam"`
	PeakIOWait     HistoryPeak `json:"peakIOWait"`
	PeakSteal      HistoryPeak `json:"peakSteal"`
	PeakLoad       HistoryPeak `json:"peakLoad"`
	PeakNetRx      HistoryPeak `json:"peakNetRx"`
	PeakNetTx      HistoryPeak `json:"peakNetTx"`
	PeakSwap       HistoryPeak `json:"peakSwap"`
	AvgIOWait      float64     `json:"avgIOWait"`
	AvgSteal       float64     `json:"avgSteal"`
	AvgLoad        float64     `json:"avgLoad"`
	StabilityScore int         `json:"stabilityScore"`
	SampleCount    int         `json:"sampleCount"`
	DataSpan       string      `json:"dataSpan"`
}

type HistoryInsight struct {
	Code     string `json:"code"`     // healthy | high_steal | high_iowait | high_cpu | high_ram | oom_events | ssh_bruteforce | service_crashes | reboots
	Severity string `json:"severity"` // good | info | warning | critical
	Metric   string `json:"metric"`
	Detail   string `json:"detail"`
}

type ServerHistoryReport struct {
	ServerID         string            `json:"serverId"`
	Range            string            `json:"range"`
	SysstatInstalled bool              `json:"sysstatInstalled"`
	SysstatActive    bool              `json:"sysstatActive"`
	SysstatDir       string            `json:"sysstatDir"`
	AvailableDays    int               `json:"availableDays"`
	IntervalHint     string            `json:"intervalHint"`
	Points           []HistoryPoint    `json:"points"`
	Summary          HistorySummary    `json:"summary"`
	Incidents        []HistoryIncident `json:"incidents"`
	Insights         []HistoryInsight  `json:"insights"`
	GeneratedAt      string            `json:"generatedAt"`
	Error            string            `json:"error"`
}

var (
	demoSysstatMu     sync.Mutex
	demoSysstatStatus = map[string]bool{}
)

func normalizeHistoryRange(r string) (string, int, string) {
	switch strings.ToLower(strings.TrimSpace(r)) {
	case "7d":
		return "7d", 7, "7 days ago"
	case "30d":
		return "30d", 30, "30 days ago"
	default:
		return "24h", 1, "24 hours ago"
	}
}

func histRound1(v float64) float64 {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return math.Round(v*10) / 10
}

func histRound2(v float64) float64 {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return math.Round(v*100) / 100
}

func (a *App) GetServerHistory(serverID, rangeKey string) ServerHistoryReport {
	defer debug.FreeOSMemory()

	rng, days, sinceArg := normalizeHistoryRange(rangeKey)
	report := ServerHistoryReport{
		ServerID:    serverID,
		Range:       rng,
		Points:      []HistoryPoint{},
		Incidents:   []HistoryIncident{},
		Insights:    []HistoryInsight{},
		GeneratedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	cfg, ok := a.findServer(serverID)
	if !ok {
		report.Error = "server_not_found"
		return report
	}

	if cfg.IsDemo {
		return a.buildDemoHistoryReport(cfg, rng, days)
	}

	// Check online / run combined read-only collection over existing SSH connection
	fileLimit := days + 1
	if fileLimit > 31 {
		fileLimit = 31
	}

	script := fmt.Sprintf(`LC_ALL=C sh -c '
echo "===META==="
SADF=$(command -v sadf 2>/dev/null || true)
echo "SADF=$SADF"
DIR=""
if [ -d /var/log/sysstat ]; then DIR=/var/log/sysstat
elif [ -d /var/log/sa ]; then DIR=/var/log/sa
fi
echo "DIR=$DIR"
ACTIVE=0
if [ -n "$SADF" ] && [ -n "$DIR" ]; then
  if systemctl is-active --quiet sysstat 2>/dev/null || systemctl is-active --quiet sysstat-collect.timer 2>/dev/null || grep -qs "^ENABLED=\"true\"" /etc/default/sysstat 2>/dev/null || [ -f /etc/cron.d/sysstat ]; then
    ACTIVE=1
  fi
fi
FILES=""
COUNT=0
if [ -n "$DIR" ]; then
  FILES=$(ls -1t "$DIR"/sa[0-9][0-9] 2>/dev/null | head -n %d || true)
  COUNT=$(ls -1 "$DIR"/sa[0-9][0-9] 2>/dev/null | wc -l | tr -d " ")
fi
echo "ACTIVE=$ACTIVE"
echo "COUNT=$COUNT"
if [ -n "$SADF" ] && [ -n "$FILES" ]; then
  echo "===CPU==="
  for f in $FILES; do sadf -d "$f" -- -u 2>/dev/null || true; done
  echo "===MEM==="
  for f in $FILES; do sadf -d "$f" -- -r 2>/dev/null || true; done
  echo "===SWAP==="
  for f in $FILES; do sadf -d "$f" -- -S 2>/dev/null || true; done
  echo "===LOAD==="
  for f in $FILES; do sadf -d "$f" -- -q 2>/dev/null || true; done
  echo "===NET==="
  for f in $FILES; do sadf -d "$f" -- -n DEV 2>/dev/null || true; done
fi
echo "===REBOOTS==="
last -x -F -n 12 reboot 2>/dev/null | grep "^reboot" || true
echo "===OOM==="
journalctl -k --since "%s" --no-pager --output=short-iso -n 200 2>/dev/null | grep -iE "out of memory|oom-killer|killed process" | tail -n 20 || true
echo "===SVCERR==="
journalctl -p err..emerg --since "%s" --no-pager --output=short-iso -n 200 2>/dev/null | grep -iE "failed|segfault|core-dump|entered failed|main process exited|panic" | tail -n 25 || true
echo "===SSHAUTH==="
journalctl -u ssh -u sshd --since "%s" --no-pager --output=short-iso -n 300 2>/dev/null | grep -iE "failed password|invalid user|authentication failure" | tail -n 120 || true
'`, fileLimit, sinceArg, sinceArg, sinceArg)

	out, err := a.runSSHCommand(cfg, script)
	if err != nil && strings.TrimSpace(out) == "" {
		report.Error = err.Error()
		return report
	}

	sections := splitHistorySections(out)
	parseMetaSection(sections["META"], &report)

	cutoff := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	if report.SysstatInstalled {
		pts := parseSadfSections(sections, cutoff, rng)
		report.Points = downsampleHistoryPoints(pts, 144)
		if len(report.Points) > 0 && !report.SysstatActive {
			report.SysstatActive = true
		}
		if len(report.Points) >= 2 {
			report.IntervalHint = "sysstat / sar"
		}
	}

	report.Incidents = parseIncidentsSections(sections, cutoff)
	report.Summary = computeHistorySummary(report.Points, rng)
	report.Insights = buildHistoryInsights(report.Summary, report.Incidents, report.SysstatActive)
	return report
}

func (a *App) EnableSysstat(serverID string) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}

	if cfg.IsDemo {
		demoSysstatMu.Lock()
		demoSysstatStatus[serverID] = true
		demoSysstatMu.Unlock()
		return ActionResult{
			Success: true,
			Message: "sysstat enabled on demo server (0 MB resident RAM, timer active)",
		}
	}

	// Attempt non-interactive root or passwordless sudo setup of official sysstat package
	cmd := `sh -c '
SUDO=""
if [ "$(id -u)" != "0" ]; then
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    SUDO="sudo -n"
  else
    echo "NEED_SUDO"
    exit 42
  fi
fi
if command -v apt-get >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive $SUDO apt-get update -qq && DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq sysstat
  if [ -f /etc/default/sysstat ]; then
    $SUDO sed -i "s/^ENABLED=\"false\"/ENABLED=\"true\"/" /etc/default/sysstat
  fi
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y -q sysstat
elif command -v yum >/dev/null 2>&1; then
  $SUDO yum install -y -q sysstat
elif command -v pacman >/dev/null 2>&1; then
  $SUDO pacman -Sy --noconfirm sysstat
elif command -v apk >/dev/null 2>&1; then
  $SUDO apk add --no-cache sysstat
else
  echo "UNSUPPORTED_PKG_MGR"
  exit 43
fi
$SUDO systemctl enable --now sysstat 2>/dev/null || true
$SUDO systemctl enable --now sysstat-collect.timer 2>/dev/null || true
if [ -x /usr/lib/sysstat/sa1 ]; then
  $SUDO /usr/lib/sysstat/sa1 1 1 2>/dev/null || true
elif [ -x /usr/lib64/sa/sa1 ]; then
  $SUDO /usr/lib64/sa/sa1 1 1 2>/dev/null || true
fi
echo "SYSSTAT_READY"
'`
	out, err := a.runSSHCommand(cfg, cmd)
	if strings.Contains(out, "NEED_SUDO") {
		return ActionResult{
			Success: false,
			Message: "Sudo password required. Run in Terminal: sudo apt update && sudo apt install -y sysstat && sudo sed -i 's/ENABLED=\"false\"/ENABLED=\"true\"/' /etc/default/sysstat && sudo systemctl enable --now sysstat",
		}
	}
	if strings.Contains(out, "UNSUPPORTED_PKG_MGR") {
		return ActionResult{
			Success: false,
			Message: "Unsupported package manager. Please install the official 'sysstat' package manually via Terminal.",
		}
	}
	if err != nil && !strings.Contains(out, "SYSSTAT_READY") {
		msg := strings.TrimSpace(out)
		if msg == "" {
			msg = err.Error()
		}
		if len(msg) > 220 {
			msg = msg[:220]
		}
		return ActionResult{Success: false, Message: msg}
	}
	return ActionResult{
		Success: true,
		Message: "Official sysstat package enabled. First historical samples will appear within 5-10 minutes.",
	}
}

func splitHistorySections(out string) map[string]string {
	res := make(map[string]string)
	current := ""
	var buf strings.Builder
	for _, line := range strings.Split(strings.ReplaceAll(out, "\r\n", "\n"), "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "===") && strings.HasSuffix(trimmed, "===") && len(trimmed) > 6 {
			if current != "" {
				res[current] = buf.String()
			}
			current = strings.Trim(trimmed, "=")
			buf.Reset()
			continue
		}
		if current != "" {
			buf.WriteString(line)
			buf.WriteByte('\n')
		}
	}
	if current != "" {
		res[current] = buf.String()
	}
	return res
}

func parseMetaSection(raw string, report *ServerHistoryReport) {
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "SADF=") {
			report.SysstatInstalled = strings.TrimSpace(strings.TrimPrefix(line, "SADF=")) != ""
		} else if strings.HasPrefix(line, "DIR=") {
			report.SysstatDir = strings.TrimSpace(strings.TrimPrefix(line, "DIR="))
		} else if strings.HasPrefix(line, "ACTIVE=") {
			report.SysstatActive = strings.TrimSpace(strings.TrimPrefix(line, "ACTIVE=")) == "1"
		} else if strings.HasPrefix(line, "COUNT=") {
			if n, err := strconv.Atoi(strings.TrimSpace(strings.TrimPrefix(line, "COUNT="))); err == nil {
				report.AvailableDays = n
			}
		}
	}
}

type sadfBucket struct {
	ts    time.Time
	point HistoryPoint
}

func parseSadfTime(raw string) (time.Time, bool) {
	raw = strings.TrimSpace(raw)
	layouts := []string{
		"2006-01-02 15:04:05 UTC",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}
	for _, l := range layouts {
		if t, err := time.Parse(l, raw); err == nil {
			return t.Local(), true
		}
	}
	return time.Time{}, false
}

func parseFloatSafe(s string) float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", "."))
	v, err := strconv.ParseFloat(s, 64)
	if err != nil || math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return v
}

func formatChartTime(t time.Time, rng string) string {
	if rng == "24h" {
		return t.Format("15:04")
	}
	return t.Format("Jan 02 15:04")
}

func parseSadfSections(sections map[string]string, cutoff time.Time, rng string) []HistoryPoint {
	buckets := make(map[int64]*sadfBucket)
	getBucket := func(t time.Time) *sadfBucket {
		// Align to nearest minute so CPU/MEM/LOAD/NET join cleanly
		aligned := t.Truncate(time.Minute)
		key := aligned.Unix()
		if b, exists := buckets[key]; exists {
			return b
		}
		b := &sadfBucket{
			ts: aligned,
			point: HistoryPoint{
				Timestamp: formatChartTime(aligned, rng),
				FullTime:  aligned.Format("2006-01-02 15:04"),
			},
		}
		buckets[key] = b
		return b
	}

	parseTable := func(raw string, handler func(cols map[string]int, fields []string, b *sadfBucket)) {
		cols := make(map[string]int)
		for _, line := range strings.Split(raw, "\n") {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			if strings.HasPrefix(line, "#") {
				cols = make(map[string]int)
				hdr := strings.TrimSpace(strings.TrimPrefix(line, "#"))
				for idx, name := range strings.Split(hdr, ";") {
					cols[strings.TrimSpace(name)] = idx
				}
				continue
			}
			if len(cols) == 0 {
				continue
			}
			fields := strings.Split(line, ";")
			tsIdx, ok := cols["timestamp"]
			if !ok || tsIdx >= len(fields) {
				continue
			}
			t, ok := parseSadfTime(fields[tsIdx])
			if !ok || t.Before(cutoff) {
				continue
			}
			handler(cols, fields, getBucket(t))
		}
	}

	// CPU
	parseTable(sections["CPU"], func(cols map[string]int, f []string, b *sadfBucket) {
		if idx, ok := cols["CPU"]; ok && idx < len(f) {
			cpuVal := strings.TrimSpace(f[idx])
			if cpuVal != "-1" && cpuVal != "all" {
				return
			}
		}
		var u, s, io, st, idle float64
		if idx, ok := cols["%user"]; ok && idx < len(f) {
			u = parseFloatSafe(f[idx])
		}
		if idx, ok := cols["%nice"]; ok && idx < len(f) {
			u += parseFloatSafe(f[idx])
		}
		if idx, ok := cols["%system"]; ok && idx < len(f) {
			s = parseFloatSafe(f[idx])
		}
		if idx, ok := cols["%iowait"]; ok && idx < len(f) {
			io = parseFloatSafe(f[idx])
		}
		if idx, ok := cols["%steal"]; ok && idx < len(f) {
			st = parseFloatSafe(f[idx])
		}
		if idx, ok := cols["%idle"]; ok && idx < len(f) {
			idle = parseFloatSafe(f[idx])
		}
		total := 100.0 - idle
		if total < 0 {
			total = u + s + io + st
		}
		if total > 100 {
			total = 100
		}
		b.point.CPUUser = histRound1(u)
		b.point.CPUSystem = histRound1(s)
		b.point.CPUIOWait = histRound1(io)
		b.point.CPUSteal = histRound1(st)
		b.point.CPUTotal = histRound1(total)
	})

	// Memory
	parseTable(sections["MEM"], func(cols map[string]int, f []string, b *sadfBucket) {
		if idx, ok := cols["%memused"]; ok && idx < len(f) {
			b.point.RAMPercent = histRound1(parseFloatSafe(f[idx]))
		}
	})

	// Swap
	parseTable(sections["SWAP"], func(cols map[string]int, f []string, b *sadfBucket) {
		if idx, ok := cols["%swpused"]; ok && idx < len(f) {
			b.point.SwapPercent = histRound1(parseFloatSafe(f[idx]))
		}
	})

	// Load
	parseTable(sections["LOAD"], func(cols map[string]int, f []string, b *sadfBucket) {
		if idx, ok := cols["ldavg-1"]; ok && idx < len(f) {
			b.point.Load1 = histRound2(parseFloatSafe(f[idx]))
		}
		if idx, ok := cols["ldavg-5"]; ok && idx < len(f) {
			b.point.Load5 = histRound2(parseFloatSafe(f[idx]))
		}
	})

	// Network (sum non-loopback interfaces)
	parseTable(sections["NET"], func(cols map[string]int, f []string, b *sadfBucket) {
		if idx, ok := cols["IFACE"]; ok && idx < len(f) {
			iface := strings.TrimSpace(f[idx])
			if iface == "lo" || strings.HasPrefix(iface, "veth") || strings.HasPrefix(iface, "br-") {
				return
			}
		}
		if idx, ok := cols["rxkB/s"]; ok && idx < len(f) {
			b.point.NetRxKBps = histRound1(b.point.NetRxKBps + parseFloatSafe(f[idx]))
		}
		if idx, ok := cols["txkB/s"]; ok && idx < len(f) {
			b.point.NetTxKBps = histRound1(b.point.NetTxKBps + parseFloatSafe(f[idx]))
		}
	})

	keys := make([]int64, 0, len(buckets))
	for k := range buckets {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })

	points := make([]HistoryPoint, 0, len(keys))
	for _, k := range keys {
		points = append(points, buckets[k].point)
	}
	return points
}

func downsampleHistoryPoints(pts []HistoryPoint, maxPts int) []HistoryPoint {
	if len(pts) <= maxPts || maxPts < 10 {
		return pts
	}
	step := float64(len(pts)) / float64(maxPts)
	out := make([]HistoryPoint, 0, maxPts)
	for i := 0; i < maxPts; i++ {
		start := int(math.Floor(float64(i) * step))
		end := int(math.Floor(float64(i+1) * step))
		if end <= start {
			end = start + 1
		}
		if end > len(pts) {
			end = len(pts)
		}
		// Pick representative point with max CPU in bucket so spikes are never hidden
		best := pts[start]
		for j := start + 1; j < end; j++ {
			if pts[j].CPUTotal > best.CPUTotal {
				best = pts[j]
			}
		}
		out = append(out, best)
	}
	return out
}

func extractJournalIsoTime(line string) (string, string) {
	fields := strings.Fields(line)
	if len(fields) < 3 {
		return "", line
	}
	ts := fields[0]
	if t, err := time.Parse("2006-01-02T15:04:05-0700", ts); err == nil {
		return t.Local().Format("2006-01-02 15:04"), strings.Join(fields[2:], " ")
	}
	if t, err := time.Parse(time.RFC3339, ts); err == nil {
		return t.Local().Format("2006-01-02 15:04"), strings.Join(fields[2:], " ")
	}
	return "", line
}

var lastWeekdayAbbr = map[string]bool{
	"Mon": true, "Tue": true, "Wed": true, "Thu": true,
	"Fri": true, "Sat": true, "Sun": true,
}

var lastMonthAbbr = map[string]bool{
	"Jan": true, "Feb": true, "Mar": true, "Apr": true, "May": true,
	"Jun": true, "Jul": true, "Aug": true, "Sep": true, "Oct": true,
	"Nov": true, "Dec": true,
}

// parseLastRebootTime extracts the boot timestamp from a `last -x -F` reboot
// line such as:
//
//	reboot   system boot  6.8.0-45-generic Tue Nov 24 03:12:04 2026 - Wed Nov 24 03:34:56 2026  (0+00:22)
//
// The boot time is the first "<weekday> <month> <day> <hh:mm:ss> <year>" run
// anywhere in the line (the end-of-session date has the same shape and must
// not be picked instead).
func parseLastRebootTime(line string) (time.Time, bool) {
	fields := strings.Fields(line)
	for i := 0; i+5 <= len(fields); i++ {
		if !lastWeekdayAbbr[fields[i]] || !lastMonthAbbr[fields[i+1]] {
			continue
		}
		dateStr := strings.Join(fields[i:i+5], " ")
		if t, err := time.Parse("Mon Jan 2 15:04:05 2006", dateStr); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func parseIncidentsSections(sections map[string]string, cutoff time.Time) []HistoryIncident {
	incidents := make([]HistoryIncident, 0, 32)
	seq := 0
	nextID := func(prefix string) string {
		seq++
		return fmt.Sprintf("%s-%d", prefix, seq)
	}

	// 1. Reboots
	for _, line := range strings.Split(sections["REBOOTS"], "\n") {
		line = strings.TrimSpace(line)
		if line == "" || !strings.HasPrefix(line, "reboot") {
			continue
		}
		ts := ""
		if t, ok := parseLastRebootTime(line); ok {
			if t.Before(cutoff) {
				continue
			}
			ts = t.Format("2006-01-02 15:04")
		}
		if ts == "" {
			ts = time.Now().Format("2006-01-02 15:04")
		}
		incidents = append(incidents, HistoryIncident{
			ID:        nextID("reboot"),
			Timestamp: ts,
			Category:  "reboot",
			Severity:  "warning",
			Service:   "kernel",
			Summary:   "System reboot recorded",
			RawLog:    line,
		})
	}

	// 2. OOM Killer
	for _, line := range strings.Split(sections["OOM"], "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		ts, msg := extractJournalIsoTime(line)
		incidents = append(incidents, HistoryIncident{
			ID:        nextID("oom"),
			Timestamp: ts,
			Category:  "oom",
			Severity:  "critical",
			Service:   "kernel-oom",
			Summary:   "Kernel OOM Killer terminated a process due to memory exhaustion",
			RawLog:    msg,
		})
	}

	// 3. Systemd / Service crashes
	for _, line := range strings.Split(sections["SVCERR"], "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		ts, msg := extractJournalIsoTime(line)
		svc := "systemd"
		if colon := strings.Index(msg, ":"); colon > 0 && colon < 48 {
			svc = strings.TrimSpace(msg[:colon])
		}
		incidents = append(incidents, HistoryIncident{
			ID:        nextID("svc"),
			Timestamp: ts,
			Category:  "service",
			Severity:  "warning",
			Service:   svc,
			Summary:   "Service error or unexpected exit detected in journald",
			RawLog:    msg,
		})
	}

	// 4. SSH Auth bursts (aggregate to avoid spamming timeline)
	sshLines := make([]string, 0)
	for _, line := range strings.Split(sections["SSHAUTH"], "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			sshLines = append(sshLines, line)
		}
	}
	if len(sshLines) >= 3 {
		ts, lastMsg := extractJournalIsoTime(sshLines[len(sshLines)-1])
		sev := "info"
		if len(sshLines) >= 15 {
			sev = "warning"
		}
		incidents = append(incidents, HistoryIncident{
			ID:        nextID("ssh"),
			Timestamp: ts,
			Category:  "ssh_auth",
			Severity:  sev,
			Service:   "sshd",
			Summary:   fmt.Sprintf("%d failed SSH authentication attempts detected", len(sshLines)),
			RawLog:    lastMsg,
		})
	}

	sort.Slice(incidents, func(i, j int) bool {
		return incidents[i].Timestamp > incidents[j].Timestamp
	})
	return incidents
}

func computeHistorySummary(pts []HistoryPoint, rng string) HistorySummary {
	sum := HistorySummary{
		SampleCount:    len(pts),
		DataSpan:       rng,
		StabilityScore: 100,
	}
	if len(pts) == 0 {
		return sum
	}
	var cpuTotal, ramTotal, ioTotal, stealTotal, loadTotal float64
	for _, p := range pts {
		cpuTotal += p.CPUTotal
		ramTotal += p.RAMPercent
		ioTotal += p.CPUIOWait
		stealTotal += p.CPUSteal
		loadTotal += p.Load1
		if p.CPUTotal > sum.PeakCPU.Value {
			sum.PeakCPU = HistoryPeak{Value: p.CPUTotal, Timestamp: p.FullTime}
		}
		if p.RAMPercent > sum.PeakRAM.Value {
			sum.PeakRAM = HistoryPeak{Value: p.RAMPercent, Timestamp: p.FullTime}
		}
		if p.SwapPercent > sum.PeakSwap.Value {
			sum.PeakSwap = HistoryPeak{Value: p.SwapPercent, Timestamp: p.FullTime}
		}
		if p.CPUIOWait > sum.PeakIOWait.Value {
			sum.PeakIOWait = HistoryPeak{Value: p.CPUIOWait, Timestamp: p.FullTime}
		}
		if p.CPUSteal > sum.PeakSteal.Value {
			sum.PeakSteal = HistoryPeak{Value: p.CPUSteal, Timestamp: p.FullTime}
		}
		if p.Load1 > sum.PeakLoad.Value {
			sum.PeakLoad = HistoryPeak{Value: p.Load1, Timestamp: p.FullTime}
		}
		if p.NetRxKBps > sum.PeakNetRx.Value {
			sum.PeakNetRx = HistoryPeak{Value: p.NetRxKBps, Timestamp: p.FullTime}
		}
		if p.NetTxKBps > sum.PeakNetTx.Value {
			sum.PeakNetTx = HistoryPeak{Value: p.NetTxKBps, Timestamp: p.FullTime}
		}
	}
	n := float64(len(pts))
	sum.AvgCPU = histRound1(cpuTotal / n)
	sum.AvgRAM = histRound1(ramTotal / n)
	sum.AvgIOWait = histRound1(ioTotal / n)
	sum.AvgSteal = histRound1(stealTotal / n)
	sum.AvgLoad = histRound2(loadTotal / n)
	sum.DataSpan = pts[0].FullTime + " -> " + pts[len(pts)-1].FullTime

	// Compute overall Stability Score (0-100)
	score := 100
	if sum.PeakCPU.Value >= 90 {
		score -= 12
	} else if sum.PeakCPU.Value >= 80 {
		score -= 6
	}
	if sum.PeakRAM.Value >= 90 {
		score -= 15
	} else if sum.PeakRAM.Value >= 85 {
		score -= 8
	}
	if sum.PeakSwap.Value >= 30 {
		score -= 8
	}
	if sum.PeakIOWait.Value >= 20 {
		score -= 14
	} else if sum.PeakIOWait.Value >= 10 {
		score -= 7
	}
	if sum.PeakSteal.Value >= 10 {
		score -= 14
	} else if sum.PeakSteal.Value >= 5 {
		score -= 8
	}
	if sum.PeakLoad.Value >= 4.0 {
		score -= 8
	}
	if score < 10 {
		score = 10
	}
	sum.StabilityScore = score
	return sum
}

func buildHistoryInsights(s HistorySummary, incidents []HistoryIncident, sysstatActive bool) []HistoryInsight {
	insights := make([]HistoryInsight, 0, 10)

	oomCount := 0
	svcCount := 0
	rebootCount := 0
	sshCount := 0
	for _, inc := range incidents {
		switch inc.Category {
		case "oom":
			oomCount++
		case "service":
			svcCount++
		case "reboot":
			rebootCount++
		case "ssh_auth":
			sshCount++
		}
	}

	if oomCount > 0 {
		insights = append(insights, HistoryInsight{
			Code:     "oom_events",
			Severity: "critical",
			Metric:   strconv.Itoa(oomCount),
			Detail:   s.PeakRAM.Timestamp,
		})
	}
	if sysstatActive && s.PeakSteal.Value >= 5.0 {
		sev := "warning"
		if s.PeakSteal.Value >= 12.0 {
			sev = "critical"
		}
		insights = append(insights, HistoryInsight{
			Code:     "high_steal",
			Severity: sev,
			Metric:   fmt.Sprintf("%.1f%%", s.PeakSteal.Value),
			Detail:   s.PeakSteal.Timestamp,
		})
	}
	if sysstatActive && s.PeakIOWait.Value >= 10.0 {
		sev := "warning"
		if s.PeakIOWait.Value >= 20.0 {
			sev = "critical"
		}
		insights = append(insights, HistoryInsight{
			Code:     "high_iowait",
			Severity: sev,
			Metric:   fmt.Sprintf("%.1f%%", s.PeakIOWait.Value),
			Detail:   s.PeakIOWait.Timestamp,
		})
	}
	if sysstatActive && s.PeakCPU.Value >= 75.0 {
		sev := "warning"
		if s.PeakCPU.Value >= 90.0 {
			sev = "critical"
		}
		insights = append(insights, HistoryInsight{
			Code:     "high_cpu",
			Severity: sev,
			Metric:   fmt.Sprintf("%.1f%%", s.PeakCPU.Value),
			Detail:   s.PeakCPU.Timestamp,
		})
	}
	if sysstatActive && s.PeakRAM.Value >= 80.0 {
		sev := "warning"
		if s.PeakRAM.Value >= 92.0 {
			sev = "critical"
		}
		insights = append(insights, HistoryInsight{
			Code:     "high_ram",
			Severity: sev,
			Metric:   fmt.Sprintf("%.1f%%", s.PeakRAM.Value),
			Detail:   s.PeakRAM.Timestamp,
		})
	}
	if sysstatActive && s.PeakSwap.Value >= 15.0 {
		insights = append(insights, HistoryInsight{
			Code:     "swap_pressure",
			Severity: "warning",
			Metric:   fmt.Sprintf("%.1f%%", s.PeakSwap.Value),
			Detail:   s.PeakSwap.Timestamp,
		})
	}
	if sysstatActive && s.PeakLoad.Value >= 2.5 {
		insights = append(insights, HistoryInsight{
			Code:     "high_load",
			Severity: "warning",
			Metric:   fmt.Sprintf("%.2f", s.PeakLoad.Value),
			Detail:   s.PeakLoad.Timestamp,
		})
	}
	if sysstatActive && (s.PeakNetRx.Value >= 4096 || s.PeakNetTx.Value >= 4096) {
		maxNet := s.PeakNetRx.Value
		netTime := s.PeakNetRx.Timestamp
		if s.PeakNetTx.Value > maxNet {
			maxNet = s.PeakNetTx.Value
			netTime = s.PeakNetTx.Timestamp
		}
		insights = append(insights, HistoryInsight{
			Code:     "net_burst",
			Severity: "info",
			Metric:   fmt.Sprintf("%.1f MB/s", maxNet/1024.0),
			Detail:   netTime,
		})
	}
	if svcCount > 0 {
		insights = append(insights, HistoryInsight{
			Code:     "service_crashes",
			Severity: "warning",
			Metric:   strconv.Itoa(svcCount),
			Detail:   "",
		})
	}
	if sshCount > 0 {
		insights = append(insights, HistoryInsight{
			Code:     "ssh_bruteforce",
			Severity: "info",
			Metric:   strconv.Itoa(sshCount),
			Detail:   "",
		})
	}
	if rebootCount > 0 {
		insights = append(insights, HistoryInsight{
			Code:     "reboots",
			Severity: "info",
			Metric:   strconv.Itoa(rebootCount),
			Detail:   "",
		})
	}

	if len(insights) == 0 {
		insights = append(insights, HistoryInsight{
			Code:     "healthy",
			Severity: "good",
			Metric:   fmt.Sprintf("%d/100", s.StabilityScore),
			Detail:   "",
		})
	}
	return insights
}

// ==============================================================================
// Demo Sandbox Realistic Historical Data Generator
// ==============================================================================
func (a *App) buildDemoHistoryReport(cfg ServerConfig, rng string, days int) ServerHistoryReport {
	now := time.Now().Truncate(time.Minute)

	// Determine demo server profile (0=Prod API, 1=DB/Worker, 2=Edge/Optional Sysstat showcase)
	profile := 0
	lowerID := strings.ToLower(cfg.ID + " " + cfg.Name)
	if strings.Contains(lowerID, "db") || strings.Contains(lowerID, "2") || strings.Contains(lowerID, "staging") {
		profile = 1
	} else if strings.Contains(lowerID, "3") || strings.Contains(lowerID, "edge") || strings.Contains(lowerID, "backup") || strings.Contains(lowerID, "dev") {
		profile = 2
	}

	demoSysstatMu.Lock()
	enabled, hasOverride := demoSysstatStatus[cfg.ID]
	demoSysstatMu.Unlock()
	if !hasOverride {
		enabled = profile != 2 // 3rd demo server starts with sysstat OFF so user can test 1-click optional setup
	}

	report := ServerHistoryReport{
		ServerID:         cfg.ID,
		Range:            rng,
		SysstatInstalled: enabled,
		SysstatActive:    enabled,
		SysstatDir:       "/var/log/sysstat",
		AvailableDays:    0,
		IntervalHint:     "10m (sysstat demo)",
		Points:           []HistoryPoint{},
		Incidents:        []HistoryIncident{},
		GeneratedAt:      now.Format("2006-01-02 15:04:05"),
	}

	if enabled {
		report.AvailableDays = 30
		count := 72
		step := 20 * time.Minute
		if rng == "7d" {
			count = 84
			step = 2 * time.Hour
			report.IntervalHint = "2h bucket (7d sysstat)"
		} else if rng == "30d" {
			count = 90
			step = 8 * time.Hour
			report.IntervalHint = "8h bucket (30d sysstat)"
		}

		pts := make([]HistoryPoint, 0, count)
		for i := count - 1; i >= 0; i-- {
			t := now.Add(-time.Duration(i) * step)
			phase := float64(count-i) / float64(count)
			wave := math.Sin(phase*math.Pi*4.0) * 8.0
			micro := math.Cos(phase*math.Pi*13.0) * 3.2

			var user, sys, iow, steal, ram, swap, load1, rx, tx float64
			switch profile {
			case 0: // Production API: traffic spike + mild host steal + OOM spike near 70%
				user = 22 + wave + micro
				sys = 6.5 + math.Abs(micro)*0.6
				iow = 2.4 + math.Abs(math.Sin(phase*9))*2.0
				steal = 0.8 + math.Abs(math.Sin(phase*7))*1.2
				ram = 54 + wave*0.9
				swap = 6
				rx = 1850 + wave*140
				tx = 3200 + wave*210
				if i >= count/4 && i <= count/4+3 {
					// Realistic traffic surge + host oversell steal spike
					boost := float64(4-(i-count/4)) * 11.5
					user += boost
					sys += 6.2
					steal += 6.9
					ram += 29.5
					swap += 18.0
					rx += 4200
					tx += 7800
				}
			case 1: // Database / Worker: nightly backup I/O Wait spike
				user = 16 + wave*0.7 + micro
				sys = 5.0 + math.Abs(micro)*0.5
				iow = 4.2 + math.Abs(math.Sin(phase*6))*3.0
				steal = 0.4
				ram = 66 + wave*0.5
				swap = 3.5
				rx = 940 + wave*80
				tx = 1120 + wave*95
				if i >= count/2 && i <= count/2+4 {
					iow += 18.8
					sys += 5.4
					user += 9.0
					ram += 11.0
					rx += 2600
				}
			default: // Edge / Dev after 1-click enable
				user = 11 + wave*0.5 + micro*0.6
				sys = 3.2 + math.Abs(micro)*0.4
				iow = 1.4
				steal = 0.3
				ram = 34 + wave*0.4
				swap = 1.0
				rx = 620 + wave*60
				tx = 880 + wave*70
			}

			user = math.Max(1.2, math.Min(82, user))
			sys = math.Max(0.8, math.Min(22, sys))
			iow = math.Max(0.2, math.Min(35, iow))
			steal = math.Max(0.0, math.Min(24, steal))
			total := math.Min(99.2, user+sys+iow+steal)
			ram = math.Max(14, math.Min(95.4, ram))
			swap = math.Max(0, math.Min(65, swap))
			load1 = histRound2((total/100.0)*3.8 + iow*0.04)

			pts = append(pts, HistoryPoint{
				Timestamp:   formatChartTime(t, rng),
				FullTime:    t.Format("2006-01-02 15:04"),
				CPUUser:     histRound1(user),
				CPUSystem:   histRound1(sys),
				CPUIOWait:   histRound1(iow),
				CPUSteal:    histRound1(steal),
				CPUTotal:    histRound1(total),
				RAMPercent:  histRound1(ram),
				SwapPercent: histRound1(swap),
				Load1:       load1,
				Load5:       histRound2(load1 * 0.88),
				NetRxKBps:   histRound1(math.Max(20, rx)),
				NetTxKBps:   histRound1(math.Max(20, tx)),
			})
		}
		report.Points = pts
	}

	// Layer 1 incidents (always present even if sysstat is OFF!)
	switch profile {
	case 0:
		report.Incidents = []HistoryIncident{
			{
				ID:        "demo-oom-1",
				Timestamp: now.Add(-6 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "oom",
				Severity:  "critical",
				Service:   "kernel-oom",
				Summary:   "Kernel OOM Killer terminated worker process (node) during traffic spike",
				RawLog:    "kernel: Out of memory: Killed process 18422 (node) total-vm:3145728kB, anon-rss:2412104kB, oom_score_adj:0",
			},
			{
				ID:        "demo-ssh-1",
				Timestamp: now.Add(-3 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "ssh_auth",
				Severity:  "warning",
				Service:   "sshd",
				Summary:   "27 failed SSH authentication attempts detected (blocked by fail2ban)",
				RawLog:    "sshd[9412]: Failed password for invalid user admin from 185.220.101.45 port 52410 ssh2",
			},
			{
				ID:        "demo-svc-1",
				Timestamp: now.Add(-14 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "service",
				Severity:  "warning",
				Service:   "redis-server.service",
				Summary:   "Background BGSAVE warning and automatic systemd restart completed",
				RawLog:    "systemd[1]: redis-server.service: Main process exited, code=killed, status=9/KILL; Scheduled restart job",
			},
		}
	case 1:
		report.Incidents = []HistoryIncident{
			{
				ID:        "demo-reboot-1",
				Timestamp: now.Add(-18 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "reboot",
				Severity:  "warning",
				Service:   "kernel",
				Summary:   "System reboot recorded after unattended kernel security update",
				RawLog:    "reboot   system boot  6.8.0-48-generic " + now.Add(-18*time.Hour).Format("Mon Jan 2 15:04:05 2006") + "   still running",
			},
			{
				ID:        "demo-svc-2",
				Timestamp: now.Add(-9 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "service",
				Severity:  "warning",
				Service:   "postgresql.service",
				Summary:   "High disk I/O checkpoint delay logged during nightly pg_dump",
				RawLog:    "postgresql[2210]: LOG: checkpoints are occurring too frequently (18 seconds apart)",
			},
		}
	default:
		report.Incidents = []HistoryIncident{
			{
				ID:        "demo-ssh-3",
				Timestamp: now.Add(-4 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "ssh_auth",
				Severity:  "info",
				Service:   "sshd",
				Summary:   "9 failed SSH authentication attempts detected from automated scanner",
				RawLog:    "sshd[4012]: Invalid user ubuntu from 45.155.205.91 port 41102",
			},
			{
				ID:        "demo-reboot-3",
				Timestamp: now.Add(-36 * time.Hour).Format("2006-01-02 15:04"),
				Category:  "reboot",
				Severity:  "info",
				Service:   "kernel",
				Summary:   "System reboot recorded",
				RawLog:    "reboot   system boot  6.8.0-45-generic " + now.Add(-36*time.Hour).Format("Mon Jan 2 15:04:05 2006") + "   still running",
			},
		}
	}

	if days >= 7 && len(report.Incidents) < 4 {
		report.Incidents = append(report.Incidents, HistoryIncident{
			ID:        "demo-weekly-reboot",
			Timestamp: now.Add(-4 * 24 * time.Hour).Format("2006-01-02 15:04"),
			Category:  "reboot",
			Severity:  "info",
			Service:   "kernel",
			Summary:   "Scheduled maintenance reboot completed cleanly",
			RawLog:    "reboot   system boot  6.8.0-45-generic " + now.Add(-4*24*time.Hour).Format("Mon Jan 2 15:04:05 2006"),
		})
	}

	report.Summary = computeHistorySummary(report.Points, rng)
	report.Insights = buildHistoryInsights(report.Summary, report.Incidents, report.SysstatActive)
	return report
}

type SysstatPreflightResult struct {
	Safe             bool     `json:"safe"`
	Distro           string   `json:"distro"`
	PkgManager       string   `json:"pkgManager"`
	AlreadyInstalled bool     `json:"alreadyInstalled"`
	HasSystemd       bool     `json:"hasSystemd"`
	FreeLogMB        int      `json:"freeLogMB"`
	HasSudo          bool     `json:"hasSudo"`
	OtherCollectors  []string `json:"otherCollectors"`
	Warnings         []string `json:"warnings"`
	ExactCommand     string   `json:"exactCommand"`
}

type ReportExportInfo struct {
	ExportDir   string `json:"exportDir"`
	IsCustomDir bool   `json:"isCustomDir"`
	Format      string `json:"format"`
}

type SaveReportResult struct {
	Success  bool   `json:"success"`
	FilePath string `json:"filePath"`
	Message  string `json:"message"`
}

func (a *App) CheckSysstatPreflight(serverID string) SysstatPreflightResult {
	defer debug.FreeOSMemory()
	res := SysstatPreflightResult{
		Safe:            true,
		OtherCollectors: []string{},
		Warnings:        []string{},
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		res.Safe = false
		res.Warnings = append(res.Warnings, "server_not_found")
		return res
	}
	if cfg.IsDemo {
		res.Distro = "Ubuntu 24.04 LTS (Demo)"
		res.PkgManager = "apt"
		res.HasSystemd = true
		res.FreeLogMB = 14820
		res.HasSudo = true
		res.ExactCommand = "sudo apt-get update && sudo apt-get install -y sysstat && sudo systemctl enable --now sysstat"
		return res
	}

	cmd := `LC_ALL=C sh -c '
DISTRO=$(grep -m1 "^PRETTY_NAME=" /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d "\"")
echo "DISTRO=${DISTRO:-Linux}"
PM="unknown"
if command -v apt-get >/dev/null 2>&1; then PM="apt"
elif command -v dnf >/dev/null 2>&1; then PM="dnf"
elif command -v yum >/dev/null 2>&1; then PM="yum"
elif command -v pacman >/dev/null 2>&1; then PM="pacman"
elif command -v apk >/dev/null 2>&1; then PM="apk"
fi
echo "PM=$PM"
if command -v sadf >/dev/null 2>&1; then echo "INSTALLED=1"; else echo "INSTALLED=0"; fi
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then echo "SYSTEMD=1"; else echo "SYSTEMD=0"; fi
FREE=$(df -m /var/log 2>/dev/null | awk "NR==2 {print \$4}")
echo "FREEMB=${FREE:-0}"
if [ "$(id -u)" = "0" ] || (command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null); then echo "SUDO=1"; else echo "SUDO=0"; fi
OTHERS=""
for svc in atop pmcd netdata collectd; do
  if pgrep -x "$svc" >/dev/null 2>&1; then OTHERS="$OTHERS $svc"; fi
done
echo "OTHERS=$OTHERS"
'`
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil && strings.TrimSpace(out) == "" {
		res.Safe = false
		res.Warnings = append(res.Warnings, err.Error())
		return res
	}
	for _, line := range strings.Split(strings.ReplaceAll(out, "\r\n", "\n"), "\n") {
		line = strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(line, "DISTRO="):
			res.Distro = strings.TrimPrefix(line, "DISTRO=")
		case strings.HasPrefix(line, "PM="):
			res.PkgManager = strings.TrimPrefix(line, "PM=")
		case strings.HasPrefix(line, "INSTALLED="):
			res.AlreadyInstalled = strings.TrimPrefix(line, "INSTALLED=") == "1"
		case strings.HasPrefix(line, "SYSTEMD="):
			res.HasSystemd = strings.TrimPrefix(line, "SYSTEMD=") == "1"
		case strings.HasPrefix(line, "FREEMB="):
			if n, e := strconv.Atoi(strings.TrimPrefix(line, "FREEMB=")); e == nil {
				res.FreeLogMB = n
			}
		case strings.HasPrefix(line, "SUDO="):
			res.HasSudo = strings.TrimPrefix(line, "SUDO=") == "1"
		case strings.HasPrefix(line, "OTHERS="):
			for _, item := range strings.Fields(strings.TrimPrefix(line, "OTHERS=")) {
				res.OtherCollectors = append(res.OtherCollectors, item)
			}
		}
	}

	switch res.PkgManager {
	case "apt":
		res.ExactCommand = "sudo apt-get update && sudo apt-get install -y sysstat && sudo sed -i 's/ENABLED=\"false\"/ENABLED=\"true\"/' /etc/default/sysstat && sudo systemctl enable --now sysstat"
	case "dnf":
		res.ExactCommand = "sudo dnf install -y sysstat && sudo systemctl enable --now sysstat"
	case "yum":
		res.ExactCommand = "sudo yum install -y sysstat && sudo systemctl enable --now sysstat"
	case "pacman":
		res.ExactCommand = "sudo pacman -Sy --noconfirm sysstat && sudo systemctl enable --now sysstat"
	case "apk":
		res.ExactCommand = "sudo apk add --no-cache sysstat"
	default:
		res.Safe = false
		res.Warnings = append(res.Warnings, "unsupported_pkg_mgr")
	}
	if res.FreeLogMB > 0 && res.FreeLogMB < 50 {
		res.Safe = false
		res.Warnings = append(res.Warnings, "low_disk_space")
	}
	if !res.HasSudo {
		res.Warnings = append(res.Warnings, "sudo_password_needed")
	}
	return res
}

func (a *App) GetReportExportInfo() ReportExportInfo {
	a.mu.Lock()
	custom := strings.TrimSpace(a.settings.ReportExportDir)
	fmtStr := a.settings.ReportExportFormat
	a.mu.Unlock()
	if fmtStr != "txt" {
		fmtStr = "md"
	}
	if custom != "" {
		return ReportExportInfo{
			ExportDir:   filepath.Clean(custom),
			IsCustomDir: true,
			Format:      fmtStr,
		}
	}
	dir, err := getVaultDir()
	if err != nil {
		return ReportExportInfo{Format: fmtStr}
	}
	return ReportExportInfo{
		ExportDir:   filepath.Join(dir, "reports"),
		IsCustomDir: false,
		Format:      fmtStr,
	}
}

func (a *App) SaveHistoryReport(serverName, rangeKey, format, content string) SaveReportResult {
	defer debug.FreeOSMemory()

	info := a.GetReportExportInfo()
	ext := strings.ToLower(strings.TrimSpace(format))
	if ext != "txt" && ext != "md" {
		ext = info.Format
	}
	if ext != "txt" {
		ext = "md"
	}
	if info.ExportDir == "" {
		return SaveReportResult{Success: false, Message: "export directory unavailable"}
	}

	now := time.Now()
	srvFolder := safeBackupSegment(serverName)
	monthFolder := now.Format("2006-01")
	targetDir := filepath.Join(info.ExportDir, srvFolder, monthFolder)
	if err := os.MkdirAll(targetDir, 0700); err != nil {
		return SaveReportResult{Success: false, Message: err.Error()}
	}

	rng, _, _ := normalizeHistoryRange(rangeKey)
	fileName := fmt.Sprintf("ZentraDeck_%s_%s_%s.%s", srvFolder, rng, now.Format("2006-01-02_15-04"), ext)
	fullPath := filepath.Join(targetDir, fileName)
	if err := os.WriteFile(fullPath, []byte(content), 0600); err != nil {
		return SaveReportResult{Success: false, Message: err.Error()}
	}
	return SaveReportResult{
		Success:  true,
		FilePath: fullPath,
		Message:  filepath.Join(srvFolder, monthFolder, fileName),
	}
}
