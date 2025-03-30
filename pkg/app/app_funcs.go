package app

import (
	"fmt"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Config() returns the UiCfg configuration
func (a *App) Config() *config.UiCfg {
	return a.UiCfg
}

func (a *App) PutFile(name, content string) error {
	return a.Cnc.PutFile(name, content)
}

func (a *App) DelFile(delfile string) (string, error) {
	tmp := strings.Split(delfile, ",")
	if len(tmp) != 2 {
		logme.Error("RunFile: Invalid file arg format. Expected 'drive,path'")
		return "", fmt.Errorf("invalid drivepathcsv format")
	}
	drive := tmp[0]
	path := tmp[1]
	logme.Debug("DelFile -> delfile:", delfile)
	if drive == "USB" {
		// return delFileUSB(delfile)
		return "", fmt.Errorf("USB delete not implemented")
	}
	if drive == "MACROS" {
		// return delMacro(delfile)
		return "", fmt.Errorf("MACROS delete not implemented")
	}
	return a.Cnc.DelFile(path)
}

func (a *App) RunFile(drivepathcsv string) error {
	tmp := strings.Split(drivepathcsv, ",")
	if len(tmp) != 2 {
		logme.Error("RunFile: Invalid file arg format. Expected 'drive,path'")
		return fmt.Errorf("invalid drivepathcsv format")
	}
	drive := tmp[0]
	path := tmp[1]

	logme.Debug("RunFile -> drive: ", drive, " path:", path)
	if drive == "USB" {
		content, err := getFileUSB(path)
		if err != nil {
			logme.Error("RunFile: Error getting file from USB:", err)
			return err
		}
		fname := filepath.Base(path)
		n := filepath.Join("/", fname)
		err = a.Cnc.PutFile(n, content)
		if err != nil {
			logme.Error("RunFile: Error uploading file to CNC:", err)
			return err
		}
		path = n
	}
	return a.Cnc.RunFile(path)
}

func (a *App) ListFiles(drive, path string) (string, error) {
	logme.Debug("ListFiles -> drive: ", drive, " path:", path)
	if drive == "USB" {
		return listFilesUSB(path)
	}
	if drive == "MACROS" {
		return a.listMacros()
	}

	return a.Cnc.ListFiles(path)
}

func (a *App) SaveMacro(name, content string) error {
	return os.WriteFile(filepath.Join(a.UiCfg.MacroPath, name), []byte(content), 0644)
}

func (a *App) GetFile(drive, path string) (string, error) {
	logme.Debug("GetFile -> drive: ", drive, " path:", path)
	if drive == "USB" {
		return getFileUSB(path)
	}
	if drive == "MACROS" {
		return a.getMacro(path)
	}
	return a.Cnc.GetFile(path)
}

func (a *App) TestIngest() {
	a.Cnc.TestIngest()
}

func (a *App) TestSender() {
	a.Cnc.TestSender()
}

func (a *App) ClearProbeHistory() {
	a.Cnc.ClearProbeHistory()
}

func (a *App) GetProbeHistory() []state.ProbeResult {
	return a.Cnc.GetProbeHistory()
}

func (a *App) GetLastProbe() state.ProbeResult {
	return a.Cnc.GetLastProbe()
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
