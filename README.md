<div align="center">

<img src="build/appicon.png" width="108" alt="ZentraDeck Icon" />

# ZentraDeck

**Monitor and control all your Linux servers over plain SSH — lightweight Go + native WebView desktop app, zero server agents, no paywalls.**

[![Latest Release](https://img.shields.io/github/v/release/CyberRhythm/ZentraDeck?style=for-the-badge&color=06B6D4&label=Download)](https://github.com/CyberRhythm/ZentraDeck/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-34D399?style=for-the-badge)](LICENSE)
[![Go + Wails](https://img.shields.io/badge/Built_With-Go_%2B_Wails-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://wails.io)
[![Platforms](https://img.shields.io/badge/Windows_%7C_macOS_%7C_Linux-6366F1?style=for-the-badge)](https://github.com/CyberRhythm/ZentraDeck/releases)

[Why ZentraDeck](#why-zentradeck) • [How It Compares](#how-it-compares) • [Features](#features-in-detail) • [Security & Transparency](#security--transparency) • [Downloads](#downloads) • [Build from Source](#build-from-source)

</div>

---

<div align="center">

<img src="docs/screenshots/overview.png" width="820" alt="ZentraDeck Server Overview" />

<p align="center">
  <img src="docs/screenshots/fleet.png" width="49%" alt="ZentraDeck Fleet Overview" />
  <img src="docs/screenshots/terminal.png" width="49%" alt="ZentraDeck Live Streaming Terminal" />
</p>

</div>

---

## Why ZentraDeck?

Managing a handful of Linux VPS boxes shouldn't force you to pick between two extremes:

1. **Installing background monitoring agents** on small 512 MB / 1 GB cloud servers, opening extra firewall ports, and maintaining another Docker stack just to check why CPU spiked.
2. **Running heavy Electron SSH wrappers** that bundle an entire Chromium runtime and lock everyday features behind a monthly subscription.

**ZentraDeck** is a native desktop app written in **Go + Wails + React** that talks to your servers strictly over standard SSH. Point it at any Ubuntu, Debian, AlmaLinux, Rocky, CentOS, or AWS EC2 instance — you get live telemetry, Docker/Systemd controls, a sortable Task Manager, open-port inspection, and a live streaming terminal in seconds.

> **Honest footprint note:** The ZentraDeck Go backend process uses **~15 MB RAM**. Because Wails renders the UI using your operating system's native WebView (WebView2 on Windows, WebKit on macOS/Linux), OS-managed WebView renderer processes appear alongside it in Task Manager — still without bundling a separate Chromium engine per app.

No agent to install. No cloud account. No telemetry. **100% free and MIT-licensed.**

---

## How It Compares

Every tool has trade-offs. ZentraDeck is built for **fast, zero-agent live triage and everyday SSH operations** — not as a replacement for multi-month time-series databases or full interactive SFTP suites.

| Capability | **ZentraDeck** | Electron SSH Clients *(Termius, Tabby)* | Agent Dashboards *(Netdata, Grafana)* | Web Panels *(Cockpit)* |
| :--- | :---: | :---: | :---: | :---: |
| **Zero Server Agent / No Extra Ports** | ✅ Pure SSH | ✅ Pure SSH | ❌ Agent required | ❌ Daemon + Web Port |
| **Desktop Footprint** | **~15 MB Go core** + OS WebView | ~250–600 MB (bundled Chromium) | Browser + Server RAM | Browser + Server RAM |
| **Long-Term Historical Metrics & Alerting** | ❌ Live session only | ❌ | ✅ Weeks/months TSDB | ⚠️ Basic / PCP plugin |
| **Full Interactive PTY / SFTP / Team Sync** | ⚠️ Streaming cmd runner | ✅ Rich PTY, SFTP & sync | ❌ | ✅ Web terminal |
| **OS Keychain + Write-Only Local Vault** | ✅ Never exposed to UI | ⚠️ Often readable / cloud-synced | N/A | N/A |
| **Per-Server SOCKS5 Proxy** | ✅ Built-in (free) | ⚠️ Paid / plugin | ❌ | ❌ |
| **Simple & Pro UI Modes (Free)** | ✅ Free toggle | ❌ Paid tiers (Termius) | ❌ Complex setup | ⚠️ Fixed UI |
| **One-Click Privacy Mode** | ✅ Masks IPs & users | ❌ | ❌ | ❌ |
| **11 Languages (incl. Persian RTL) + `?` Help** | ✅ On every section | ❌ Mostly English | ❌ | ⚠️ Partial |
| **Built-In Live Demo Sandbox** | ✅ Try immediately | ❌ | ❌ | ❌ |

---

## Features in Detail

Listed from what matters most in day-to-day server operations:

### 1. Zero-Agent SSH + Native Per-Server SOCKS5 Proxy
Connect via **Password** or **SSH Private Key** (pick a `.pem`/`.key` file with your OS file dialog or paste the key directly, with optional passphrase support).
- **Per-Server SOCKS5 Proxy:** Need to reach servers behind a jump box, corporate firewall, or restricted network? Enable SOCKS5 (with optional auth) per server without changing your system proxy.
- **One-Click `~/.ssh/config` Importer:** Already have hosts configured in `~/.ssh/config`? Import them automatically — and if the default file doesn't exist, ZentraDeck opens a file picker so you can select any custom SSH config.
- **Built for High-Latency Connections:** Uses race-safe persistent SSH sessions with sequential polling (requests never pile up on slow links) and **2-strike outage debouncing** so a single high-ping spike won't spam false offline alerts.

### 2. OS Keychain Vault (`AES-256-GCM`), SSH Host Key Verification & Privacy Mode
Most desktop tools let anyone standing near your screen click *Edit Server* and read your saved password or private key. ZentraDeck takes local security seriously:
- **OS Keychain + AES-256-GCM Encryption:** Server credentials are encrypted locally with `AES-256-GCM`, and the 256-bit master key is stored in your **OS Keychain** (Windows Credential Manager, macOS Keychain, or Linux Secret Service — with automatic migration from legacy key files and a `0600` file fallback only on minimal Linux setups without a keyring daemon).
- **Strict Write-Only Secrets:** Once saved, passwords, SSH private keys, and proxy passwords are **never sent back to the frontend UI**. When editing a server, fields stay blank with a *Saved securely* badge — even opening DevTools cannot reveal stored secrets.
- **SSH Host Key Verification (`known_hosts` + TOFU):** Verifies every server against `~/.ssh/known_hosts` and ZentraDeck's own `known_hosts` store. New hosts are pinned on first connection (Trust On First Use); any subsequent key mismatch blocks the connection immediately with the received SHA-256 fingerprint to guard against MITM attacks.
- **One-Click Privacy Mode:** Taking a screenshot for GitHub, Discord, or a client? Toggle the eye icon in the header to instantly mask all IP addresses and usernames across the entire app.

### 3. Simple Mode & Pro Mode — Not a Paywall, Just Clarity
In ZentraDeck, **Pro** is free for everyone. It's a one-click UI toggle designed around how you want to work:
- **Simple Mode:** Clean, distraction-free view with Health Score (0–100), CPU/RAM/Disk/Network KPIs, live telemetry graph, top 5 process preview, plus Docker and Systemd controls.
- **Pro Mode:** Unlocks the full operator toolkit — **Live Streaming Terminal**, **Ports & Firewall Inspector**, **Task Manager Kill / Force Kill**, **Network I/O graphs**, **Load Average & Swap**, **Storage Partitions**, and **Safe Reboot** (with custom dark-glass confirmation dialogs).

### 4. Fleet Overview & Live Health Monitoring
Stop jumping between ten terminal tabs to check if your servers are alive:
- **Fleet Overview:** See every server side-by-side in one dashboard with online/offline status, latency, uptime, Docker count, firewall state, and aggregate CPU/RAM averages.
- **Automatic Health Score (0–100):** Flags high CPU, RAM pressure, low root disk space, and failed systemd units automatically, backed by a live Alerts drawer for outage and recovery events.

### 5. Live Streaming Terminal with Categorized Presets
Run any Linux command over SSH without opening PuTTY or a separate terminal:
- **Real-Time Line-by-Line Streaming:** Long-running commands like `sudo apt update` stream output live as it happens (with `DEBIAN_FRONTEND=noninteractive` pre-configured so package managers don't hang).
- **Working Stop Button & History:** Cancel stuck commands anytime with one click, and cycle through previous commands using `↑` / `↓` arrow keys.
- **5 Categorized Quick-Preset Groups:** One-click commands organized under **System**, **Memory & Disk**, **Network**, **Updates**, and **Logs** — alongside full manual command input.

### 6. Sortable Live Task Manager
Instead of guessing what's eating resources, ZentraDeck pulls **both top CPU and top RAM processes**, merges and deduplicates them, and lets you sort live by **CPU %**, **RAM %**, **PID**, or **Command**. In Pro Mode, gracefully terminate (`SIGTERM`) or force-kill (`SIGKILL`) runaway processes directly from the table (with PID 1 protected).

### 7. Built-In Docker & Systemd Control
- **Docker Manager:** Automatically detects if Docker is installed on the host. View running and stopped containers, images, and port mappings; **Start / Stop / Restart** containers and read live `docker logs` in a built-in log viewer.
- **Systemd Services:** Search and filter services (`All`, `Active`, `Failed`, `Inactive`), run **Start / Stop / Restart**, and inspect the latest `journalctl` output without memorizing flags.

### 8. Open Ports & Firewall Inspector
Inspect every active listening **TCP/UDP** port (`ss -tulnp`) along with its bound address and owning process, plus live **UFW / firewalld** status detection — essential for auditing exposed services on cloud VPS boxes.

### 9. Built for Global Teams — 11 Languages (with Persian RTL) & Contextual `?` Tooltips
Switch instantly between **English, فارسی (Persian with full RTL layout & offline-bundled Vazirmatn font), 中文 (Chinese), Português, Español, Deutsch, Français, 日本語 (Japanese), Русский (Russian), 한국어 (Korean), and Bahasa Indonesia**.
Every single section — from *Load Avg* and *Swap* to *Firewall* and *SOCKS5* — includes a subtle **`?` hover tooltip** explaining what that metric actually means in the user's chosen language.

### 10. Interactive Live Demo Sandbox
Not ready to connect a production server yet? Launch **Live Demo Sandbox** right from the sidebar to explore 3 simulated Linux nodes (`Web`, `Database`, `Edge Gateway`), test Docker/Systemd actions, stream terminal commands, and even click **Simulate Outage** to watch alerting in action.

---

## Security & Transparency

### Zero Data Collection Guarantee
- **No telemetry, no analytics, no tracking, and no crash reporters.**
- **No cloud sync or third-party servers** — your server list, credentials, and settings stay 100% on your own machine.
- **Zero outbound connections** except to the SSH servers (and optional SOCKS5 proxies) you explicitly configure. Even bundled fonts (`Vazirmatn`) are loaded locally with zero CDN requests.

### Vault & SSH Security Model
- **Encrypted Storage:** Server inventory is encrypted at rest (`servers.enc`) using `AES-256-GCM` with a random 256-bit key stored in your OS Keychain (`Windows Credential Manager` / `macOS Keychain` / `Linux Secret Service`).
- **Host Key Verification:** Uses `golang.org/x/crypto/ssh/knownhosts` across `~/.ssh/known_hosts` and ZentraDeck's `known_hosts` with TOFU pinning and strict mismatch rejection.

Every metric poll runs a single read-only shell block over your encrypted SSH session using standard Linux utilities:
- System & CPU: `hostname`, `/etc/os-release`, `uname -r`, `/proc/uptime`, `/proc/stat`, `nproc`, `/proc/loadavg`
- Memory, Disk & Network: `/proc/meminfo`, `df -kP`, `/proc/net/dev`
- Operations & Security: `ps`, `systemctl`, `ss -tulnp`, `ufw` / `firewall-cmd`, and `docker ps -a` (only if `docker` exists)

Active actions (`systemctl`, `docker`, `kill`, `reboot`, terminal commands) only run when you explicitly click them, and destructive operations always require confirmation.

---

## Downloads

Both **Installer** and **Portable** packages are built automatically via GitHub Actions on every release with `SHA-256` checksums:

| OS | Architectures | Installer | Portable |
| :--- | :--- | :--- | :--- |
| **Windows** | `64-bit (amd64)`, `ARM64` | `.exe` Setup (NSIS) | `.zip` Portable |
| **macOS** | `Universal` (Intel + Apple Silicon M1–M4) | `.dmg` Disk Image | `.zip` App Bundle |
| **Linux** | `amd64`, `arm64` | `.deb` (Ubuntu/Debian) | `.tar.gz` Binary |

👉 **[Download the latest release here](https://github.com/CyberRhythm/ZentraDeck/releases)**

### Note on Unsigned Binaries (Windows SmartScreen & macOS Gatekeeper)
ZentraDeck is an independent, free open-source project and binaries are currently **not code-signed** with a paid EV/Apple Developer certificate. Because of this, your OS may display a warning on first launch:

- **Windows (SmartScreen):** Click **More info** → **Run anyway**.
- **macOS (Gatekeeper):** Either open **System Settings → Privacy & Security → Open Anyway**, or clear the quarantine flag after moving the app to `/Applications`:
```bash
  xattr -cr /Applications/ZentraDeck.app
```
- **Prefer to verify or compile yourself?** Every release includes `checksums.txt` built publicly in GitHub Actions, and you can build from source in minutes below.

---

## Build from Source

### Prerequisites
- [Go 1.22+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

```bash
git clone https://github.com/CyberRhythm/ZentraDeck.git
cd ZentraDeck

# Run with hot reload
wails dev

# Build native production binary
wails build -clean
```

---

## Support & Contributing

ZentraDeck is built and maintained independently — free forever, with no ads or locked features.
- ⭐ **Star this repository** if ZentraDeck earns a spot in your toolkit.
- 🐛 **Issues & PRs** are always welcome — whether it's a bug fix, a new distro tweak, or an extra language translation.
- ❤️ Optional crypto support is available directly inside the app via **Support ZentraDeck**.

---

## License

Released under the [MIT License](LICENSE).