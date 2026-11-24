package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/pkg/sftp"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/crypto/ssh"
)

const (
	maxEditableFileBytes = 512 * 1024      // 512 KB read/edit limit
	maxWriteFileBytes    = 2 * 1024 * 1024 // 2 MB write safety limit
)

type FileEntry struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	IsDir     bool   `json:"isDir"`
	IsSymlink bool   `json:"isSymlink"`
	Size      int64  `json:"size"`
	Mode      string `json:"mode"`
	ModTime   string `json:"modTime"`
}

type DirListResult struct {
	Success bool        `json:"success"`
	Path    string      `json:"path"`
	Parent  string      `json:"parent"`
	Entries []FileEntry `json:"entries"`
	Error   string      `json:"error"`
}

type FileContentResult struct {
	Success bool   `json:"success"`
	Path    string `json:"path"`
	Content string `json:"content"`
	Size    int64  `json:"size"`
	Error   string `json:"error"`
}

type cachedSFTP struct {
	sshClient  *ssh.Client
	sftpClient *sftp.Client
	homeDir    string
	lastUsed   time.Time
}

type demoFSNode struct {
	isDir   bool
	content string
	mode    string
	modTime string
}

var (
	sftpPoolMu     sync.Mutex
	sftpPool       = map[string]*cachedSFTP{}
	sftpReaperOnce sync.Once

	demoFSMu sync.Mutex
	demoFS   = map[string]map[string]*demoFSNode{}
)

var protectedDeletePaths = map[string]bool{
	"/":                   true,
	"/etc":                true,
	"/etc/ssh":            true,
	"/etc/systemd":        true,
	"/etc/systemd/system": true,
	"/etc/passwd":         true,
	"/etc/shadow":         true,
	"/etc/group":          true,
	"/etc/sudoers":        true,
	"/etc/fstab":          true,
	"/bin":                true,
	"/sbin":               true,
	"/usr":                true,
	"/var":                true,
	"/var/log":            true,
	"/lib":                true,
	"/lib64":              true,
	"/boot":               true,
	"/dev":                true,
	"/proc":               true,
	"/sys":                true,
	"/root":               true,
	"/home":               true,
	"/opt":                true,
	"/srv":                true,
	"/tmp":                true,
	"/run":                true,
}

