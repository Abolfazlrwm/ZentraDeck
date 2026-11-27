package main

import (
	"bufio"
	"context"
	"crypto/aes"
	"crypto/cipher"
	crand "crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	mrand "math/rand/v2"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
	"golang.org/x/net/proxy"
)

type AppSettings struct {
	Language           string `json:"language"`
	ViewMode           string `json:"viewMode"`
	PrivacyMode        bool   `json:"privacyMode"`
	PollIntervalSec    int    `json:"pollIntervalSec"`
	DesktopAlerts      bool   `json:"desktopAlerts"`
	MinimizeToTray     bool   `json:"minimizeToTray"`
	AlertPrefsInit     bool   `json:"alertPrefsInit"`
	SftpAutoBackup     bool   `json:"sftpAutoBackup"`
	SftpMaxBackups     int    `json:"sftpMaxBackups"`
	SftpKeepAllBackups bool   `json:"sftpKeepAllBackups"`
	SftpBackupDir      string `json:"sftpBackupDir"`
	ReportExportDir    string `json:"reportExportDir"`
	ReportExportFormat string `json:"reportExportFormat"`
}

type ServerConfig struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Host          string     `json:"host"`
	Port          int        `json:"port"`
	Username      string     `json:"username"`
	AuthType      string     `json:"authType"`
	Password      string     `json:"password"`
	KeyPath       string     `json:"keyPath"`
	PrivateKey    string     `json:"privateKey"`
	Group         string     `json:"group"`
	IsDemo        bool       `json:"isDemo"`
	UseProxy      bool       `json:"useProxy"`
	ProxyHost     string     `json:"proxyHost"`
	ProxyPort     int        `json:"proxyPort"`
	ProxyUser     string     `json:"proxyUser"`
	ProxyPass     string     `json:"proxyPass"`
	HasPassword   bool       `json:"hasPassword"`
	HasPrivateKey bool       `json:"hasPrivateKey"`
	HasProxyPass  bool       `json:"hasProxyPass"`
	AlertRules    AlertRules `json:"alertRules"`
}

type DiskMetric struct {
	Mount   string  `json:"mount"`
	TotalGB float64 `json:"totalGB"`
	UsedGB  float64 `json:"usedGB"`
	Percent float64 `json:"percent"`
}

type ServiceInfo struct {
	Name        string `json:"name"`
	Status      string `json:"status"`
	SubState    string `json:"subState"`
	Description string `json:"description"`
}

type ProcessInfo struct {
	PID     int     `json:"pid"`
	User    string  `json:"user"`
	CPU     float64 `json:"cpu"`
	Mem     float64 `json:"mem"`
	Command string  `json:"command"`
}

type DockerContainer struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Image  string `json:"image"`
	State  string `json:"state"`
	Status string `json:"status"`
	Ports  string `json:"ports"`
}

type OpenPort struct {
	Proto   string `json:"proto"`
	Address string `json:"address"`
	Port    string `json:"port"`
	Process string `json:"process"`
}

type CommandOutput struct {
	Success    bool   `json:"success"`
	Output     string `json:"output"`
	DurationMs int64  `json:"durationMs"`
}

type ServerMetrics struct {
	ServerID        string            `json:"serverId"`
	Online          bool              `json:"online"`
	Error           string            `json:"error"`
	Timestamp       string            `json:"timestamp"`
	LatencyMs       int64             `json:"latencyMs"`
	Hostname        string            `json:"hostname"`
	OS              string            `json:"os"`
	Kernel          string            `json:"kernel"`
	Uptime          string            `json:"uptime"`
	CPUPercent      float64           `json:"cpuPercent"`
	CPUCores        int               `json:"cpuCores"`
	Load1           float64           `json:"load1"`
	Load5           float64           `json:"load5"`
	Load15          float64           `json:"load15"`
	RAMTotalGB      float64           `json:"ramTotalGB"`
	RAMUsedGB       float64           `json:"ramUsedGB"`
	RAMPercent      float64           `json:"ramPercent"`
	SwapTotalGB     float64           `json:"swapTotalGB"`
	SwapUsedGB      float64           `json:"swapUsedGB"`
	SwapPercent     float64           `json:"swapPercent"`
	NetRxKBps       float64           `json:"netRxKBps"`
	NetTxKBps       float64           `json:"netTxKBps"`
	DiskPercent     float64           `json:"diskPercent"`
	DiskUsedGB      float64           `json:"diskUsedGB"`
	DiskTotalGB     float64           `json:"diskTotalGB"`
	Disks           []DiskMetric      `json:"disks"`
	Services        []ServiceInfo     `json:"services"`
	Processes       []ProcessInfo     `json:"processes"`
	DockerAvailable bool              `json:"dockerAvailable"`
	Containers      []DockerContainer `json:"containers"`
	OpenPorts       []OpenPort        `json:"openPorts"`
	FirewallStatus  string            `json:"firewallStatus"`
	HealthScore     int               `json:"healthScore"`
	HealthIssues    []string          `json:"healthIssues"`
	FailedServices  int               `json:"failedServices"`
}

type ActionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type cpuSample struct {
	total uint64
	idle  uint64
}

type netSample struct {
	rx   uint64
	tx   uint64
	when time.Time
}

type demoState struct {
	baseCPU    float64
	baseRAM    float64
	baseDisk   float64
	online     bool
	services   []ServiceInfo
	processes  []ProcessInfo
	containers []DockerContainer
	openPorts  []OpenPort
	firewall   string
	uptime     int64
}

type activeTermRun struct {
	runID  string
	cancel context.CancelFunc
	sess   *ssh.Session
}

type App struct {
	ctx          context.Context
	mu           sync.Mutex
	dialMu       sync.Mutex
	termMu       sync.Mutex
	settings     AppSettings
	servers      []ServerConfig
	clients      map[string]*ssh.Client
	prevCPU      map[string]cpuSample
	prevNet      map[string]netSample
	demoStates   map[string]*demoState
	activeTerm   map[string]*activeTermRun
	ptyMu        sync.Mutex
	ptySessions  map[string]*ptySession
	alertMu      sync.Mutex
	alertStates  map[string]*serverAlertState
	demoRules    map[string]AlertRules
	trayMu       sync.Mutex
	trayStopCh   chan struct{}
	trayStopOnce sync.Once
	trayUpdateFn func(string)
	windowHidden bool
	forceQuit    bool
	notifIcon    string
}

var validServiceName = regexp.MustCompile(`^[a-zA-Z0-9@._:-]+$`)
var validContainerID = regexp.MustCompile(`^[a-zA-Z0-9_.-]+$`)

var supportedLanguages = map[string]bool{
	"en": true, "fa": true, "zh": true, "pt": true, "es": true, "de": true,
	"fr": true, "ja": true, "ru": true, "ko": true, "id": true,
}

func defaultSettings() AppSettings {
	return AppSettings{
		Language:           "en",
		ViewMode:           "simple",
		PrivacyMode:        false,
		PollIntervalSec:    2,
		DesktopAlerts:      true,
		MinimizeToTray:     true,
		AlertPrefsInit:     true,
		SftpAutoBackup:     false,
		SftpMaxBackups:     5,
		SftpKeepAllBackups: false,
		SftpBackupDir:      "",
		ReportExportDir:    "",
		ReportExportFormat: "md",
	}
}

func NewApp() *App {
	a := &App{
		settings:    defaultSettings(),
		clients:     make(map[string]*ssh.Client),
		prevCPU:     make(map[string]cpuSample),
		prevNet:     make(map[string]netSample),
		demoStates:  make(map[string]*demoState),
		activeTerm:  make(map[string]*activeTermRun),
		ptySessions: make(map[string]*ptySession),
		alertStates: make(map[string]*serverAlertState),
		demoRules:   make(map[string]AlertRules),
		trayStopCh:  make(chan struct{}),
	}
	a.initDemoStates()
	return a
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	_ = a.loadSettings()
	_ = a.loadServers()
	a.initAlertsAndTray()
}

func (a *App) SelectReportDir() (string, error) {
	return wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select Server Reports Export Folder",
	})
}

func (a *App) SelectBackupDir() (string, error) {
	return wailsruntime.OpenDirectoryDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select Local SFTP Backup Folder",
	})
}

func (a *App) SelectKeyFile() (string, error) {
	return wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Select SSH Private Key",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
			{DisplayName: "SSH Key Files (*.pem, *.key)", Pattern: "*.pem;*.key"},
		},
	})
}

