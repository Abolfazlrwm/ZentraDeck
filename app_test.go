package main

import (
	"errors"
	"testing"

	"golang.org/x/crypto/ssh"
)

func TestIsExitError(t *testing.T) {
	// Waitmsg fields are unexported, so only a zero-value ExitError can be
	// constructed here; isExitError only inspects the error's type.
	exitErr := &ssh.ExitError{}
	if !isExitError(exitErr) {
		t.Fatalf("expected *ssh.ExitError to be recognized as a command exit status")
	}

	wrapped := errors.Join(errors.New("session: command failed"), exitErr)
	if !isExitError(wrapped) {
		t.Fatalf("expected wrapped *ssh.ExitError to be recognized as a command exit status")
	}

	for _, err := range []error{
		errors.New("connection reset by peer"),
		&ssh.ExitMissingError{},
	} {
		if isExitError(err) {
			t.Fatalf("expected %v not to be treated as a command exit status", err)
		}
	}
}
