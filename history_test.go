package main

import (
	"strings"
	"testing"
	"time"
)

func TestParseLastRebootTime(t *testing.T) {
	cases := []struct {
		name   string
		line   string
		want   string // formatted "2006-01-02 15:04" or empty when not parseable
		wantOK bool
	}{
		{
			name:   "standard last -x -F reboot line with end time",
			line:   "reboot   system boot  6.8.0-45-generic Tue Nov 24 03:12:04 2026 - Wed Nov 24 03:34:56 2026  (0+00:22)",
			want:   "2026-11-24 03:12",
			wantOK: true,
		},
		{
			name:   "still running entry",
			line:   "reboot   system boot  5.15.0-91-generic Sun Jan  5 09:17:33 2025   still running",
			want:   "2025-01-05 09:17",
			wantOK: true,
		},
		{
			name:   "crash entry (down)",
			line:   "reboot   system boot  6.1.0-18-amd64 Thu Mar  7 22:41:02 2026 - Thu Mar  7 22:59:10 2026  (00:18)",
			want:   "2026-03-07 22:41",
			wantOK: true,
		},
		{
			name:   "single digit day is accepted",
			line:   "reboot   system boot  6.8.0-49-generic Mon Feb 2 08:00:11 2026 - Mon Feb 2 09:00:11 2026  (01:00)",
			want:   "2026-02-02 08:00",
			wantOK: true,
		},
		{
			name:   "no date present",
			line:   "reboot   system boot  6.8.0-49-generic still running",
			want:   "",
			wantOK: false,
		},
		{
			name:   "wtmp begins message is ignored",
			line:   "wtmp begins Mon Nov  1 10:11:12 2026",
			want:   "2026-11-01 10:11",
			wantOK: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parseLastRebootTime(tc.line)
			if ok != tc.wantOK {
				t.Fatalf("parseLastRebootTime(%q) ok = %v, want %v", tc.line, ok, tc.wantOK)
			}
			if !tc.wantOK {
				return
			}
			if got.Format("2006-01-02 15:04") != tc.want {
				t.Fatalf("parseLastRebootTime(%q) = %s, want %s", tc.line, got.Format("2006-01-02 15:04"), tc.want)
			}
		})
	}
}

func TestParseIncidentsSectionsRebootTimestamps(t *testing.T) {
	sections := map[string]string{
		"REBOOTS": strings.Join([]string{
			"reboot   system boot  6.8.0-45-generic Tue Nov 24 03:12:04 2026 - Wed Nov 24 03:34:56 2026  (0+00:22)",
			"reboot   system boot  6.8.0-45-generic Sun Oct 12 18:00:01 2026 - Mon Oct 13 02:44:12 2026  (1+08:44)",
			"",
			"wtmp begins Sun Oct  5 14:22:01 2026",
		}, "\n"),
	}

	// Cutoff that keeps the November reboot but filters the October one.
	cutoff := time.Date(2026, 11, 10, 0, 0, 0, 0, time.UTC)
	incidents := parseIncidentsSections(sections, cutoff)

	if len(incidents) != 1 {
		t.Fatalf("expected 1 reboot incident after cutoff filtering, got %d", len(incidents))
	}
	if incidents[0].Category != "reboot" {
		t.Fatalf("expected reboot category, got %s", incidents[0].Category)
	}
	if incidents[0].Timestamp != "2026-11-24 03:12" {
		t.Fatalf("expected real boot timestamp 2026-11-24 03:12, got %s", incidents[0].Timestamp)
	}
}