func (a *App) loadSettings() error {
	dir, err := getVaultDir()
	if err != nil {
		return err
	}
	data, err := os.ReadFile(filepath.Join(dir, "settings.json"))
	if err != nil {
		return err
	}
	var s AppSettings
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if !supportedLanguages[s.Language] {
		s.Language = "en"
	}
	if s.ViewMode != "simple" && s.ViewMode != "pro" {
		s.ViewMode = "simple"
	}
	if s.PollIntervalSec < 1 || s.PollIntervalSec > 60 {
		s.PollIntervalSec = 2
	}
	if s.SftpMaxBackups < 1 || s.SftpMaxBackups > 1000 {
		s.SftpMaxBackups = 5
	}
	s.SftpBackupDir = strings.TrimSpace(s.SftpBackupDir)
	s.ReportExportDir = strings.TrimSpace(s.ReportExportDir)
	if s.ReportExportFormat != "md" && s.ReportExportFormat != "txt" {
		s.ReportExportFormat = "md"
	}
	a.mu.Lock()
	s.AlertPrefsInit = true
	a.settings = s
	a.mu.Unlock()
	return nil
}

func (a *App) GetSettings() AppSettings {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.settings
}

func (a *App) SaveSettings(s AppSettings) (AppSettings, error) {
	if !supportedLanguages[s.Language] {
		s.Language = "en"
	}
	if s.ViewMode != "simple" && s.ViewMode != "pro" {
		s.ViewMode = "simple"
	}
	if s.PollIntervalSec < 1 || s.PollIntervalSec > 60 {
		s.PollIntervalSec = 2
	}
	if s.SftpMaxBackups < 1 || s.SftpMaxBackups > 1000 {
		s.SftpMaxBackups = 5
	}
	s.SftpBackupDir = strings.TrimSpace(s.SftpBackupDir)
	s.ReportExportDir = strings.TrimSpace(s.ReportExportDir)
	if s.ReportExportFormat != "md" && s.ReportExportFormat != "txt" {
		s.ReportExportFormat = "md"
	}
	a.mu.Lock()
	s.AlertPrefsInit = true
	a.settings = s
	a.mu.Unlock()

	dir, err := getVaultDir()
	if err != nil {
		return s, err
	}
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return s, err
	}
	if err := os.WriteFile(filepath.Join(dir, "settings.json"), data, 0600); err != nil {
		return s, err
	}
	return s, nil
}

func (a *App) initDemoStates() {
	a.demoStates["demo-prod-1"] = &demoState{
		baseCPU: 24.5, baseRAM: 46.0, baseDisk: 52.4, online: true,
		uptime:   14*86400 + 6*3600 + 1800,
		firewall: "active",
		services: []ServiceInfo{
			{Name: "nginx.service", Status: "active", SubState: "running", Description: "High performance web server & reverse proxy"},
			{Name: "docker.service", Status: "active", SubState: "running", Description: "Docker Application Container Engine"},
			{Name: "postgresql.service", Status: "active", SubState: "running", Description: "PostgreSQL RDBMS Primary"},
			{Name: "redis-server.service", Status: "active", SubState: "running", Description: "Advanced key-value store"},
			{Name: "ssh.service", Status: "active", SubState: "running", Description: "OpenBSD Secure Shell server"},
			{Name: "fail2ban.service", Status: "active", SubState: "running", Description: "Intrusion prevention service"},
		},
		processes: []ProcessInfo{
			{PID: 1420, User: "www-data", CPU: 11.4, Mem: 8.2, Command: "nginx"},
			{PID: 2108, User: "postgres", CPU: 7.8, Mem: 18.6, Command: "postgres"},
			{PID: 3042, User: "root", CPU: 4.1, Mem: 9.4, Command: "dockerd"},
			{PID: 1894, User: "redis", CPU: 1.9, Mem: 5.1, Command: "redis-server"},
			{PID: 4120, User: "ubuntu", CPU: 1.2, Mem: 3.4, Command: "node"},
			{PID: 912, User: "root", CPU: 0.4, Mem: 0.8, Command: "sshd"},
		},
		containers: []DockerContainer{
			{ID: "a1b2c3d4e5f6", Name: "api-gateway", Image: "ghcr.io/acme/gateway:2.4", State: "running", Status: "Up 14 days", Ports: "0.0.0.0:8080->8080/tcp"},
			{ID: "f6e5d4c3b2a1", Name: "web-frontend", Image: "nginx:1.27-alpine", State: "running", Status: "Up 14 days", Ports: "0.0.0.0:443->443/tcp"},
			{ID: "9a8b7c6d5e4f", Name: "redis-cache", Image: "redis:7.4-alpine", State: "running", Status: "Up 14 days", Ports: "127.0.0.1:6379->6379/tcp"},
			{ID: "3c4d5e6f7a8b", Name: "worker-cron", Image: "ghcr.io/acme/worker:2.4", State: "exited", Status: "Exited (0) 2 hours ago", Ports: ""},
		},
		openPorts: []OpenPort{
			{Proto: "tcp", Address: "0.0.0.0", Port: "22", Process: "sshd"},
			{Proto: "tcp", Address: "0.0.0.0", Port: "80", Process: "nginx"},
			{Proto: "tcp", Address: "0.0.0.0", Port: "443", Process: "nginx"},
			{Proto: "tcp", Address: "0.0.0.0", Port: "8080", Process: "docker-proxy"},
			{Proto: "tcp", Address: "127.0.0.1", Port: "5432", Process: "postgres"},
			{Proto: "tcp", Address: "127.0.0.1", Port: "6379", Process: "redis-server"},
		},
	}
	a.demoStates["demo-db-2"] = &demoState{
		baseCPU: 61.0, baseRAM: 78.5, baseDisk: 83.2, online: true,
		uptime:   41*86400 + 2*3600,
		firewall: "active",
		services: []ServiceInfo{
			{Name: "postgresql.service", Status: "active", SubState: "running", Description: "PostgreSQL Replica Node"},
			{Name: "pgbouncer.service", Status: "active", SubState: "running", Description: "Lightweight connection pooler"},
			{Name: "backup-agent.service", Status: "failed", SubState: "failed", Description: "Automated S3 Snapshot Worker"},
			{Name: "node_exporter.service", Status: "active", SubState: "running", Description: "System metrics collector"},
			{Name: "ssh.service", Status: "active", SubState: "running", Description: "OpenBSD Secure Shell server"},
		},
		processes: []ProcessInfo{
			{PID: 1180, User: "postgres", CPU: 42.6, Mem: 58.4, Command: "postgres"},
			{PID: 2450, User: "postgres", CPU: 9.2, Mem: 11.2, Command: "pgbouncer"},
			{PID: 3310, User: "root", CPU: 3.4, Mem: 4.1, Command: "node_exporter"},
			{PID: 820, User: "root", CPU: 0.3, Mem: 0.6, Command: "sshd"},
		},
		containers: []DockerContainer{
			{ID: "db1122334455", Name: "pg-metrics", Image: "prometheuscommunity/postgres-exporter:latest", State: "running", Status: "Up 41 days", Ports: "127.0.0.1:9187->9187/tcp"},
		},
		openPorts: []OpenPort{
			{Proto: "tcp", Address: "0.0.0.0", Port: "22", Process: "sshd"},
			{Proto: "tcp", Address: "10.0.0.12", Port: "5432", Process: "postgres"},
			{Proto: "tcp", Address: "10.0.0.12", Port: "6432", Process: "pgbouncer"},
			{Proto: "tcp", Address: "127.0.0.1", Port: "9100", Process: "node_exporter"},
		},
	}
	a.demoStates["demo-edge-3"] = &demoState{
		baseCPU: 12.0, baseRAM: 28.0, baseDisk: 31.0, online: true,
		uptime:   5*86400 + 11*3600,
		firewall: "inactive",
		services: []ServiceInfo{
			{Name: "caddy.service", Status: "active", SubState: "running", Description: "Caddy Automatic HTTPS Edge Server"},
			{Name: "wireguard.service", Status: "active", SubState: "exited", Description: "WireGuard VPN Mesh Tunnel"},
			{Name: "docker.service", Status: "active", SubState: "running", Description: "Container Runtime"},
			{Name: "ssh.service", Status: "active", SubState: "running", Description: "OpenBSD Secure Shell server"},
		},
		processes: []ProcessInfo{
			{PID: 1054, User: "caddy", CPU: 6.4, Mem: 12.1, Command: "caddy"},
			{PID: 2012, User: "root", CPU: 2.3, Mem: 7.5, Command: "dockerd"},
			{PID: 740, User: "root", CPU: 0.2, Mem: 0.9, Command: "sshd"},
		},
		containers: []DockerContainer{
			{ID: "ed9988776655", Name: "uptime-kuma", Image: "louislam/uptime-kuma:1", State: "running", Status: "Up 5 days", Ports: "0.0.0.0:3001->3001/tcp"},
			{ID: "ed5544332211", Name: "cloudflared", Image: "cloudflare/cloudflared:latest", State: "running", Status: "Up 5 days", Ports: ""},
		},
		openPorts: []OpenPort{
			{Proto: "tcp", Address: "0.0.0.0", Port: "2222", Process: "sshd"},
			{Proto: "tcp", Address: "0.0.0.0", Port: "443", Process: "caddy"},
			{Proto: "udp", Address: "0.0.0.0", Port: "51820", Process: "wireguard"},
			{Proto: "tcp", Address: "0.0.0.0", Port: "3001", Process: "docker-proxy"},
		},
	}
}

