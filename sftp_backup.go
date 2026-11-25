package main

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/pkg/sftp"
)

type SftpBackupItem struct {
	ID        string `json:"id"`
	FilePath  string `json:"filePath"`
	FileName  string `json:"fileName"`
	CreatedAt string `json:"createdAt"`
	Size      int64  `json:"size"`
}

type SftpBackupStats struct {
	TotalCount  int    `json:"totalCount"`
	TotalBytes  int64  `json:"totalBytes"`
	BackupDir   string `json:"backupDir"`
	IsCustomDir bool   `json:"isCustomDir"`
}

type SftpRestoreResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Content string `json:"content"`
}

var sftpBackupMu sync.Mutex

var winReservedNames = map[string]bool{
	"CON": true, "PRN": true, "AUX": true, "NUL": true,
	"COM1": true, "COM2": true, "COM3": true, "COM4": true, "COM5": true,
	"COM6": true, "COM7": true, "COM8": true, "COM9": true,
	"LPT1": true, "LPT2": true, "LPT3": true, "LPT4": true, "LPT5": true,
	"LPT6": true, "LPT7": true, "LPT8": true, "LPT9": true,
}

func (a *App) getSftpBackupConfig() (bool, bool, int, string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	max := a.settings.SftpMaxBackups
	if max < 1 || max > 1000 {
		max = 5
	}
	return a.settings.SftpAutoBackup, a.settings.SftpKeepAllBackups, max, strings.TrimSpace(a.settings.SftpBackupDir)
}

func safeBackupSegment(raw string) string {
	var b strings.Builder
	for _, r := range raw {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			b.WriteRune(r)
		} else {
			b.WriteByte('_')
		}
	}
	out := strings.Trim(b.String(), " ._")
	if out == "" || out == "." || out == ".." {
		return "item"
	}
	upper := strings.ToUpper(strings.Split(out, ".")[0])
	if winReservedNames[upper] {
		out = "_" + out
	}
	if len(out) > 64 {
		out = out[:64]
	}
	return out
}

func hashRemotePath(target string) string {
	sum := sha256.Sum256([]byte(target))
	return hex.EncodeToString(sum[:8])
}

func isValidBackupID(id string) bool {
	if len(id) < 10 || len(id) > 64 {
		return false
	}
	for i := 0; i < len(id); i++ {
		c := id[i]
		if !((c >= '0' && c <= '9') || c == '-' || c == '_') {
			return false
		}
	}
	return true
}

func parseBackupCreatedAt(id string, fallback time.Time) string {
	// New format: 2026-11-25_15-20-01__1764082801123456789
	if idx := strings.LastIndex(id, "__"); idx >= 0 && idx+2 < len(id) {
		if nano, err := strconv.ParseInt(id[idx+2:], 10, 64); err == nil {
			return time.Unix(0, nano).Local().Format("2006-01-02 15:04:05")
		}
	}
	// Legacy format: unixNano only
	if nano, err := strconv.ParseInt(id, 10, 64); err == nil {
		return time.Unix(0, nano).Local().Format("2006-01-02 15:04:05")
	}
	return fallback.Local().Format("2006-01-02 15:04:05")
}

func (a *App) resolveSftpBackupRoot(create bool) (string, bool, error) {
	_, _, _, customDir := a.getSftpBackupConfig()
	isCustom := customDir != ""
	var root string
	if isCustom {
		root = filepath.Clean(customDir)
	} else {
		dir, err := getVaultDir()
		if err != nil {
			return "", false, err
		}
		root = filepath.Join(dir, "sftp-backups")
	}
	if create {
		if err := os.MkdirAll(root, 0700); err != nil {
			return "", isCustom, err
		}
	}
	return root, isCustom, nil
}

func (a *App) getServerBackupDir(root, serverID string, create bool) (string, error) {
	idTag := safeBackupSegment(serverID)
	if len(idTag) > 36 {
		idTag = idTag[:36]
	}
	suffix := "__" + idTag

	// Reuse an existing server folder matching this server ID even if server was renamed
	if entries, err := os.ReadDir(root); err == nil {
		for _, e := range entries {
			if e.IsDir() && (e.Name() == idTag || strings.HasSuffix(e.Name(), suffix)) {
				return filepath.Join(root, e.Name()), nil
			}
		}
	}

	folderName := idTag
	if cfg, ok := a.findServer(serverID); ok && strings.TrimSpace(cfg.Name) != "" {
		nameSeg := safeBackupSegment(cfg.Name)
		if len(nameSeg) > 36 {
			nameSeg = nameSeg[:36]
		}
		if nameSeg != "" && nameSeg != idTag {
			folderName = nameSeg + suffix
		}
	}

	dir := filepath.Join(root, folderName)
	if create {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return "", err
		}
	}
	return dir, nil
}