func getOrInitDemoFS(serverID, username string) map[string]*demoFSNode {
	if fs, ok := demoFS[serverID]; ok {
		return fs
	}
	now := time.Now().Format("2006-01-02 15:04")
	home := demoHomePath(username)
	fs := map[string]*demoFSNode{
		"/":                   {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/home":               {isDir: true, mode: "drwxr-xr-x", modTime: now},
		home:                  {isDir: true, mode: "drwxr-xr-x", modTime: now},
		home + "/backups":     {isDir: true, mode: "drwxr-x---", modTime: now},
		"/etc":                {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/etc/nginx":          {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/etc/systemd":        {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/etc/systemd/system": {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/var":                {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/var/log":            {isDir: true, mode: "drwxr-xr-x", modTime: now},
		"/opt":                {isDir: true, mode: "drwxr-xr-x", modTime: now},
		home + "/docker-compose.yml": {
			isDir:   false,
			mode:    "-rw-r--r--",
			modTime: now,
			content: "services:\n  nginx:\n    image: nginx:1.27-alpine\n    ports:\n      - \"80:80\"\n      - \"443:443\"\n    restart: unless-stopped\n\n  redis:\n    image: redis:7-alpine\n    restart: unless-stopped\n",
		},
		home + "/.env": {
			isDir:   false,
			mode:    "-rw-------",
			modTime: now,
			content: "APP_ENV=production\nAPP_PORT=8080\nLOG_LEVEL=info\nREDIS_HOST=127.0.0.1:6379\n",
		},
		home + "/deploy.sh": {
			isDir:   false,
			mode:    "-rwxr-xr-x",
			modTime: now,
			content: "#!/usr/bin/env bash\nset -euo pipefail\ndocker compose pull\ndocker compose up -d --remove-orphans\necho \"Deployment complete.\"\n",
		},
		"/etc/nginx/nginx.conf": {
			isDir:   false,
			mode:    "-rw-r--r--",
			modTime: now,
			content: "user www-data;\nworker_processes auto;\n\nevents {\n    worker_connections 1024;\n}\n\nhttp {\n    sendfile on;\n    gzip on;\n    include /etc/nginx/conf.d/*.conf;\n}\n",
		},
		"/var/log/app.log": {
			isDir:   false,
			mode:    "-rw-r-----",
			modTime: now,
			content: "[2026-11-24 10:02:14] INFO  server started on :8080\n[2026-11-24 10:05:41] INFO  healthcheck ok (latency=12ms)\n[2026-11-24 10:12:03] WARN  slow query detected (240ms)\n",
		},
	}
	demoFS[serverID] = fs
	return fs
}

func demoHomePath(username string) string {
	if username == "" || username == "root" {
		return "/root"
	}
	return "/home/" + username
}

func isSFTPConnError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "eof") ||
		strings.Contains(msg, "connection lost") ||
		strings.Contains(msg, "no connection") ||
		strings.Contains(msg, "closed") ||
		strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "reset by peer")
}

func (a *App) invalidateSFTP(serverID string, badClient *sftp.Client, dropSSH bool) {
	var sshToClose *ssh.Client
	sftpPoolMu.Lock()
	if entry, ok := sftpPool[serverID]; ok {
		if badClient == nil || entry.sftpClient == badClient {
			_ = entry.sftpClient.Close()
			sshToClose = entry.sshClient
			delete(sftpPool, serverID)
		}
	}
	sftpPoolMu.Unlock()

	if dropSSH && sshToClose != nil {
		a.mu.Lock()
		if cur, ok := a.clients[serverID]; ok && cur == sshToClose {
			_ = cur.Close()
			delete(a.clients, serverID)
		}
		a.mu.Unlock()
	}
}

func (a *App) ensureSFTPIdleReaper() {
	sftpReaperOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(60 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-a.trayStopCh:
					return
				case <-ticker.C:
					now := time.Now()
					var stale []*sftp.Client
					sftpPoolMu.Lock()
					for id, entry := range sftpPool {
						if entry != nil && now.Sub(entry.lastUsed) > 90*time.Second {
							stale = append(stale, entry.sftpClient)
							delete(sftpPool, id)
						}
					}
					sftpPoolMu.Unlock()
					for _, sc := range stale {
						if sc != nil {
							_ = sc.Close()
						}
					}
				}
			}
		}()
	})
}
func (a *App) closeAllSFTP() {
	sftpPoolMu.Lock()
	list := make([]*cachedSFTP, 0, len(sftpPool))
	for id, entry := range sftpPool {
		list = append(list, entry)
		delete(sftpPool, id)
	}
	sftpPoolMu.Unlock()

	for _, entry := range list {
		if entry != nil && entry.sftpClient != nil {
			_ = entry.sftpClient.Close()
		}
	}
}

func sftpClientOpts() []sftp.ClientOption {
	return []sftp.ClientOption{
		sftp.MaxPacket(16384),
		sftp.MaxConcurrentRequestsPerFile(4),
		sftp.UseConcurrentReads(false),
		sftp.UseConcurrentWrites(false),
	}
}