func (a *App) GetDemoServers() []ServerConfig {
	return []ServerConfig{
		{ID: "demo-prod-1", Name: "EU-Prod-Web-01", Host: "185.204.48.112", Port: 22, Username: "ubuntu", AuthType: "key", Group: "Production", IsDemo: true},
		{ID: "demo-db-2", Name: "US-Core-DB-02", Host: "45.82.194.29", Port: 22, Username: "postgres", AuthType: "key", Group: "Databases", IsDemo: true},
		{ID: "demo-edge-3", Name: "DE-Edge-Gateway", Host: "91.107.211.64", Port: 2222, Username: "admin", AuthType: "key", Group: "Edge", IsDemo: true},
	}
}

func (a *App) ToggleDemoOutage(serverID string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	st, ok := a.demoStates[serverID]
	if !ok {
		return false
	}
	st.online = !st.online
	return st.online
}

func getVaultDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "ZentraDeck")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	return dir, nil
}

const (
	vaultKeyringService = "ZentraDeck"
	vaultKeyringAccount = "vault-master-key"
)

var knownHostsMu sync.Mutex

func getOrCreateVaultKey(dir string) ([]byte, error) {
	// 1. Prefer OS Keychain (Windows Credential Manager / macOS Keychain / Linux Secret Service)
	if secret, err := keyring.Get(vaultKeyringService, vaultKeyringAccount); err == nil {
		if decoded, err := hex.DecodeString(strings.TrimSpace(secret)); err == nil && len(decoded) == 32 {
			return decoded, nil
		}
	}

	// 2. Migrate legacy .vault.key into OS Keychain if present
	keyPath := filepath.Join(dir, ".vault.key")
	if data, err := os.ReadFile(keyPath); err == nil && len(data) == 32 {
		if err := keyring.Set(vaultKeyringService, vaultKeyringAccount, hex.EncodeToString(data)); err == nil {
			_ = os.Remove(keyPath)
		}
		return data, nil
	}

	// 3. Generate a fresh 256-bit key and store in OS Keychain (fallback to 0600 file if keyring unavailable)
	key := make([]byte, 32)
	if _, err := io.ReadFull(crand.Reader, key); err != nil {
		return nil, err
	}
	if err := keyring.Set(vaultKeyringService, vaultKeyringAccount, hex.EncodeToString(key)); err == nil {
		return key, nil
	}
	if err := os.WriteFile(keyPath, key, 0600); err != nil {
		return nil, err
	}
	return key, nil
}

func verifyOrTrustHostKey(hostname string, remote net.Addr, key ssh.PublicKey) error {
	knownHostsMu.Lock()
	defer knownHostsMu.Unlock()

	dir, err := getVaultDir()
	if err != nil {
		return fmt.Errorf("cannot locate known_hosts directory: %w", err)
	}
	appKnownHosts := filepath.Join(dir, "known_hosts")
	if _, err := os.Stat(appKnownHosts); os.IsNotExist(err) {
		if err := os.WriteFile(appKnownHosts, []byte{}, 0600); err != nil {
			return fmt.Errorf("cannot initialize known_hosts: %w", err)
		}
	}

	files := []string{appKnownHosts}
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		userKH := filepath.Join(home, ".ssh", "known_hosts")
		if info, err := os.Stat(userKH); err == nil && !info.IsDir() {
			if _, parseErr := knownhosts.New(userKH); parseErr == nil {
				files = append(files, userKH)
			}
		}
	}

	cb, err := knownhosts.New(files...)
	if err != nil {
		return fmt.Errorf("failed to parse known_hosts: %w", err)
	}

	err = cb(hostname, remote, key)
	if err == nil {
		return nil
	}

	var keyErr *knownhosts.KeyError
	if errors.As(err, &keyErr) {
		if len(keyErr.Want) > 0 {
			conflictFile := appKnownHosts
			if keyErr.Want[0].Filename != "" {
				conflictFile = keyErr.Want[0].Filename
			}
			fp := ssh.FingerprintSHA256(key)
			return fmt.Errorf(
				"SSH host key mismatch for %s (possible MITM attack or rebuilt server). Received %s (%s). If you intentionally reinstalled this server, remove its old entry from %s",
				knownhosts.Normalize(hostname), key.Type(), fp, conflictFile,
			)
		}

		// TOFU (Trust On First Use): record host key for future verification
		line := knownhosts.Line([]string{knownhosts.Normalize(hostname)}, key)
		f, openErr := os.OpenFile(appKnownHosts, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
		if openErr != nil {
			return fmt.Errorf("cannot save host key to known_hosts: %w", openErr)
		}
		defer f.Close()
		if _, writeErr := f.WriteString(line + "\n"); writeErr != nil {
			return fmt.Errorf("cannot write host key to known_hosts: %w", writeErr)
		}
		return nil
	}

	return err
}

func encryptData(plaintext, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(crand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

func decryptData(ciphertext, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	if len(ciphertext) < gcm.NonceSize() {
		return nil, errors.New("corrupted vault file")
	}
	nonce := ciphertext[:gcm.NonceSize()]
	return gcm.Open(nil, nonce, ciphertext[gcm.NonceSize():], nil)
}

func (a *App) loadServers() error {
	dir, err := getVaultDir()
	if err != nil {
		return err
	}
	key, err := getOrCreateVaultKey(dir)
	if err != nil {
		return err
	}
	enc, err := os.ReadFile(filepath.Join(dir, "servers.enc"))
	if err != nil {
		if os.IsNotExist(err) {
			a.servers = []ServerConfig{}
			return nil
		}
		return err
	}
	plain, err := decryptData(enc, key)
	if err != nil {
		return err
	}
	var list []ServerConfig
	if err := json.Unmarshal(plain, &list); err != nil {
		return err
	}
	a.mu.Lock()
	a.servers = list
	a.mu.Unlock()
	return nil
}

func (a *App) saveServersLocked() error {
	dir, err := getVaultDir()
	if err != nil {
		return err
	}
	key, err := getOrCreateVaultKey(dir)
	if err != nil {
		return err
	}
	plain, err := json.Marshal(a.servers)
	if err != nil {
		return err
	}
	enc, err := encryptData(plain, key)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "servers.enc"), enc, 0600)
}

func newID() string {
	b := make([]byte, 8)
	_, _ = io.ReadFull(crand.Reader, b)
	return "srv-" + hex.EncodeToString(b)
}

func sanitizeServer(s ServerConfig) ServerConfig {
	s.HasPassword = s.Password != ""
	s.HasPrivateKey = s.PrivateKey != ""
	s.HasProxyPass = s.ProxyPass != ""
	s.Password = ""
	s.PrivateKey = ""
	s.ProxyPass = ""
	s.AlertRules = normalizeAlertRules(s.AlertRules)
	return s
}

func mergeExistingSecrets(incoming, existing ServerConfig) ServerConfig {
	if incoming.Password == "" && incoming.AuthType == existing.AuthType {
		incoming.Password = existing.Password
	}
	if strings.TrimSpace(incoming.PrivateKey) == "" && strings.TrimSpace(incoming.KeyPath) == "" {
		incoming.PrivateKey = existing.PrivateKey
	}
	if incoming.ProxyPass == "" && incoming.UseProxy {
		incoming.ProxyPass = existing.ProxyPass
	}
	return incoming
}

func (a *App) GetServers() []ServerConfig {
	a.mu.Lock()
	defer a.mu.Unlock()
	out := make([]ServerConfig, len(a.servers))
	for i, s := range a.servers {
		out[i] = sanitizeServer(s)
	}
	return out
}