func (a *App) getSftpFileBackupDir(serverID, targetPath string, create bool) (string, error) {
	root, _, err := a.resolveSftpBackupRoot(create)
	if err != nil {
		return "", err
	}
	serverDir, err := a.getServerBackupDir(root, serverID, create)
	if err != nil {
		return "", err
	}

	// Mirror remote folder hierarchy cleanly so identical filenames in different folders never collide:
	// <root>/<ServerName>__<ServerID>/etc/nginx/sites-enabled/default.conf.snapshots/
	cleaned := strings.TrimPrefix(path.Clean(targetPath), "/")
	parts := strings.Split(cleaned, "/")
	relElems := make([]string, 0, len(parts))
	for i, p := range parts {
		if p == "" || p == "." || p == ".." {
			continue
		}
		seg := safeBackupSegment(p)
		if i == len(parts)-1 {
			seg = seg + ".snapshots"
		}
		relElems = append(relElems, seg)
	}
	if len(relElems) == 0 {
		relElems = []string{"file.snapshots"}
	}

	dir := filepath.Join(append([]string{serverDir}, relElems...)...)
	// Guard against Windows MAX_PATH on deeply nested Linux paths
	if len(dir) > 190 {
		leaf := safeBackupSegment(path.Base(targetPath))
		dir = filepath.Join(serverDir, "_deep", leaf+"__"+hashRemotePath(targetPath)+".snapshots")
	}

	if create {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return "", err
		}
	}
	return dir, nil
}

func (a *App) saveLocalSftpBackup(serverID, targetPath string, prevBytes []byte, keepAll bool, maxBackups int) error {
	if len(prevBytes) > maxWriteFileBytes {
		return nil
	}
	if maxBackups < 1 || maxBackups > 1000 {
		maxBackups = 5
	}

	sftpBackupMu.Lock()
	defer sftpBackupMu.Unlock()

	dir, err := a.getSftpFileBackupDir(serverID, targetPath, true)
	if err != nil {
		return err
	}

	now := time.Now()
	id := now.Format("2006-01-02_15-04-05") + "__" + strconv.FormatInt(now.UnixNano(), 10)
	bakPath := filepath.Join(dir, id+".bak")
	if err := os.WriteFile(bakPath, prevBytes, 0600); err != nil {
		return err
	}

	if keepAll {
		return nil
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".bak") {
			names = append(names, e.Name())
		}
	}
	sort.Sort(sort.Reverse(sort.StringSlice(names)))
	for i := maxBackups; i < len(names); i++ {
		_ = os.Remove(filepath.Join(dir, names[i]))
	}
	return nil
}

func (a *App) backupRemoteFileIfNeeded(sc *sftp.Client, serverID, target, newContent string, keepAll bool, maxBackups int) {
	fi, err := sc.Stat(target)
	if err != nil || fi.IsDir() || fi.Size() > maxWriteFileBytes {
		return
	}
	f, err := sc.Open(target)
	if err != nil {
		return
	}
	prevBytes, rerr := io.ReadAll(io.LimitReader(f, maxWriteFileBytes+1))
	_ = f.Close()
	if rerr != nil || int64(len(prevBytes)) > maxWriteFileBytes {
		return
	}
	if string(prevBytes) == newContent {
		return
	}
	_ = a.saveLocalSftpBackup(serverID, target, prevBytes, keepAll, maxBackups)
}