func (a *App) getSFTPClient(cfg ServerConfig) (*sftp.Client, string, error) {
	sshClient, err := a.getClient(cfg)
	if err != nil {
		return nil, "", err
	}

	sftpPoolMu.Lock()
	if entry, ok := sftpPool[cfg.ID]; ok && entry != nil && entry.sftpClient != nil {
		if entry.sshClient == sshClient {
			entry.lastUsed = time.Now()
			sc := entry.sftpClient
			home := entry.homeDir
			sftpPoolMu.Unlock()
			return sc, home, nil
		}
		// Underlying SSH client changed (e.g. server config updated or reconnected)
		_ = entry.sftpClient.Close()
		delete(sftpPool, cfg.ID)
	}
	sftpPoolMu.Unlock()

	sc, err := sftp.NewClient(sshClient, sftpClientOpts()...)
	if err != nil {
		// Stale cached SSH client: drop it and retry once
		a.mu.Lock()
		if old, ok := a.clients[cfg.ID]; ok && old == sshClient {
			_ = old.Close()
			delete(a.clients, cfg.ID)
		}
		a.mu.Unlock()

		sshClient, err = a.getClient(cfg)
		if err != nil {
			return nil, "", err
		}
		sc, err = sftp.NewClient(sshClient, sftpClientOpts()...)
		if err != nil {
			return nil, "", err
		}
	}

	home := ""
	if wd, werr := sc.Getwd(); werr == nil && wd != "" {
		home = path.Clean(wd)
	}

	sftpPoolMu.Lock()
	if prev, ok := sftpPool[cfg.ID]; ok && prev != nil && prev.sftpClient != nil {
		// Another goroutine won the race; close our extra channel and reuse theirs
		sftpPoolMu.Unlock()
		_ = sc.Close()
		return prev.sftpClient, prev.homeDir, nil
	}
	sftpPool[cfg.ID] = &cachedSFTP{
		sshClient:  sshClient,
		sftpClient: sc,
		homeDir:    home,
		lastUsed:   time.Now(),
	}
	sftpPoolMu.Unlock()
	a.ensureSFTPIdleReaper()

	return sc, home, nil
}

func (a *App) withSFTP(cfg ServerConfig, fn func(sc *sftp.Client, home string) error) error {
	sc, home, err := a.getSFTPClient(cfg)
	if err != nil {
		return err
	}
	err = fn(sc, home)
	if err != nil && isSFTPConnError(err) {
		a.invalidateSFTP(cfg.ID, sc, true)
		sc, home, err = a.getSFTPClient(cfg)
		if err != nil {
			return err
		}
		return fn(sc, home)
	}
	return err
}

func sanitizeRemotePath(p string) (string, error) {
	if strings.ContainsAny(p, "\x00\r\n") {
		return "", errors.New("invalid characters in path")
	}
	p = strings.TrimSpace(strings.ReplaceAll(p, "\\", "/"))
	if p == "" {
		return "", nil
	}
	return path.Clean(p), nil
}

func parentRemotePath(p string) string {
	c := path.Clean(p)
	if c == "/" || c == "." {
		return "/"
	}
	return path.Dir(c)
}

func validateBaseName(name string) (string, error) {
	if strings.ContainsAny(name, "\x00\r\n/\\") {
		return "", errors.New("invalid file or folder name")
	}
	name = strings.TrimSpace(name)
	if name == "" || name == "." || name == ".." {
		return "", errors.New("invalid file or folder name")
	}
	return name, nil
}

func sortFileEntries(entries []FileEntry) {
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].IsDir != entries[j].IsDir {
			return entries[i].IsDir
		}
		return strings.ToLower(entries[i].Name) < strings.ToLower(entries[j].Name)
	})
}

func isBinaryData(data []byte) bool {
	limit := len(data)
	if limit > 8192 {
		limit = 8192
	}
	return bytes.IndexByte(data[:limit], 0) >= 0
}

