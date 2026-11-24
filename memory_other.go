//go:build !windows

package main

import (
	"runtime"
	"runtime/debug"
	"sync"
	"time"
)

var (
	trimMu   sync.Mutex
	lastTrim time.Time
)

func initMemoryProfile() {
	debug.SetGCPercent(25)
	debug.SetMemoryLimit(14 << 20)
	go func() {
		time.Sleep(4 * time.Second)
		trimProcessMemory()
	}()
}

func trimProcessMemory() {
	trimMu.Lock()
	if time.Since(lastTrim) < 2*time.Second {
		trimMu.Unlock()
		return
	}
	lastTrim = time.Now()
	trimMu.Unlock()

	runtime.GC()
	debug.FreeOSMemory()
}