func (a *App) SFTPListBackups(serverID, filePath string) ([]SftpBackupItem, error) {
	target, perr := sanitizeRemotePath(filePath)
	if perr != nil || target == "" {
		return []SftpBackupItem{}, nil
	}
	dir, err := a.getSftpFileBackupDir(serverID, target, false)
	if err != nil {
		return []SftpBackupItem{}, nil
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []SftpBackupItem{}, nil
		}
		return nil, err
	}

	items := make([]SftpBackupItem, 0, len(entries))
	baseName := path.Base(target)
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".bak") {
			continue
		}
		id := strings.TrimSuffix(e.Name(), ".bak")
		if !isValidBackupID(id) {
			continue
		}
		info, ierr := e.Info()
		if ierr != nil {
			continue
		}
		items = append(items, SftpBackupItem{
			ID:        id,
			FilePath:  target,
			FileName:  baseName,
			CreatedAt: parseBackupCreatedAt(id, info.ModTime()),
			Size:      info.Size(),
		})
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].ID > items[j].ID
	})
	return items, nil
}

func (a *App) SFTPRestoreBackup(serverID, filePath, backupID string) SftpRestoreResult {
	if !isValidBackupID(backupID) {
		return SftpRestoreResult{Success: false, Message: "invalid backup id"}
	}
	target, perr := sanitizeRemotePath(filePath)
	if perr != nil || target == "" {
		return SftpRestoreResult{Success: false, Message: "invalid file path"}
	}
	dir, err := a.getSftpFileBackupDir(serverID, target, false)
	if err != nil {
		return SftpRestoreResult{Success: false, Message: err.Error()}
	}
	bakPath := filepath.Join(dir, backupID+".bak")
	data, err := os.ReadFile(bakPath)
	if err != nil {
		return SftpRestoreResult{Success: false, Message: "backup file not found"}
	}
	if len(data) > maxWriteFileBytes {
		return SftpRestoreResult{Success: false, Message: "backup exceeds safety limit"}
	}

	content := string(data)
	res := a.SFTPWriteFile(serverID, target, content)
	if !res.Success {
		return SftpRestoreResult{Success: false, Message: res.Message}
	}
	return SftpRestoreResult{
		Success: true,
		Message: "Restored " + path.Base(target),
		Content: content,
	}
}

func (a *App) SFTPDeleteBackup(serverID, filePath, backupID string) ActionResult {
	if !isValidBackupID(backupID) {
		return ActionResult{Success: false, Message: "invalid backup id"}
	}
	target, perr := sanitizeRemotePath(filePath)
	if perr != nil || target == "" {
		return ActionResult{Success: false, Message: "invalid file path"}
	}
	dir, err := a.getSftpFileBackupDir(serverID, target, false)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}
	if err := os.Remove(filepath.Join(dir, backupID+".bak")); err != nil && !os.IsNotExist(err) {
		return ActionResult{Success: false, Message: err.Error()}
	}
	return ActionResult{Success: true, Message: "Backup deleted"}
}

func (a *App) SFTPGetBackupStats() SftpBackupStats {
	root, isCustom, err := a.resolveSftpBackupRoot(false)
	if err != nil {
		return SftpBackupStats{}
	}
	stats := SftpBackupStats{
		BackupDir:   root,
		IsCustomDir: isCustom,
	}
	_ = filepath.WalkDir(root, func(_ string, d os.DirEntry, werr error) error {
		if werr != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".bak") {
			return nil
		}
		if info, ierr := d.Info(); ierr == nil {
			stats.TotalCount++
			stats.TotalBytes += info.Size()
		}
		return nil
	})
	return stats
}

func (a *App) SFTPClearBackups(serverID string) ActionResult {
	sftpBackupMu.Lock()
	defer sftpBackupMu.Unlock()

	root, _, err := a.resolveSftpBackupRoot(false)
	if err != nil {
		return ActionResult{Success: false, Message: err.Error()}
	}

	if strings.TrimSpace(serverID) != "" {
		serverDir, serr := a.getServerBackupDir(root, serverID, false)
		if serr != nil {
			return ActionResult{Success: false, Message: serr.Error()}
		}
		if err := os.RemoveAll(serverDir); err != nil {
			return ActionResult{Success: false, Message: err.Error()}
		}
		return ActionResult{Success: true, Message: "Server SFTP backups cleared"}
	}

	// Safely delete only .bak files & empty snapshot subfolders so custom user folders are never harmed
	_ = filepath.WalkDir(root, func(p string, d os.DirEntry, werr error) error {
		if werr != nil || d.IsDir() {
			return nil
		}
		if strings.HasSuffix(d.Name(), ".bak") {
			_ = os.Remove(p)
		}
		return nil
	})
	return ActionResult{Success: true, Message: "Local SFTP backups cleared"}
}
