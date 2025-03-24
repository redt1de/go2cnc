package app

import (
	"fmt"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/logme"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) TestFunc() {
	a.Cnc.TestFunc()
}

func (a *App) ClearProbeHistory() {
	a.Cnc.ClearProbeHistory()
}

func (a *App) GetProbeHistory() []state.ProbeResult {
	return a.Cnc.GetProbeHistory()
}

func (a *App) SendAsync(msg string) {
	a.Cnc.SendAsync(msg)
	runtime.EventsEmit(a.ctx, "consoleEvent", fmt.Sprintf("> %s", msg))

}

func (a *App) SendAsyncRaw(cmd interface{}) {
	var data []byte

	switch v := cmd.(type) {
	case int: // If it's an integer, convert it to a single-byte slice
		data = []byte{byte(v)}
	case float64: // Wails might send numbers as float64, so handle this case too
		data = []byte{byte(int(v))}
	case string: // If it's a string, convert it to bytes
		data = []byte(v)
	case []byte: // If it's already a []byte, use it directly
		data = v
	default:
		logme.Error("SendRaw: Unsupported command type:", cmd)
		return
	}

	// Send the correctly formatted byte slice
	a.Cnc.SendAsyncRaw(data)
	runtime.EventsEmit(a.ctx, "consoleEvent", fmt.Sprintf("> 0x%x", data))
}

func (a *App) SendWait(msg string) ([]string, error) {
	runtime.EventsEmit(a.ctx, "consoleEvent", fmt.Sprintf("> %s", msg))
	return a.Cnc.SendWait(msg)
}

// //////////////////////////////////////////////////////////////////////////////