func writeFileAtomicSFTP(sc *sftp.Client, target, content string) error {
	realTarget := target
	var origMode os.FileMode
	hasOrigMode := false

	if lst, lerr := sc.Lstat(target); lerr == nil {
		if lst.Mode()&os.ModeSymlink != 0 {
			if rp, rerr := sc.RealPath(target); rerr == nil && rp != "" {
				realTarget = rp
			}
		}
		if st, serr := sc.Stat(realTarget); serr == nil {
			if st.IsDir() {
				return errors.New("target is a directory")
			}
			if !st.Mode().IsRegular() {
				return errors.New("refusing to write to special/non-regular file")
			}
			origMode = st.Mode().Perm()
			hasOrigMode = true
		}
	}

	rb := make([]byte, 6)
	_, _ = rand.Read(rb)
	tmpPath := path.Join(path.Dir(realTarget), ".zd-tmp-"+hex.EncodeToString(rb))

	tmpFile, err := sc.OpenFile(tmpPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL)
	if err == nil {
		if hasOrigMode {
			_ = sc.Chmod(tmpPath, origMode)
		}
		_, werr := io.WriteString(tmpFile, content)
		cerr := tmpFile.Close()
		if werr != nil {
			_ = sc.Remove(tmpPath)
			return werr
		}
		if cerr != nil {
			_ = sc.Remove(tmpPath)
			return cerr
		}
		if rerr := sc.PosixRename(tmpPath, realTarget); rerr == nil {
			return nil
		}
		_ = sc.Remove(tmpPath)
	}

	f, err := sc.OpenFile(realTarget, os.O_WRONLY|os.O_CREATE|os.O_TRUNC)
	if err != nil {
		return err
	}
	if _, err := io.WriteString(f, content); err != nil {
		_ = f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	if hasOrigMode {
		_ = sc.Chmod(realTarget, origMode)
	}
	return nil
}

func (a *App) SFTPListDir(serverID, dirPath string) DirListResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return DirListResult{Success: false, Error: "server_not_found", Entries: []FileEntry{}}
	}
	target, perr := sanitizeRemotePath(dirPath)
	if perr != nil {
		return DirListResult{Success: false, Error: perr.Error(), Entries: []FileEntry{}}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		if target == "" || target == "~" {
			target = demoHomePath(cfg.Username)
		}
		node, exists := fs[target]
		if !exists || !node.isDir {
			return DirListResult{Success: false, Path: target, Error: "directory not found: " + target, Entries: []FileEntry{}}
		}
		entries := make([]FileEntry, 0)
		for p, n := range fs {
			if p == target {
				continue
			}
			if path.Dir(p) == target {
				entries = append(entries, FileEntry{
					Name:    path.Base(p),
					Path:    p,
					IsDir:   n.isDir,
					Size:    int64(len(n.content)),
					Mode:    n.mode,
					ModTime: n.modTime,
				})
			}
		}
		sortFileEntries(entries)
		return DirListResult{
			Success: true,
			Path:    target,
			Parent:  parentRemotePath(target),
			Entries: entries,
		}
	}

	var result DirListResult
	err := a.withSFTP(cfg, func(sc *sftp.Client, home string) error {
		resolved := target
		if resolved == "" || resolved == "~" {
			if home != "" {
				resolved = home
			} else if wd, werr := sc.Getwd(); werr == nil && wd != "" {
				resolved = path.Clean(wd)
			} else {
				resolved = "/"
			}
		} else if strings.HasPrefix(resolved, "~/") && home != "" {
			resolved = path.Join(home, strings.TrimPrefix(resolved, "~/"))
		}

		infos, rerr := sc.ReadDir(resolved)
		if rerr != nil {
			if isSFTPConnError(rerr) {
				return rerr
			}
			// If user clicked a symlink pointing to a regular file, tell UI to open it in editor
			if st, serr := sc.Stat(resolved); serr == nil && !st.IsDir() {
				result = DirListResult{Success: false, Path: resolved, Error: "NOT_A_DIRECTORY", Entries: []FileEntry{}}
				return nil
			}
			result = DirListResult{Success: false, Path: resolved, Error: rerr.Error(), Entries: []FileEntry{}}
			return nil
		}

		// Zero N+1 per-symlink Stat calls so high-latency servers load in a single round-trip
		entries := make([]FileEntry, 0, len(infos))
		for _, info := range infos {
			name := info.Name()
			isSymlink := info.Mode()&os.ModeSymlink != 0
			entries = append(entries, FileEntry{
				Name:      name,
				Path:      path.Join(resolved, name),
				IsDir:     info.IsDir(),
				IsSymlink: isSymlink,
				Size:      info.Size(),
				Mode:      info.Mode().String(),
				ModTime:   info.ModTime().Format("2006-01-02 15:04"),
			})
		}
		sortFileEntries(entries)

		result = DirListResult{
			Success: true,
			Path:    resolved,
			Parent:  parentRemotePath(resolved),
			Entries: entries,
		}
		return nil
	})
	if err != nil {
		return DirListResult{Success: false, Path: target, Error: err.Error(), Entries: []FileEntry{}}
	}
	return result
}