func (a *App) SaveServer(cfg ServerConfig) (ServerConfig, error) {
	cfg.Name = strings.TrimSpace(cfg.Name)
	cfg.Host = strings.TrimSpace(cfg.Host)
	cfg.Username = strings.TrimSpace(cfg.Username)
	cfg.KeyPath = strings.TrimSpace(cfg.KeyPath)
	cfg.ProxyHost = strings.TrimSpace(cfg.ProxyHost)
	cfg.ProxyUser = strings.TrimSpace(cfg.ProxyUser)
	if cfg.Host == "" || cfg.Username == "" {
		return sanitizeServer(cfg), errors.New("host and username are required")
	}
	if cfg.Name == "" {
		cfg.Name = cfg.Host
	}
	if cfg.Port <= 0 {
		cfg.Port = 22
	}
	if cfg.Group == "" {
		cfg.Group = "Default"
	}
	if cfg.AuthType == "" {
		cfg.AuthType = "password"
	}
	cfg.AlertRules = normalizeAlertRules(cfg.AlertRules)
	if cfg.UseProxy && cfg.ProxyPort <= 0 {
		cfg.ProxyPort = 1080
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	if cfg.ID == "" {
		cfg.ID = newID()
		a.servers = append(a.servers, cfg)
	} else {
		updated := false
		for i := range a.servers {
			if a.servers[i].ID == cfg.ID {
				cfg = mergeExistingSecrets(cfg, a.servers[i])
				a.servers[i] = cfg
				updated = true
				break
			}
		}
		if !updated {
			a.servers = append(a.servers, cfg)
		}
		if c, ok := a.clients[cfg.ID]; ok {
			_ = c.Close()
			delete(a.clients, cfg.ID)
		}
	}

	if err := a.saveServersLocked(); err != nil {
		return sanitizeServer(cfg), err
	}
	return sanitizeServer(cfg), nil
}

func (a *App) DeleteServer(id string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	if c, ok := a.clients[id]; ok {
		_ = c.Close()
		delete(a.clients, id)
	}
	delete(a.prevCPU, id)
	delete(a.prevNet, id)

	filtered := make([]ServerConfig, 0, len(a.servers))
	for _, s := range a.servers {
		if s.ID != id {
			filtered = append(filtered, s)
		}
	}
	a.servers = filtered
	return a.saveServersLocked()
}

func (a *App) ImportSSHConfig() (int, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return 0, err
	}
	cfgPath := filepath.Join(home, ".ssh", "config")
	if _, statErr := os.Stat(cfgPath); os.IsNotExist(statErr) {
		picked, dlgErr := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
			Title: "Select SSH Config File",
		})
		if dlgErr != nil {
			return 0, dlgErr
		}
		if strings.TrimSpace(picked) == "" {
			return -1, nil
		}
		cfgPath = picked
	}

	f, err := os.Open(cfgPath)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	var parsed []ServerConfig
	var cur *ServerConfig
	flush := func() {
		if cur != nil && cur.Host != "" && !strings.ContainsAny(cur.Name, "*?") {
			if cur.Username == "" {
				cur.Username = "root"
			}
			if cur.Port <= 0 {
				cur.Port = 22
			}
			parsed = append(parsed, *cur)
		}
		cur = nil
	}

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}
		k := strings.ToLower(parts[0])
		v := strings.Join(parts[1:], " ")
		switch k {
		case "host":
			flush()
			alias := parts[1]
			cur = &ServerConfig{
				Name: alias, Host: alias, Port: 22, AuthType: "key",
				KeyPath: filepath.Join(home, ".ssh", "id_ed25519"), Group: "SSH Config",
			}
		case "hostname":
			if cur != nil {
				cur.Host = v
			}
		case "user":
			if cur != nil {
				cur.Username = v
			}
		case "port":
			if cur != nil {
				if p, err := strconv.Atoi(v); err == nil {
					cur.Port = p
				}
			}
		case "identityfile":
			if cur != nil {
				cur.AuthType = "key"
				cur.KeyPath = expandHome(v)
			}
		}
	}
	flush()

	a.mu.Lock()
	defer a.mu.Unlock()
	imported := 0
	for _, item := range parsed {
		exists := false
		for _, existing := range a.servers {
			if existing.Host == item.Host && existing.Port == item.Port {
				exists = true
				break
			}
		}
		if !exists {
			item.ID = newID()
			a.servers = append(a.servers, item)
			imported++
		}
	}
	if imported > 0 {
		if err := a.saveServersLocked(); err != nil {
			return 0, err
		}
	}
	return imported, nil
}

