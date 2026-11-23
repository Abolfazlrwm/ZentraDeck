//go:build !windows

package main

import "github.com/gen2brain/beeep"

func platformNotify(title, body, iconPath string) error {
	beeep.AppName = "ZentraDeck"
	if err := beeep.Alert(title, body, iconPath); err != nil {
		if iconPath != "" {
			return beeep.Alert(title, body, "")
		}
		return err
	}
	return nil
}