func (a *App) SFTPReadFile(serverID, filePath string) FileContentResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return FileContentResult{Success: false, Error: "server_not_found"}
	}
	target, perr := sanitizeRemotePath(filePath)
	if perr != nil || target == "" {
		return FileContentResult{Success: false, Error: "invalid file path"}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		node, exists := fs[target]
		if !exists || node.isDir {
			return FileContentResult{Success: false, Path: target, Error: "file not found"}
		}
		return FileContentResult{
			Success: true,
			Path:    target,
			Content: node.content,
			Size:    int64(len(node.content)),
		}
	}

	var res FileContentResult
	err := a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		st, err := sc.Stat(target)
		if err != nil {
			if isSFTPConnError(err) {
				return err
			}
			res = FileContentResult{Success: false, Path: target, Error: err.Error()}
			return nil
		}
		if st.IsDir() {
			res = FileContentResult{Success: false, Path: target, Error: "path is a directory"}
			return nil
		}
		if !st.Mode().IsRegular() {
			res = FileContentResult{Success: false, Path: target, Error: "refusing to read special/device file"}
			return nil
		}
		if st.Size() > maxEditableFileBytes {
			res = FileContentResult{
				Success: false,
				Path:    target,
				Size:    st.Size(),
				Error:   fmt.Sprintf("file is too large to edit in-app (%d KB, max 512 KB) — download it instead", st.Size()/1024),
			}
			return nil
		}

		f, err := sc.Open(target)
		if err != nil {
			if isSFTPConnError(err) {
				return err
			}
			res = FileContentResult{Success: false, Path: target, Error: err.Error()}
			return nil
		}
		defer f.Close()

		data, err := io.ReadAll(io.LimitReader(f, maxEditableFileBytes+1))
		if err != nil {
			if isSFTPConnError(err) {
				return err
			}
			res = FileContentResult{Success: false, Path: target, Error: err.Error()}
			return nil
		}
		if len(data) > maxEditableFileBytes {
			res = FileContentResult{Success: false, Path: target, Error: "file exceeds 512 KB editor limit"}
			return nil
		}
		if isBinaryData(data) {
			res = FileContentResult{Success: false, Path: target, Error: "binary file cannot be edited as text — download it instead"}
			return nil
		}

		res = FileContentResult{
			Success: true,
			Path:    target,
			Content: string(data),
			Size:    int64(len(data)),
		}
		return nil
	})
	if err != nil {
		return FileContentResult{Success: false, Path: target, Error: err.Error()}
	}
	return res
}

func (a *App) SFTPWriteFile(serverID, filePath, content string) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	target, perr := sanitizeRemotePath(filePath)
	if perr != nil || target == "" {
		return ActionResult{Success: false, Message: "invalid file path"}
	}
	if len(content) > maxWriteFileBytes {
		return ActionResult{Success: false, Message: "file content exceeds 2 MB safety limit"}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		now := time.Now().Format("2006-01-02 15:04")
		if node, exists := fs[target]; exists {
			if node.isDir {
				return ActionResult{Success: false, Message: "target is a directory"}
			}
			node.content = content
			node.modTime = now
		} else {
			fs[target] = &demoFSNode{isDir: false, content: content, mode: "-rw-r--r--", modTime: now}
		}
		return ActionResult{Success: true, Message: "Saved " + path.Base(target)}
	}

	err := a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		return writeFileAtomicSFTP(sc, target, content)
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Saved " + path.Base(target)}
}

