//go:build darwin

package main

func (a *App) startTray() {}

func (a *App) stopTray() {
a.trayStopOnce.Do(func() {
close(a.trayStopCh)
})
}

func (a *App) updateTrayText(summary string) {}