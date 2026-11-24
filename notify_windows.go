//go:build windows

package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"unicode/utf16"

	"golang.org/x/sys/windows/registry"
)

const windowsAppID = "CyberRhythm.ZentraDeck"

var regAppIDOnce sync.Once

func ensureWindowsAppID(iconPath string) {
	regAppIDOnce.Do(func() {
		keyPath := `Software\Classes\AppUserModelId\` + windowsAppID
		k, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath, registry.SET_VALUE)
		if err != nil {
			return
		}
		defer k.Close()
		_ = k.SetStringValue("DisplayName", "ZentraDeck")
		_ = k.SetStringValue("IconBackgroundColor", "FF090D16")
		_ = k.SetDWordValue("ShowInSettings", 1)
		if iconPath != "" {
			_ = k.SetStringValue("IconUri", filepath.Clean(iconPath))
		}
	})
}

func escapeXMLText(s string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&apos;",
	)
	return r.Replace(s)
}

func encodePSUTF16LE(script string) string {
	u16 := utf16.Encode([]rune(script))
	b := make([]byte, len(u16)*2)
	for i, v := range u16 {
		b[i*2] = byte(v)
		b[i*2+1] = byte(v >> 8)
	}
	return base64.StdEncoding.EncodeToString(b)
}

func resolvePowerShellPath() string {
	if root := os.Getenv("SystemRoot"); root != "" {
		candidate := filepath.Join(root, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return "powershell.exe"
}

func platformNotify(title, body, iconPath string) error {
	ensureWindowsAppID(iconPath)

	imgTag := ""
	if iconPath != "" {
		imgTag = fmt.Sprintf(`<image placement="appLogoOverride" src="%s"/>`, escapeXMLText(filepath.Clean(iconPath)))
	}

	toastXML := fmt.Sprintf(
		`<toast duration="short"><visual><binding template="ToastGeneric">%s<text>%s</text><text>%s</text></binding></visual><audio src="ms-winsoundevent:Notification.Default"/></toast>`,
		imgTag,
		escapeXMLText(title),
		escapeXMLText(body),
	)

	xmlB64 := base64.StdEncoding.EncodeToString([]byte(toastXML))
	psScript := fmt.Sprintf(
		"$ErrorActionPreference = 'Stop'\n"+
			"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null\n"+
			"[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null\n"+
			"$xmlStr = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('%s'))\n"+
			"$xml = New-Object Windows.Data.Xml.Dom.XmlDocument\n"+
			"$xml.LoadXml($xmlStr)\n"+
			"$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)\n"+
			"[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('%s').Show($toast)\n",
		xmlB64,
		windowsAppID,
	)

	cmd := exec.Command(
		resolvePowerShellPath(),
		"-NoProfile",
		"-NonInteractive",
		"-ExecutionPolicy", "Bypass",
		"-WindowStyle", "Hidden",
		"-EncodedCommand", encodePSUTF16LE(psScript),
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	out, err := cmd.CombinedOutput()
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if msg != "" {
			return fmt.Errorf("%v: %s", err, msg)
		}
		return err
	}
	return nil
}