func expandHome(p string) string {
	p = strings.TrimSpace(strings.Trim(p, `"'`))
	if strings.HasPrefix(p, "~/") || strings.HasPrefix(p, `~\`) {
		if home, err := os.UserHomeDir(); err == nil {
			return filepath.Join(home, p[2:])
		}
	}
	return p
}

func buildSSHConfig(cfg ServerConfig) (*ssh.ClientConfig, error) {
	var auths []ssh.AuthMethod
	if cfg.AuthType == "key" {
		var keyBytes []byte
		var err error
		if strings.TrimSpace(cfg.PrivateKey) != "" {
			keyBytes = []byte(cfg.PrivateKey)
		} else if strings.TrimSpace(cfg.KeyPath) != "" {
			keyBytes, err = os.ReadFile(expandHome(cfg.KeyPath))
			if err != nil {
				return nil, fmt.Errorf("cannot read SSH key: %w", err)
			}
		} else {
			return nil, errors.New("SSH key file or private key is required")
		}
		var signer ssh.Signer
		if cfg.Password != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase(keyBytes, []byte(cfg.Password))
		} else {
			signer, err = ssh.ParsePrivateKey(keyBytes)
		}
		if err != nil {
			return nil, fmt.Errorf("invalid SSH key: %w", err)
		}
		auths = append(auths, ssh.PublicKeys(signer))
	} else {
		auths = append(auths, ssh.Password(cfg.Password))
	}

	return &ssh.ClientConfig{
		User:            cfg.Username,
		Auth:            auths,
		HostKeyCallback: verifyOrTrustHostKey,
		Timeout:         10 * time.Second,
	}, nil
}

func dialSSH(cfg ServerConfig) (*ssh.Client, error) {
	sshCfg, err := buildSSHConfig(cfg)
	if err != nil {
		return nil, err
	}
	addr := net.JoinHostPort(cfg.Host, strconv.Itoa(cfg.Port))
	if !cfg.UseProxy {
		return ssh.Dial("tcp", addr, sshCfg)
	}

	pHost := strings.TrimSpace(cfg.ProxyHost)
	if pHost == "" {
		return nil, errors.New("SOCKS5 proxy host is required")
	}
	pPort := cfg.ProxyPort
	if pPort <= 0 {
		pPort = 1080
	}
	var auth *proxy.Auth
	if strings.TrimSpace(cfg.ProxyUser) != "" || cfg.ProxyPass != "" {
		auth = &proxy.Auth{
			User:     strings.TrimSpace(cfg.ProxyUser),
			Password: cfg.ProxyPass,
		}
	}
	baseDialer := &net.Dialer{Timeout: 10 * time.Second}
	dialer, err := proxy.SOCKS5("tcp", net.JoinHostPort(pHost, strconv.Itoa(pPort)), auth, baseDialer)
	if err != nil {
		return nil, fmt.Errorf("invalid SOCKS5 proxy: %w", err)
	}
	conn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, fmt.Errorf("SOCKS5 dial failed: %w", err)
	}
	c, chans, reqs, err := ssh.NewClientConn(conn, addr, sshCfg)
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	return ssh.NewClient(c, chans, reqs), nil
}

// Race-safe SSH client retrieval (prevents startup double-dial disconnects)
func (a *App) getClient(cfg ServerConfig) (*ssh.Client, error) {
	a.mu.Lock()
	existing, ok := a.clients[cfg.ID]
	a.mu.Unlock()
	if ok && existing != nil {
		return existing, nil
	}

	a.dialMu.Lock()
	defer a.dialMu.Unlock()

	a.mu.Lock()
	existing, ok = a.clients[cfg.ID]
	a.mu.Unlock()
	if ok && existing != nil {
		return existing, nil
	}

	client, err := dialSSH(cfg)
	if err != nil {
		return nil, err
	}
	a.mu.Lock()
	a.clients[cfg.ID] = client
	a.mu.Unlock()
	return client, nil
}

func (a *App) dropClientIfMatch(serverID string, failed *ssh.Client) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if cur, ok := a.clients[serverID]; ok && cur == failed {
		_ = cur.Close()
		delete(a.clients, serverID)
	}
}

func (a *App) runSSHCommand(cfg ServerConfig, cmd string) (string, error) {
	client, err := a.getClient(cfg)
	if err != nil {
		return "", err
	}
	out, err := execOnce(client, cmd)
	if err != nil {
		a.dropClientIfMatch(cfg.ID, client)
		client, err = a.getClient(cfg)
		if err != nil {
			return "", err
		}
		return execOnce(client, cmd)
	}
	return out, nil
}

func execOnce(client *ssh.Client, cmd string) (string, error) {
	sess, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer sess.Close()
	b, err := sess.CombinedOutput(cmd)
	return string(b), err
}

func (a *App) TestConnection(cfg ServerConfig) ActionResult {
	if cfg.ID != "" {
		a.mu.Lock()
		for _, s := range a.servers {
			if s.ID == cfg.ID {
				cfg = mergeExistingSecrets(cfg, s)
				break
			}
		}
		a.mu.Unlock()
	}
	if cfg.Port <= 0 {
		cfg.Port = 22
	}
	cfg.AlertRules = normalizeAlertRules(cfg.AlertRules)
	if cfg.UseProxy && cfg.ProxyPort <= 0 {
		cfg.ProxyPort = 1080
	}
	start := time.Now()
	client, err := dialSSH(cfg)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	defer client.Close()
	out, err := execOnce(client, "hostname")
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	ms := time.Since(start).Milliseconds()
	return ActionResult{
		Success: true,
		Message: fmt.Sprintf("%s (%d ms)", strings.TrimSpace(out), ms),
	}
}

const metricsScript = `
echo "===HOST==="; hostname 2>/dev/null || echo unknown
echo "===OS==="; (grep '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d= -f2- | tr -d '"') || uname -s
echo "===KERNEL==="; uname -r 2>/dev/null
echo "===UPTIME==="; cat /proc/uptime 2>/dev/null
echo "===CPU==="; head -n 1 /proc/stat 2>/dev/null
echo "===CORES==="; nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo 1
echo "===LOAD==="; cat /proc/loadavg 2>/dev/null
echo "===MEM==="; grep -E '^(MemTotal|MemAvailable|MemFree|SwapTotal|SwapFree):' /proc/meminfo 2>/dev/null
echo "===DISK==="; df -kP 2>/dev/null
echo "===NET==="; cat /proc/net/dev 2>/dev/null
echo "===PROC==="; ps -eo pid=,user=,pcpu=,pmem=,comm= --sort=-pcpu 2>/dev/null | head -n 20; ps -eo pid=,user=,pcpu=,pmem=,comm= --sort=-pmem 2>/dev/null | head -n 20
echo "===DOCKER==="; if command -v docker >/dev/null 2>&1; then echo "__DOCKER_OK__"; docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.State}}|{{.Status}}|{{.Ports}}" 2>/dev/null || sudo -n docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.State}}|{{.Status}}|{{.Ports}}" 2>/dev/null; fi
echo "===PORTS==="; ss -tulnp 2>/dev/null || ss -tuln 2>/dev/null
echo "===FW==="; if command -v ufw >/dev/null 2>&1; then (ufw status 2>/dev/null || sudo -n ufw status 2>/dev/null) | head -n 1; elif command -v firewall-cmd >/dev/null 2>&1; then (firewall-cmd --state 2>/dev/null || sudo -n firewall-cmd --state 2>/dev/null); fi
echo "===SVC==="; if command -v systemctl >/dev/null 2>&1; then systemctl list-units --type=service --all --no-pager --no-legend 2>/dev/null | head -n 40; fi
`

func (a *App) findServer(id string) (ServerConfig, bool) {
	for _, s := range a.GetDemoServers() {
		if s.ID == id {
			return s, true
		}
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, s := range a.servers {
		if s.ID == id {
			return s, true
		}
	}
	return ServerConfig{}, false
}

func (a *App) GetServerMetrics(serverID string) ServerMetrics {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ServerMetrics{
			ServerID: serverID, Online: false, Error: "server_not_found",
			Timestamp: time.Now().Format("15:04:05"),
			Disks:     []DiskMetric{}, Services: []ServiceInfo{}, Processes: []ProcessInfo{},
			Containers: []DockerContainer{}, OpenPorts: []OpenPort{}, HealthIssues: []string{},
		}
	}
	if cfg.IsDemo {
		return a.buildDemoMetrics(cfg)
	}

	start := time.Now()
	raw, err := a.runSSHCommand(cfg, metricsScript)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return ServerMetrics{
			ServerID: serverID, Online: false, Error: err.Error(),
			Timestamp: time.Now().Format("15:04:05"), Hostname: cfg.Name,
			Disks: []DiskMetric{}, Services: []ServiceInfo{}, Processes: []ProcessInfo{},
			Containers: []DockerContainer{}, OpenPorts: []OpenPort{}, HealthIssues: []string{},
		}
	}

	m := a.parseMetrics(serverID, raw)
	m.Online = true
	m.LatencyMs = latency
	m.Timestamp = time.Now().Format("15:04:05")
	calculateHealth(&m)
	return m
}

func (a *App) parseMetrics(serverID, raw string) ServerMetrics {
	sections := map[string][]string{}
	current := ""
	for _, line := range strings.Split(raw, "\n") {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "===") && strings.HasSuffix(t, "===") {
			current = strings.Trim(t, "=")
			continue
		}
		if current != "" && t != "" {
			sections[current] = append(sections[current], t)
		}
	}

	m := ServerMetrics{
		ServerID:       serverID,
		CPUCores:       1,
		FirewallStatus: "unknown",
		Disks:          []DiskMetric{},
		Services:       []ServiceInfo{},
		Processes:      []ProcessInfo{},
		Containers:     []DockerContainer{},
		OpenPorts:      []OpenPort{},
		HealthIssues:   []string{},
	}

	if v := sections["HOST"]; len(v) > 0 {
		m.Hostname = v[0]
	}
	if v := sections["OS"]; len(v) > 0 {
		m.OS = v[0]
	}
	if v := sections["KERNEL"]; len(v) > 0 {
		m.Kernel = v[0]
	}
	if v := sections["UPTIME"]; len(v) > 0 {
		f := strings.Fields(v[0])
		if len(f) > 0 {
			if sec, err := strconv.ParseFloat(f[0], 64); err == nil {
				m.Uptime = formatUptime(int64(sec))
			}
		}
	}
	if v := sections["CORES"]; len(v) > 0 {
		if c, err := strconv.Atoi(v[0]); err == nil && c > 0 {
			m.CPUCores = c
		}
	}
	if v := sections["LOAD"]; len(v) > 0 {
		f := strings.Fields(v[0])
		if len(f) >= 3 {
			m.Load1, _ = strconv.ParseFloat(f[0], 64)
			m.Load5, _ = strconv.ParseFloat(f[1], 64)
			m.Load15, _ = strconv.ParseFloat(f[2], 64)
		}
	}

	if v := sections["CPU"]; len(v) > 0 {
		fields := strings.Fields(v[0])
		if len(fields) >= 5 {
			var total, idle uint64
			for i := 1; i < len(fields); i++ {
				val, _ := strconv.ParseUint(fields[i], 10, 64)
				total += val
				if i == 4 || i == 5 {
					idle += val
				}
			}
			a.mu.Lock()
			prev, hasPrev := a.prevCPU[serverID]
			a.prevCPU[serverID] = cpuSample{total: total, idle: idle}
			a.mu.Unlock()

			if hasPrev && total > prev.total {
				dTotal := float64(total - prev.total)
				dIdle := float64(idle - prev.idle)
				m.CPUPercent = round1(clamp(((dTotal-dIdle)/dTotal)*100, 0, 100))
			} else {
				est := (m.Load1 / float64(m.CPUCores)) * 100
				m.CPUPercent = round1(clamp(est, 0, 100))
			}
		}
	}

	mem := map[string]float64{}
	for _, line := range sections["MEM"] {
		f := strings.Fields(line)
		if len(f) >= 2 {
			k := strings.TrimSuffix(f[0], ":")
			val, _ := strconv.ParseFloat(f[1], 64)
			mem[k] = val
		}
	}
	if mem["MemTotal"] > 0 {
		avail := mem["MemAvailable"]
		if avail == 0 {
			avail = mem["MemFree"]
		}
		used := math.Max(0, mem["MemTotal"]-avail)
		m.RAMTotalGB = round2(mem["MemTotal"] / 1024 / 1024)
		m.RAMUsedGB = round2(used / 1024 / 1024)
		m.RAMPercent = round1(clamp((used/mem["MemTotal"])*100, 0, 100))
	}
	if mem["SwapTotal"] > 0 {
		used := math.Max(0, mem["SwapTotal"]-mem["SwapFree"])
		m.SwapTotalGB = round2(mem["SwapTotal"] / 1024 / 1024)
		m.SwapUsedGB = round2(used / 1024 / 1024)
		m.SwapPercent = round1(clamp((used/mem["SwapTotal"])*100, 0, 100))
	}

	for _, line := range sections["DISK"] {
		f := strings.Fields(line)
		if len(f) < 6 || !strings.HasPrefix(f[0], "/") || strings.HasPrefix(f[0], "/dev/loop") {
			continue
		}
		totKB, err1 := strconv.ParseFloat(f[1], 64)
		usedKB, err2 := strconv.ParseFloat(f[2], 64)
		if err1 != nil || err2 != nil || totKB <= 0 {
			continue
		}
		pctStr := strings.TrimSuffix(f[4], "%")
		pct, _ := strconv.ParseFloat(pctStr, 64)
		mount := strings.Join(f[5:], " ")
		dm := DiskMetric{
			Mount:   mount,
			TotalGB: round2(totKB / 1024 / 1024),
			UsedGB:  round2(usedKB / 1024 / 1024),
			Percent: round1(pct),
		}
		m.Disks = append(m.Disks, dm)
		if mount == "/" || m.DiskTotalGB == 0 {
			m.DiskTotalGB = dm.TotalGB
			m.DiskUsedGB = dm.UsedGB
			m.DiskPercent = dm.Percent
		}
	}

	var totalRx, totalTx uint64
	hasNet := false
	for _, line := range sections["NET"] {
		colon := strings.IndexByte(line, ':')
		if colon == -1 {
			continue
		}
		iface := strings.TrimSpace(line[:colon])
		if iface == "" || iface == "lo" {
			continue
		}
		fields := strings.Fields(line[colon+1:])
		if len(fields) >= 9 {
			rx, err1 := strconv.ParseUint(fields[0], 10, 64)
			tx, err2 := strconv.ParseUint(fields[8], 10, 64)
			if err1 == nil && err2 == nil {
				totalRx += rx
				totalTx += tx
				hasNet = true
			}
		}
	}
	if hasNet {
		now := time.Now()
		a.mu.Lock()
		prev, hasPrev := a.prevNet[serverID]
		a.prevNet[serverID] = netSample{rx: totalRx, tx: totalTx, when: now}
		a.mu.Unlock()
		if hasPrev {
			dt := now.Sub(prev.when).Seconds()
			if dt > 0.2 && totalRx >= prev.rx && totalTx >= prev.tx {
				m.NetRxKBps = round1(float64(totalRx-prev.rx) / 1024.0 / dt)
				m.NetTxKBps = round1(float64(totalTx-prev.tx) / 1024.0 / dt)
			}
		}
	}

	// Top Processes (deduped merge of top CPU & top RAM)
	seenPID := map[int]bool{}
	for _, line := range sections["PROC"] {
		f := strings.Fields(line)
		if len(f) >= 5 {
			pid, err := strconv.Atoi(f[0])
			if err != nil || pid <= 0 || seenPID[pid] {
				continue
			}
			seenPID[pid] = true
			cpuVal, _ := strconv.ParseFloat(f[2], 64)
			memVal, _ := strconv.ParseFloat(f[3], 64)
			m.Processes = append(m.Processes, ProcessInfo{
				PID:     pid,
				User:    f[1],
				CPU:     round1(cpuVal),
				Mem:     round1(memVal),
				Command: strings.Join(f[4:], " "),
			})
		}
	}

	for _, line := range sections["DOCKER"] {
		if line == "__DOCKER_OK__" {
			m.DockerAvailable = true
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) >= 5 {
			ports := ""
			if len(parts) >= 6 {
				ports = strings.TrimSpace(parts[5])
			}
			m.Containers = append(m.Containers, DockerContainer{
				ID:     strings.TrimSpace(parts[0]),
				Name:   strings.TrimSpace(parts[1]),
				Image:  strings.TrimSpace(parts[2]),
				State:  strings.ToLower(strings.TrimSpace(parts[3])),
				Status: strings.TrimSpace(parts[4]),
				Ports:  ports,
			})
		}
	}

	seenPort := map[string]bool{}
	for _, line := range sections["PORTS"] {
		f := strings.Fields(line)
		if len(f) < 5 {
			continue
		}
		proto := strings.ToLower(f[0])
		if proto != "tcp" && proto != "udp" {
			continue
		}
		local := f[4]
		idx := strings.LastIndexByte(local, ':')
		if idx == -1 {
			continue
		}
		addr := strings.Trim(local[:idx], "[]")
		port := local[idx+1:]
		key := proto + "|" + addr + "|" + port
		if seenPort[key] {
			continue
		}
		seenPort[key] = true
		proc := ""
		if len(f) >= 7 {
			rest := strings.Join(f[6:], " ")
			if q1 := strings.IndexByte(rest, '"'); q1 != -1 {
				if q2 := strings.IndexByte(rest[q1+1:], '"'); q2 != -1 {
					proc = rest[q1+1 : q1+1+q2]
				}
			}
		}
		m.OpenPorts = append(m.OpenPorts, OpenPort{
			Proto: proto, Address: addr, Port: port, Process: proc,
		})
		if len(m.OpenPorts) >= 30 {
			break
		}
	}

	if v := sections["FW"]; len(v) > 0 {
		low := strings.ToLower(v[0])
		if strings.Contains(low, "inactive") || strings.Contains(low, "not running") {
			m.FirewallStatus = "inactive"
		} else if strings.Contains(low, "active") || strings.Contains(low, "running") {
			m.FirewallStatus = "active"
		}
	}

	for _, line := range sections["SVC"] {
		clean := strings.TrimLeft(line, "\u25cf* ")
		f := strings.Fields(clean)
		if len(f) >= 4 && strings.HasSuffix(f[0], ".service") {
			desc := ""
			if len(f) > 4 {
				desc = strings.Join(f[4:], " ")
			}
			m.Services = append(m.Services, ServiceInfo{
				Name: f[0], Status: f[2], SubState: f[3], Description: desc,
			})
		}
	}

	return m
}

func (a *App) buildDemoMetrics(cfg ServerConfig) ServerMetrics {
	a.mu.Lock()
	st := a.demoStates[cfg.ID]
	if st == nil {
		st = &demoState{baseCPU: 20, baseRAM: 40, baseDisk: 45, online: true, uptime: 86400, firewall: "active"}
		a.demoStates[cfg.ID] = st
	}
	st.uptime += 2
	online := st.online
	svcs := make([]ServiceInfo, len(st.services))
	copy(svcs, st.services)
	procs := make([]ProcessInfo, len(st.processes))
	for i, p := range st.processes {
		p.CPU = round1(clamp(p.CPU+(mrand.Float64()*2.6-1.3), 0.1, 95))
		procs[i] = p
	}
	ctrs := make([]DockerContainer, len(st.containers))
	copy(ctrs, st.containers)
	ports := make([]OpenPort, len(st.openPorts))
	copy(ports, st.openPorts)
	fw := st.firewall
	baseCPU, baseRAM, baseDisk, uptime := st.baseCPU, st.baseRAM, st.baseDisk, st.uptime
	a.mu.Unlock()

	if !online {
		return ServerMetrics{
			ServerID: cfg.ID, Online: false,
			Error:     "Connection timed out: dial tcp " + cfg.Host + ": i/o timeout",
			Timestamp: time.Now().Format("15:04:05"), Hostname: cfg.Name,
			Disks: []DiskMetric{}, Services: []ServiceInfo{}, Processes: []ProcessInfo{},
			Containers: []DockerContainer{}, OpenPorts: []OpenPort{}, HealthIssues: []string{},
		}
	}

	cpu := round1(clamp(baseCPU+(mrand.Float64()*14-7), 3, 98))
	ram := round1(clamp(baseRAM+(mrand.Float64()*4-2), 10, 96))
	disk := round1(clamp(baseDisk+(mrand.Float64()*0.2-0.1), 5, 99))

	ramTotal, diskTotal, osName, kernel, cores := 16.0, 160.0, "Ubuntu 24.04.2 LTS", "6.8.0-49-generic", 4
	if cfg.ID == "demo-db-2" {
		ramTotal, diskTotal, osName, kernel, cores = 32.0, 500.0, "Debian GNU/Linux 12 (bookworm)", "6.1.0-27-amd64", 8
	} else if cfg.ID == "demo-edge-3" {
		ramTotal, diskTotal, osName, kernel, cores = 4.0, 80.0, "AlmaLinux 9.5 (Teal Serval)", "5.14.0-503.el9.x86_64", 2
	}

	m := ServerMetrics{
		ServerID: cfg.ID, Online: true, Timestamp: time.Now().Format("15:04:05"),
		LatencyMs: int64(18 + mrand.IntN(22)), Hostname: strings.ToLower(cfg.Name),
		OS: osName, Kernel: kernel, Uptime: formatUptime(uptime),
		CPUPercent: cpu, CPUCores: cores,
		Load1: round2((cpu / 100.0) * float64(cores)), Load5: round2((baseCPU / 100.0) * float64(cores)),
		Load15:     round2(((baseCPU * 0.9) / 100.0) * float64(cores)),
		RAMTotalGB: ramTotal, RAMUsedGB: round2(ramTotal * ram / 100.0), RAMPercent: ram,
		SwapTotalGB: 4.0, SwapUsedGB: round2(4.0 * clamp(ram-65, 0, 35) / 100.0), SwapPercent: round1(clamp(ram-65, 0, 35)),
		NetRxKBps: round1(85 + mrand.Float64()*620), NetTxKBps: round1(40 + mrand.Float64()*380),
		DiskPercent: disk, DiskUsedGB: round2(diskTotal * disk / 100.0), DiskTotalGB: diskTotal,
		Disks: []DiskMetric{
			{Mount: "/", TotalGB: diskTotal, UsedGB: round2(diskTotal * disk / 100.0), Percent: disk},
			{Mount: "/var/log", TotalGB: 20, UsedGB: 4.8, Percent: 24.0},
		},
		Services: svcs, Processes: procs, DockerAvailable: true,
		Containers: ctrs, OpenPorts: ports, FirewallStatus: fw, HealthIssues: []string{},
	}
	calculateHealth(&m)
	return m
}

func (a *App) ControlService(serverID, serviceName, action string) ActionResult {
	if !validServiceName.MatchString(serviceName) {
		return ActionResult{Success: false, Message: "invalid_service_name"}
	}
	if action != "start" && action != "stop" && action != "restart" {
		return ActionResult{Success: false, Message: "unsupported_action"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	if cfg.IsDemo {
		a.mu.Lock()
		defer a.mu.Unlock()
		if st, exists := a.demoStates[serverID]; exists {
			for i := range st.services {
				if st.services[i].Name == serviceName {
					if action == "stop" {
						st.services[i].Status = "inactive"
						st.services[i].SubState = "dead"
					} else {
						st.services[i].Status = "active"
						st.services[i].SubState = "running"
					}
					return ActionResult{Success: true, Message: fmt.Sprintf("%s (%s)", serviceName, action)}
				}
			}
		}
		return ActionResult{Success: false, Message: "service_not_found"}
	}

	cmd := fmt.Sprintf("systemctl %s %s 2>&1 || sudo -n systemctl %s %s 2>&1", action, serviceName, action, serviceName)
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil {
		msg := strings.TrimSpace(out)
		if msg == "" {
			msg = err.Error()
		}
		return ActionResult{Success: false, Message: msg}
	}
	return ActionResult{Success: true, Message: fmt.Sprintf("%s (%s)", serviceName, action)}
}

func (a *App) GetServiceLogs(serverID, serviceName string) (string, error) {
	if !validServiceName.MatchString(serviceName) {
		return "", errors.New("invalid service name")
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return "", errors.New("server not found")
	}
	if cfg.IsDemo {
		now := time.Now().Format("Nov 02 15:04:05")
		return fmt.Sprintf(
			"%s %s systemd[1]: Starting %s...\n%s %s %s[1842]: Worker pool initialized\n%s %s %s[1842]: Health check passed (1.4ms)\n%s %s systemd[1]: Started %s.",
			now, cfg.Name, serviceName,
			now, cfg.Name, strings.TrimSuffix(serviceName, ".service"),
			now, cfg.Name, strings.TrimSuffix(serviceName, ".service"),
			now, cfg.Name, serviceName,
		), nil
	}
	cmd := fmt.Sprintf("journalctl -u %s -n 40 --no-pager 2>&1 || sudo -n journalctl -u %s -n 40 --no-pager 2>&1", serviceName, serviceName)
	return a.runSSHCommand(cfg, cmd)
}

func (a *App) KillProcess(serverID string, pid int, force bool) ActionResult {
	if pid <= 1 {
		return ActionResult{Success: false, Message: "protected PID cannot be terminated"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	if cfg.IsDemo {
		a.mu.Lock()
		defer a.mu.Unlock()
		if st, exists := a.demoStates[serverID]; exists {
			filtered := make([]ProcessInfo, 0, len(st.processes))
			found := false
			for _, p := range st.processes {
				if p.PID == pid {
					found = true
					continue
				}
				filtered = append(filtered, p)
			}
			st.processes = filtered
			if found {
				return ActionResult{Success: true, Message: fmt.Sprintf("PID %d terminated", pid)}
			}
		}
		return ActionResult{Success: false, Message: "process not found"}
	}

	sig := "15"
	if force {
		sig = "9"
	}
	cmd := fmt.Sprintf("kill -%s %d 2>&1 || sudo -n kill -%s %d 2>&1", sig, pid, sig, pid)
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil {
		msg := strings.TrimSpace(out)
		if msg == "" {
			msg = err.Error()
		}
		return ActionResult{Success: false, Message: msg}
	}
	return ActionResult{Success: true, Message: fmt.Sprintf("PID %d terminated (SIG%s)", pid, sig)}
}

func (a *App) ControlDocker(serverID, containerID, action string) ActionResult {
	if !validContainerID.MatchString(containerID) {
		return ActionResult{Success: false, Message: "invalid container id"}
	}
	if action != "start" && action != "stop" && action != "restart" {
		return ActionResult{Success: false, Message: "unsupported action"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	if cfg.IsDemo {
		a.mu.Lock()
		defer a.mu.Unlock()
		if st, exists := a.demoStates[serverID]; exists {
			for i := range st.containers {
				if st.containers[i].ID == containerID || st.containers[i].Name == containerID {
					if action == "stop" {
						st.containers[i].State = "exited"
						st.containers[i].Status = "Exited (0) just now"
					} else {
						st.containers[i].State = "running"
						st.containers[i].Status = "Up Less than a minute"
					}
					return ActionResult{Success: true, Message: fmt.Sprintf("%s (%s)", st.containers[i].Name, action)}
				}
			}
		}
		return ActionResult{Success: false, Message: "container not found"}
	}

	cmd := fmt.Sprintf("docker %s %s 2>&1 || sudo -n docker %s %s 2>&1", action, containerID, action, containerID)
	out, err := a.runSSHCommand(cfg, cmd)
	if err != nil {
		msg := strings.TrimSpace(out)
		if msg == "" {
			msg = err.Error()
		}
		return ActionResult{Success: false, Message: msg}
	}
	return ActionResult{Success: true, Message: fmt.Sprintf("%s (%s)", containerID, action)}
}

func (a *App) GetDockerLogs(serverID, containerID string) (string, error) {
	if !validContainerID.MatchString(containerID) {
		return "", errors.New("invalid container id")
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return "", errors.New("server not found")
	}
	if cfg.IsDemo {
		now := time.Now().Format("2006-01-02T15:04:05Z")
		return fmt.Sprintf(
			"%s [INFO] Container %s initialized\n%s [INFO] Listening on configured network interface\n%s [INFO] Health probe 200 OK (2.1ms)\n%s [INFO] Ready to accept traffic",
			now, containerID, now, now, now,
		), nil
	}
	cmd := fmt.Sprintf("docker logs --tail 60 %s 2>&1 || sudo -n docker logs --tail 60 %s 2>&1", containerID, containerID)
	return a.runSSHCommand(cfg, cmd)
}

// --- Live Streaming Terminal ---

func (a *App) CancelQuickCommand(serverID string) ActionResult {
	a.termMu.Lock()
	run, ok := a.activeTerm[serverID]
	if ok {
		delete(a.activeTerm, serverID)
	}
	// Copy run.sess while holding the lock: StartQuickCommand's goroutine
	// writes run.sess under termMu, so reading it after Unlock is a data
	// race (the race detector flags it and the value may be stale).
	var sess *ssh.Session
	if ok && run != nil {
		sess = run.sess
	}
	a.termMu.Unlock()

	if !ok || run == nil {
		return ActionResult{Success: false, Message: "no active command"}
	}
	if run.cancel != nil {
		run.cancel()
	}
	if sess != nil {
		_ = sess.Signal(ssh.SIGTERM)
		_ = sess.Close()
	}
	return ActionResult{Success: true, Message: "Command cancelled"}
}

func (a *App) StartQuickCommand(serverID, runID, command string) ActionResult {
	command = strings.TrimSpace(command)
	if command == "" {
		return ActionResult{Success: false, Message: "empty command"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server not found"}
	}

	// Stop any previous running command on this server
	a.CancelQuickCommand(serverID)

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	run := &activeTermRun{runID: runID, cancel: cancel}
	a.termMu.Lock()
	a.activeTerm[serverID] = run
	a.termMu.Unlock()

	emitChunk := func(text string) {
		if text == "" {
			return
		}
		wailsruntime.EventsEmit(a.ctx, "terminal:chunk", map[string]interface{}{
			"serverId": serverID,
			"runId":    runID,
			"text":     text,
		})
	}
	emitDone := func(success bool, durationMs int64, note string) {
		if note != "" {
			emitChunk("\n" + note)
		}
		wailsruntime.EventsEmit(a.ctx, "terminal:done", map[string]interface{}{
			"serverId":   serverID,
			"runId":      runID,
			"success":    success,
			"durationMs": durationMs,
		})
	}

	go func() {
		defer func() {
			cancel()
			a.termMu.Lock()
			if cur, exists := a.activeTerm[serverID]; exists && cur.runID == runID {
				delete(a.activeTerm, serverID)
			}
			a.termMu.Unlock()
		}()

		start := time.Now()
		if cfg.IsDemo {
			lines := demoCommandLines(cfg, command)
			for i, line := range lines {
				select {
				case <-ctx.Done():
					emitDone(false, time.Since(start).Milliseconds(), "[cancelled]")
					return
				case <-time.After(140 * time.Millisecond):
					if i > 0 {
						emitChunk("\n" + line)
					} else {
						emitChunk(line)
					}
				}
			}
			emitDone(true, time.Since(start).Milliseconds(), "")
			return
		}

		client, err := a.getClient(cfg)
		if err != nil {
			emitDone(false, time.Since(start).Milliseconds(), err.Error())
			return
		}
		sess, err := client.NewSession()
		if err != nil {
			a.dropClientIfMatch(cfg.ID, client)
			client, err = a.getClient(cfg)
			if err != nil {
				emitDone(false, time.Since(start).Milliseconds(), err.Error())
				return
			}
			sess, err = client.NewSession()
			if err != nil {
				emitDone(false, time.Since(start).Milliseconds(), err.Error())
				return
			}
		}
		defer sess.Close()

		a.termMu.Lock()
		run.sess = sess
		a.termMu.Unlock()

		stdout, err := sess.StdoutPipe()
		if err != nil {
			emitDone(false, time.Since(start).Milliseconds(), err.Error())
			return
		}
		stderr, err := sess.StderrPipe()
		if err != nil {
			emitDone(false, time.Since(start).Milliseconds(), err.Error())
			return
		}

		wrapped := "export DEBIAN_FRONTEND=noninteractive; " + command
		if err := sess.Start(wrapped); err != nil {
			emitDone(false, time.Since(start).Milliseconds(), err.Error())
			return
		}

		var pipeWg sync.WaitGroup
		streamReader := func(r io.Reader) {
			defer pipeWg.Done()
			buf := make([]byte, 1024)
			for {
				n, readErr := r.Read(buf)
				if n > 0 {
					emitChunk(string(buf[:n]))
				}
				if readErr != nil {
					return
				}
			}
		}
		pipeWg.Add(2)
		go streamReader(stdout)
		go streamReader(stderr)

		waitCh := make(chan error, 1)
		go func() {
			pipeWg.Wait()
			waitCh <- sess.Wait()
		}()

		select {
		case <-ctx.Done():
			_ = sess.Close()
			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				emitDone(false, time.Since(start).Milliseconds(), "[timeout after 120s]")
			} else {
				emitDone(false, time.Since(start).Milliseconds(), "[stopped by user]")
			}
		case runErr := <-waitCh:
			if runErr != nil {
				emitDone(false, time.Since(start).Milliseconds(), "")
			} else {
				emitDone(true, time.Since(start).Milliseconds(), "")
			}
		}
	}()

	return ActionResult{Success: true, Message: "started"}
}

func demoCommandLines(cfg ServerConfig, command string) []string {
	low := strings.ToLower(command)
	switch {
	case strings.Contains(low, "apt") && strings.Contains(low, "update"):
		return []string{
			"Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease",
			"Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]",
			"Get:3 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]",
			"Fetched 252 kB in 1s (310 kB/s)",
			"Reading package lists... Done",
			"All packages are up to date.",
		}
	case low == "whoami":
		return []string{cfg.Username}
	case low == "hostname":
		return []string{strings.ToLower(cfg.Name)}
	case low == "uname -a":
		return []string{"Linux " + strings.ToLower(cfg.Name) + " 6.8.0-49-generic #49-Ubuntu SMP x86_64 GNU/Linux"}
	case low == "uptime":
		return []string{time.Now().Format("15:04:05") + " up 14 days, 6:32, 1 user, load average: 0.42, 0.38, 0.35"}
	case low == "free -h":
		return []string{
			"               total        used        free      shared  buff/cache   available",
			"Mem:            16Gi       7.3Gi       5.2Gi       148Mi       3.5Gi       8.4Gi",
			"Swap:          4.0Gi          0B       4.0Gi",
		}
	case low == "df -h":
		return []string{
			"Filesystem      Size  Used Avail Use% Mounted on",
			"/dev/sda1       160G   84G   76G  53% /",
			"/dev/sda2        20G  4.8G   15G  24% /var/log",
		}
	case strings.HasPrefix(low, "ls"):
		return []string{
			"drwxr-xr-x 4 " + cfg.Username + " " + cfg.Username + " 4096 Nov 22 08:10 .",
			"-rw-r--r-- 1 " + cfg.Username + " " + cfg.Username + "  812 Nov 20 14:22 docker-compose.yml",
			"drwxr-xr-x 2 " + cfg.Username + " " + cfg.Username + " 4096 Nov 21 19:05 scripts",
		}
	default:
		return []string{"[demo sandbox] executed: " + command}
	}
}

func (a *App) RunQuickCommand(serverID, command string) CommandOutput {
	command = strings.TrimSpace(command)
	if command == "" {
		return CommandOutput{Success: false, Output: "empty command"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return CommandOutput{Success: false, Output: "server not found"}
	}
	start := time.Now()
	if cfg.IsDemo {
		return CommandOutput{
			Success:    true,
			Output:     strings.Join(demoCommandLines(cfg, command), "\n"),
			DurationMs: time.Since(start).Milliseconds() + 14,
		}
	}
	out, err := a.runSSHCommand(cfg, "export DEBIAN_FRONTEND=noninteractive; "+command)
	ms := time.Since(start).Milliseconds()
	if err != nil {
		if strings.TrimSpace(out) == "" {
			out = err.Error()
		}
		return CommandOutput{Success: false, Output: out, DurationMs: ms}
	}
	return CommandOutput{Success: true, Output: out, DurationMs: ms}
}

func (a *App) RebootServer(serverID string) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	if cfg.IsDemo {
		a.mu.Lock()
		if st, exists := a.demoStates[serverID]; exists {
			st.online = false
			st.uptime = 0
		}
		a.mu.Unlock()
		go func(id string) {
			time.Sleep(5 * time.Second)
			a.mu.Lock()
			if st, exists := a.demoStates[id]; exists {
				st.online = true
			}
			a.mu.Unlock()
		}(serverID)
		return ActionResult{Success: true, Message: "Demo server rebooting (back in 5s)"}
	}

	cmd := "nohup sh -c 'sleep 1 && (reboot || sudo -n reboot)' >/dev/null 2>&1 &"
	_, err := a.runSSHCommand(cfg, cmd)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Reboot signal sent"}
}

func calculateHealth(m *ServerMetrics) {
	score := 100
	issues := []string{}
	if m.CPUPercent > 85 {
		score -= 25
		issues = append(issues, "high_cpu")
	} else if m.CPUPercent > 70 {
		score -= 10
	}
	if m.RAMPercent > 88 {
		score -= 25
		issues = append(issues, "high_ram")
	} else if m.RAMPercent > 75 {
		score -= 10
	}
	if m.DiskPercent > 85 {
		score -= 25
		issues = append(issues, "low_disk")
	} else if m.DiskPercent > 75 {
		score -= 10
	}
	failedCount := 0
	for _, s := range m.Services {
		if s.Status == "failed" {
			failedCount++
		}
	}
	if failedCount > 0 {
		score -= failedCount * 15
		issues = append(issues, "failed_services")
	}
	if score < 0 {
		score = 0
	}
	m.HealthScore = score
	m.HealthIssues = issues
	m.FailedServices = failedCount
}

func formatUptime(sec int64) string {
	days := sec / 86400
	hours := (sec % 86400) / 3600
	mins := (sec % 3600) / 60
	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, mins)
	}
	return fmt.Sprintf("%dh %dm", hours, mins)
}

func clamp(v, lo, hi float64) float64 { return math.Max(lo, math.Min(hi, v)) }
func round1(v float64) float64        { return math.Round(v*10) / 10 }
func round2(v float64) float64        { return math.Round(v*100) / 100 }
