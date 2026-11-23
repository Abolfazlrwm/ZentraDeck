//go:build windows || linux

package main

import (
	"runtime"

	"fyne.io/systray"
)

func (a *App) startTray() {
	go func() {
		runtime.LockOSThread()
		defer runtime.UnlockOSThread()

		systray.Run(func() {
			if len(trayIconBytes) > 0 {
				systray.SetIcon(trayIconBytes)
			}
			systray.SetTooltip("ZentraDeck - Server Command Center")

			systray.SetOnTapped(func() { a.showMainWindow() })

			mStatus := systray.AddMenuItem("ZentraDeck: Monitoring", "Fleet status")
			mStatus.Disable()
			systray.AddSeparator()
			mShow := systray.AddMenuItem("Open ZentraDeck", "Show main window")
			mQuit := systray.AddMenuItem("Quit ZentraDeck", "Exit completely")

			a.trayMu.Lock()
			a.trayUpdateFn = func(summary string) {
				systray.SetTooltip(summary)
				mStatus.SetTitle(summary)
			}
			a.trayMu.Unlock()

			go func() {
				for {
					select {
					case <-mShow.ClickedCh:
						a.showMainWindow()
					case <-mQuit.ClickedCh:
						a.QuitApp()
						return
					case <-a.trayStopCh:
						return
					}
				}
			}()
		}, func() {})
	}()
}

func (a *App) stopTray() {
	a.trayStopOnce.Do(func() {
		close(a.trayStopCh)
		systray.Quit()
	})
}

func (a *App) updateTrayText(summary string) {
	a.trayMu.Lock()
	fn := a.trayUpdateFn
	a.trayMu.Unlock()
	if fn != nil {
		fn(summary)
	}
}
