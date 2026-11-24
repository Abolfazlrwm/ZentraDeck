package main

import (
	"encoding/base64"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/crypto/ssh"
)

type PTYStartResult struct {
	Success   bool   `json:"success"`
	SessionID string `json:"sessionId"`
	Error     string `json:"error"`
}

type ptySession struct {
	id          string
	serverID    string
	serverName  string
	username    string
	containerID string
	isDemo      bool
	session     *ssh.Session
	stdin       io.WriteCloser
	demoBuf     string
	demoCwd     string
	mu          sync.Mutex
	closed      bool
}

func (a *App) emitPTYData(sessionID string, raw []byte) {
	if a.ctx == nil || len(raw) == 0 {
		return
	}
	wailsruntime.EventsEmit(a.ctx, "pty:data", map[string]interface{}{
		"sessionId": sessionID,
		"data":      base64.StdEncoding.EncodeToString(raw),
	})
}

func (a *App) emitPTYExit(sessionID, reason string) {
	if a.ctx == nil {
		return
	}
	wailsruntime.EventsEmit(a.ctx, "pty:exit", map[string]interface{}{
		"sessionId": sessionID,
		"reason":    reason,
	})
}

func (a *App) StartPTY(serverID, containerID string, cols, rows int) PTYStartResult {
	cfg, ok := a.findServer(serverID)
	if !ok {
		return PTYStartResult{Success: false, Error: "server_not_found"}
	}
	containerID = strings.TrimSpace(containerID)
	if containerID != "" && !validContainerID.MatchString(containerID) {
		return PTYStartResult{Success: false, Error: "invalid container id"}
	}
	if cols < 20 {
		cols = 80
	}
	if rows < 5 {
		rows = 24
	}

	sid := "pty-" + newID()

	// Interactive Demo Sandbox shell so users can test PTY & Docker Shell without a real VPS
	if cfg.IsDemo {
		ps := &ptySession{
			id:          sid,
			serverID:    serverID,
			serverName:  cfg.Name,
			username:    cfg.Username,
			containerID: containerID,
			isDemo:      true,
			demoCwd:     "~",
		}
		if containerID != "" {
			ps.demoCwd = "/"
		}
		a.ptyMu.Lock()
		a.ptySessions[sid] = ps
		a.ptyMu.Unlock()

		go func() {
			time.Sleep(80 * time.Millisecond)
			var banner string
			if containerID != "" {
				banner = fmt.Sprintf(
					"\x1b[36m[ZentraDeck Demo]\x1b[0m Attached to container \x1b[1;33m%s\x1b[0m on %s\r\n"+
						"Type \x1b[32mhelp\x1b[0m, \x1b[32mls\x1b[0m, \x1b[32mhtop\x1b[0m, \x1b[32mclear\x1b[0m, or \x1b[32mexit\x1b[0m.\r\n\r\n%s",
					containerID, cfg.Name, ps.demoPrompt(),
				)
			} else {
				banner = fmt.Sprintf(
					"\x1b[36m[ZentraDeck Demo PTY]\x1b[0m Connected to \x1b[1;32m%s@%s\x1b[0m (%s)\r\n"+
						"Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)\r\n"+
						"Try: \x1b[32mhelp\x1b[0m, \x1b[32mls\x1b[0m, \x1b[32mhtop\x1b[0m, \x1b[32mdocker ps\x1b[0m, \x1b[32mfree -h\x1b[0m, \x1b[32mclear\x1b[0m, \x1b[32mexit\x1b[0m\r\n\r\n%s",
					cfg.Username, cfg.Name, cfg.Host, ps.demoPrompt(),
				)
			}
			a.emitPTYData(sid, []byte(banner))
		}()

		return PTYStartResult{Success: true, SessionID: sid}
	}

	// Real SSH server PTY
	client, err := a.getClient(cfg)
	if err != nil {
		return PTYStartResult{Success: false, Error: err.Error()}
	}

	session, err := client.NewSession()
	if err != nil {
		// Stale SSH connection: drop cached client and retry once
		a.mu.Lock()
		if old, exists := a.clients[cfg.ID]; exists && old == client {
			_ = old.Close()
			delete(a.clients, cfg.ID)
		}
		a.mu.Unlock()

		client, err = a.getClient(cfg)
		if err != nil {
			return PTYStartResult{Success: false, Error: err.Error()}
		}
		session, err = client.NewSession()
		if err != nil {
			return PTYStartResult{Success: false, Error: err.Error()}
		}
	}

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}
	if err := session.RequestPty("xterm-256color", rows, cols, modes); err != nil {
		_ = session.Close()
		return PTYStartResult{Success: false, Error: fmt.Sprintf("request pty failed: %v", err)}
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		_ = session.Close()
		return PTYStartResult{Success: false, Error: err.Error()}
	}
	stdout, err := session.StdoutPipe()
	if err != nil {
		_ = session.Close()
		return PTYStartResult{Success: false, Error: err.Error()}
	}
	stderr, err := session.StderrPipe()
	if err != nil {
		_ = session.Close()
		return PTYStartResult{Success: false, Error: err.Error()}
	}

	if containerID != "" {
		cmd := fmt.Sprintf(
			"if docker info >/dev/null 2>&1; then D=docker; else D='sudo docker'; fi; $D exec -it %s sh -c 'if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi'",
			containerID,
		)
		if err := session.Start(cmd); err != nil {
			_ = session.Close()
			return PTYStartResult{Success: false, Error: fmt.Sprintf("docker exec failed: %v", err)}
		}
	} else {
		if err := session.Shell(); err != nil {
			_ = session.Close()
			return PTYStartResult{Success: false, Error: fmt.Sprintf("start shell failed: %v", err)}
		}
	}

	ps := &ptySession{
		id:          sid,
		serverID:    serverID,
		serverName:  cfg.Name,
		username:    cfg.Username,
		containerID: containerID,
		session:     session,
		stdin:       stdin,
	}

	a.ptyMu.Lock()
	a.ptySessions[sid] = ps
	a.ptyMu.Unlock()

	streamPipe := func(r io.Reader) {
		buf := make([]byte, 8192)
		for {
			n, rerr := r.Read(buf)
			if n > 0 {
				chunk := make([]byte, n)
				copy(chunk, buf[:n])
				a.emitPTYData(sid, chunk)
			}
			if rerr != nil {
				return
			}
		}
	}

	go streamPipe(stdout)
	go streamPipe(stderr)

	go func() {
		waitErr := session.Wait()
		a.ptyMu.Lock()
		delete(a.ptySessions, sid)
		a.ptyMu.Unlock()

		ps.mu.Lock()
		wasClosed := ps.closed
		ps.closed = true
		ps.mu.Unlock()

		if !wasClosed {
			reason := "Session closed"
			if waitErr != nil {
				reason = waitErr.Error()
			}
			a.emitPTYExit(sid, reason)
		}
	}()

	return PTYStartResult{Success: true, SessionID: sid}
}

