package cnc

import "go2cnc/pkg/cnc/state"

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
	SendWait(msg string) ([]string, error) // SendWait sends a message to the CNC controller and waits for error/ok, and returns the resulting messages

	ClearProbeHistory() // ClearProbeHistory clears the probe history
	GetProbeHistory() []state.ProbeResult
	GetLastProbe() state.ProbeResult

	TestIngest()
	TestSender()

	ListFiles(path string) (string, error)
	GetFile(path string) (string, error)
	SendFile(path string) error
	RunFile(path string) error
}

type FileList struct {
	Files      []FileInfo `json:"files"`
	Path       string     `json:"path"`
	Total      string     `json:"total"`
	Used       string     `json:"used"`
	Occupation string     `json:"occupation"`
}

type FileInfo struct {
	Name string `json:"name"`
	Size string `json:"size"` // Note: size is a string in the JSON
}
