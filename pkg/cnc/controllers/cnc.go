package controllers

import (
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/cnc/state"
)

type Controller interface {
	Connect()
	IsConnected() bool

	GetState() *state.State
	OnMessage(handler func(msg string))
	OnConnection(handler func(iscon bool))
	OnUpdate(handler func(status *state.State))
	OnProbe(handler func(restul []state.ProbeResult))

	SendAsync(msg string)                  // SendAsync sends a message to the CNC controller and returns immediately
	SendAsyncRaw(msg []byte)               // SendAsyncRaw sends a raw message to the CNC controller and returns immediately
	SendWait(msg string) ([]string, error) // SendWait sends a message to the CNC controller, waits for error/ok, and returns the resulting messages

	FileManager() fileman.FileManager // FileManager returns the file manager for the controller

}