func (a *App) WritePTY(sessionID, data string) error {
	a.ptyMu.Lock()
	ps, ok := a.ptySessions[sessionID]
	a.ptyMu.Unlock()
	if !ok || ps == nil {
		return fmt.Errorf("pty session not found")
	}
	if ps.isDemo {
		a.handleDemoPTYInput(ps, data)
		return nil
	}

	ps.mu.Lock()
	defer ps.mu.Unlock()
	if ps.closed || ps.stdin == nil {
		return fmt.Errorf("pty session closed")
	}
	_, err := ps.stdin.Write([]byte(data))
	return err
}

func (a *App) ResizePTY(sessionID string, cols, rows int) error {
	if cols < 10 || rows < 3 {
		return nil
	}
	a.ptyMu.Lock()
	ps, ok := a.ptySessions[sessionID]
	a.ptyMu.Unlock()
	if !ok || ps == nil || ps.isDemo {
		return nil
	}
	ps.mu.Lock()
	defer ps.mu.Unlock()
	if ps.closed || ps.session == nil {
		return nil
	}
	return ps.session.WindowChange(rows, cols)
}

func (a *App) ClosePTY(sessionID string) {
	a.ptyMu.Lock()
	ps, ok := a.ptySessions[sessionID]
	if ok {
		delete(a.ptySessions, sessionID)
	}
	a.ptyMu.Unlock()
	if !ok || ps == nil {
		return
	}
	ps.mu.Lock()
	ps.closed = true
	if ps.stdin != nil {
		_ = ps.stdin.Close()
	}
	if ps.session != nil {
		_ = ps.session.Close()
	}
	ps.mu.Unlock()
}

func (a *App) closeAllPTY() {
	a.ptyMu.Lock()
	list := make([]*ptySession, 0, len(a.ptySessions))
	for id, ps := range a.ptySessions {
		list = append(list, ps)
		delete(a.ptySessions, id)
	}
	a.ptyMu.Unlock()

	for _, ps := range list {
		ps.mu.Lock()
		ps.closed = true
		if ps.stdin != nil {
			_ = ps.stdin.Close()
		}
		if ps.session != nil {
			_ = ps.session.Close()
		}
		ps.mu.Unlock()
	}
}

func (ps *ptySession) demoPrompt() string {
	if ps.containerID != "" {
		short := ps.containerID
		if len(short) > 12 {
			short = short[:12]
		}
		return fmt.Sprintf("\x1b[1;35mroot@%s\x1b[0m:\x1b[1;34m%s\x1b[0m# ", short, ps.demoCwd)
	}
	return fmt.Sprintf("\x1b[1;32m%s@%s\x1b[0m:\x1b[1;34m%s\x1b[0m$ ", ps.username, ps.serverName, ps.demoCwd)
}