func (a *App) SFTPMkdir(serverID, parentDir, folderName string) ActionResult {
	name, err := validateBaseName(folderName)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	parent, perr := sanitizeRemotePath(parentDir)
	if perr != nil || parent == "" {
		return ActionResult{Success: false, Message: "invalid parent directory"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	target := path.Join(parent, name)

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		if _, exists := fs[target]; exists {
			return ActionResult{Success: false, Message: "already exists"}
		}
		fs[target] = &demoFSNode{isDir: true, mode: "drwxr-xr-x", modTime: time.Now().Format("2006-01-02 15:04")}
		return ActionResult{Success: true, Message: "Created folder " + name}
	}

	err = a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		return sc.Mkdir(target)
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Created folder " + name}
}

func (a *App) SFTPNewFile(serverID, parentDir, fileName string) ActionResult {
	name, err := validateBaseName(fileName)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	parent, perr := sanitizeRemotePath(parentDir)
	if perr != nil || parent == "" {
		return ActionResult{Success: false, Message: "invalid parent directory"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	target := path.Join(parent, name)

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		if _, exists := fs[target]; exists {
			return ActionResult{Success: false, Message: "file already exists"}
		}
		fs[target] = &demoFSNode{isDir: false, content: "", mode: "-rw-r--r--", modTime: time.Now().Format("2006-01-02 15:04")}
		return ActionResult{Success: true, Message: target}
	}

	err = a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		f, oerr := sc.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY)
		if oerr != nil {
			return oerr
		}
		return f.Close()
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: target}
}

func (a *App) SFTPRename(serverID, oldPath, newName string) ActionResult {
	name, err := validateBaseName(newName)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	src, perr := sanitizeRemotePath(oldPath)
	if perr != nil || src == "" {
		return ActionResult{Success: false, Message: "invalid path"}
	}
	if protectedDeletePaths[src] {
		return ActionResult{Success: false, Message: "cannot rename protected system path"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	dst := path.Join(path.Dir(src), name)
	if src == dst {
		return ActionResult{Success: true, Message: "Unchanged"}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		node, exists := fs[src]
		if !exists {
			return ActionResult{Success: false, Message: "not found"}
		}
		if _, collision := fs[dst]; collision {
			return ActionResult{Success: false, Message: "destination already exists"}
		}
		delete(fs, src)
		fs[dst] = node
		if node.isDir {
			prefix := src + "/"
			moves := make(map[string]*demoFSNode)
			for k, v := range fs {
				if strings.HasPrefix(k, prefix) {
					moves[dst+"/"+strings.TrimPrefix(k, prefix)] = v
					delete(fs, k)
				}
			}
			for k, v := range moves {
				fs[k] = v
			}
		}
		return ActionResult{Success: true, Message: "Renamed to " + name}
	}

	err = a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		return sc.Rename(src, dst)
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Renamed to " + name}
}

func removeSFTPRecursive(sc *sftp.Client, target string) error {
	st, err := sc.Lstat(target)
	if err != nil {
		return err
	}
	if !st.IsDir() {
		return sc.Remove(target)
	}
	entries, err := sc.ReadDir(target)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if err := removeSFTPRecursive(sc, path.Join(target, e.Name())); err != nil {
			return err
		}
	}
	return sc.RemoveDirectory(target)
}

func (a *App) SFTPDelete(serverID, targetPath string) ActionResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	target, perr := sanitizeRemotePath(targetPath)
	if perr != nil || target == "" || protectedDeletePaths[target] {
		return ActionResult{Success: false, Message: "cannot delete protected system path"}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		if _, exists := fs[target]; !exists {
			return ActionResult{Success: false, Message: "not found"}
		}
		prefix := target + "/"
		for k := range fs {
			if k == target || strings.HasPrefix(k, prefix) {
				delete(fs, k)
			}
		}
		return ActionResult{Success: true, Message: "Deleted " + path.Base(target)}
	}

	err := a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		return removeSFTPRecursive(sc, target)
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Deleted " + path.Base(target)}
}