func (a *App) handleDemoPTYInput(ps *ptySession, data string) {
	ps.mu.Lock()
	defer ps.mu.Unlock()
	if ps.closed {
		return
	}

	for _, r := range data {
		switch r {
		case '\x03': // Ctrl+C
			ps.demoBuf = ""
			a.emitPTYData(ps.id, []byte("^C\r\n"+ps.demoPrompt()))
		case '\x0c': // Ctrl+L
			a.emitPTYData(ps.id, []byte("\x1b[2J\x1b[H"+ps.demoPrompt()+ps.demoBuf))
		case '\x7f', '\b': // Backspace
			if len(ps.demoBuf) > 0 {
				runes := []rune(ps.demoBuf)
				ps.demoBuf = string(runes[:len(runes)-1])
				a.emitPTYData(ps.id, []byte("\b \b"))
			}
		case '\r', '\n':
			cmd := strings.TrimSpace(ps.demoBuf)
			ps.demoBuf = ""
			a.emitPTYData(ps.id, []byte("\r\n"))

			if cmd == "exit" || cmd == "logout" {
				ps.closed = true
				a.emitPTYData(ps.id, []byte("logout\r\n"))
				go func(sid string) {
					a.ptyMu.Lock()
					delete(a.ptySessions, sid)
					a.ptyMu.Unlock()
					a.emitPTYExit(sid, "Exited")
				}(ps.id)
				return
			}

			out := runDemoPTYCommand(ps, cmd)
			if out != "" {
				a.emitPTYData(ps.id, []byte(out))
			}
			a.emitPTYData(ps.id, []byte(ps.demoPrompt()))
		default:
			if r >= 32 {
				ps.demoBuf += string(r)
				a.emitPTYData(ps.id, []byte(string(r)))
			}
		}
	}
}

func runDemoPTYCommand(ps *ptySession, cmd string) string {
	switch cmd {
	case "":
		return ""
	case "clear":
		return "\x1b[2J\x1b[H"
	case "help":
		return "\x1b[36mDemo PTY Commands:\x1b[0m ls, pwd, whoami, uname -a, uptime, free -h, df -h, docker ps, htop, clear, exit\r\n"
	case "pwd":
		if ps.containerID != "" {
			return "/\r\n"
		}
		return "/home/" + ps.username + "\r\n"
	case "whoami":
		if ps.containerID != "" {
			return "root\r\n"
		}
		return ps.username + "\r\n"
	case "ls", "ls -la", "ll":
		if ps.containerID != "" {
			return "\x1b[1;34mbin  etc  app  var  usr  tmp\x1b[0m  docker-entrypoint.sh\r\n"
		}
		return "\x1b[1;34mdocker-compose.yml  nginx  backups\x1b[0m  .env  deploy.sh\r\n"
	case "uname -a":
		return "Linux " + ps.serverName + " 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux\r\n"
	case "uptime":
		return " 14:22:08 up 42 days,  6:14,  1 user,  load average: 0.48, 0.52, 0.41\r\n"
	case "free -h":
		return "               total        used        free      shared  buff/cache   available\r\nMem:           7.8Gi       3.4Gi       2.1Gi       112Mi       2.3Gi       4.0Gi\r\nSwap:          2.0Gi       128Mi       1.9Gi\r\n"
	case "df -h":
		return "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/vda1        80G   31G   46G  41% /\r\ntmpfs           3.9G  1.2M  3.9G   1% /dev/shm\r\n"
	case "docker ps":
		return "CONTAINER ID   IMAGE              STATUS         NAMES\r\nc9a1f02e88b1   nginx:1.27-alpine  Up 14 days     nginx-proxy\r\n7d4e21a09c33   postgres:16        Up 14 days     postgres-main\r\n3b81aa9021ef   redis:7-alpine     Up 14 days     redis-cache\r\n"
	case "htop", "top":
		return "\x1b[1;36m  CPU[\x1b[32m||||||||||\x1b[0m                    34.2%]   Tasks: 118, 2 running\r\n" +
			"\x1b[1;36m  Mem[\x1b[33m||||||||||||||\x1b[0m            3.4G/7.8G]   Load: 0.48 0.52 0.41\r\n" +
			"\x1b[7m  PID USER      CPU%  MEM%  COMMAND                                \x1b[0m\r\n" +
			" 1420 www-data   8.4   2.1  nginx: worker process\r\n" +
			" 1892 postgres   6.2  14.8  postgres: main writer\r\n" +
			" 2104 root       3.1   4.5  dockerd -H fd://\r\n" +
			"\x1b[90m(Demo snapshot — connect a real Linux SSH server for full live htop/vim/nano)\x1b[0m\r\n"
	default:
		return fmt.Sprintf("demo-sh: executed '%s' (connect a real SSH server for full shell)\r\n", cmd)
	}
}