func (a *App) SFTPUploadFile(serverID, remoteDir string) ActionResult {
	if a.ctx == nil {
		return ActionResult{Success: false, Message: "window context unavailable"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	parent, perr := sanitizeRemotePath(remoteDir)
	if perr != nil || parent == "" {
		return ActionResult{Success: false, Message: "invalid destination directory"}
	}

	localPath, err := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Upload File to Server",
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if strings.TrimSpace(localPath) == "" {
		return ActionResult{Success: false, Message: "cancelled"}
	}

	lst, err := os.Stat(localPath)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if !lst.Mode().IsRegular() {
		return ActionResult{Success: false, Message: "selected item is not a regular file"}
	}

	baseName, berr := validateBaseName(filepath.Base(localPath))
	if berr != nil {
		return ActionResult{Success: false, Message: berr.Error()}
	}
	remoteTarget := path.Join(parent, baseName)

	if cfg.IsDemo {
		data, rerr := os.ReadFile(localPath)
		if rerr != nil {
			return ActionResult{Success: false, Message: rerr.Error()}
		}
		demoFSMu.Lock()
		defer demoFSMu.Unlock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		fs[remoteTarget] = &demoFSNode{
			isDir:   false,
			content: string(data),
			mode:    "-rw-r--r--",
			modTime: time.Now().Format("2006-01-02 15:04"),
		}
		return ActionResult{Success: true, Message: "Uploaded " + baseName}
	}

	err = a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		src, oerr := os.Open(localPath)
		if oerr != nil {
			return oerr
		}
		defer src.Close()

		dst, cerr := sc.Create(remoteTarget)
		if cerr != nil {
			return cerr
		}
		if _, cerr := io.Copy(dst, src); cerr != nil {
			_ = dst.Close()
			return cerr
		}
		return dst.Close()
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Uploaded " + baseName}
}

func (a *App) SFTPDownloadFile(serverID, remotePath string) ActionResult {
	if a.ctx == nil {
		return ActionResult{Success: false, Message: "window context unavailable"}
	}
	cfg, ok := a.findServer(serverID)
	if !ok {
		return ActionResult{Success: false, Message: "server_not_found"}
	}
	target, perr := sanitizeRemotePath(remotePath)
	if perr != nil || target == "" {
		return ActionResult{Success: false, Message: "invalid file path"}
	}

	savePath, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		Title:           "Download File from Server",
		DefaultFilename: path.Base(target),
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if strings.TrimSpace(savePath) == "" {
		return ActionResult{Success: false, Message: "cancelled"}
	}

	if cfg.IsDemo {
		demoFSMu.Lock()
		fs := getOrInitDemoFS(serverID, cfg.Username)
		node, exists := fs[target]
		var content string
		if exists && !node.isDir {
			content = node.content
		}
		demoFSMu.Unlock()
		if !exists || node.isDir {
			return ActionResult{Success: false, Message: "file not found"}
		}
		if werr := os.WriteFile(savePath, []byte(content), 0644); werr != nil {
			return ActionResult{Success: false, Message: werr.Error()}
		}
		return ActionResult{Success: true, Message: "Downloaded " + path.Base(target)}
	}

	err = a.withSFTP(cfg, func(sc *sftp.Client, _ string) error {
		st, serr := sc.Stat(target)
		if serr != nil {
			return serr
		}
		if st.IsDir() || !st.Mode().IsRegular() {
			return errors.New("can only download regular files")
		}

		src, oerr := sc.Open(target)
		if oerr != nil {
			return oerr
		}
		defer src.Close()

		dst, cerr := os.Create(savePath)
		if cerr != nil {
			return cerr
		}
		if _, cerr := io.Copy(dst, src); cerr != nil {
			_ = dst.Close()
			return cerr
		}
		return dst.Close()
	})
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Downloaded " + path.Base(target)}
}
