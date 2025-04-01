package app

import (
	"errors"
	"fmt"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Config() returns the UiCfg configuration
func (a *App) Config() *config.Config {
	return a.Cfg
}

func (a *App) PutFile(name, content string) error {
	// logme.Debug(fmt.Sprintf("app.PutFile( %s , len(%d) )", name, len(content)))
	// err := a.Cnc.PutFile(name, content)
	// if err != nil {
	// 	logme.Error("app.PutFile: Error uploading file to CNC:", err)
	// }
	// return err
	return errors.New("putfile not implemented yet")
}

func (a *App) DelFile(delfile string) (string, error) {
	// tmp := strings.Split(delfile, ",")
	// if len(tmp) != 2 {
	// 	logme.Error("RunFile: Invalid file arg format. Expected 'drive,path'")
	// 	return "", fmt.Errorf("invalid drivepathcsv format")
	// }
	// drive := tmp[0]
	// path := tmp[1]

	// logme.Debug(fmt.Sprintf("app.DelFile(%s) -> drive: %s, path: %s", delfile, drive, path))

	// if drive == "USB" {
	// 	// return delFileUSB(delfile)
	// 	return "", fmt.Errorf("USB delete not implemented")
	// }
	// if drive == "MACROS" {
	// 	// return delMacro(delfile)
	// 	return "", fmt.Errorf("MACROS delete not implemented")
	// }
	// r, err := a.Cnc.DelFile(path)
	// if err != nil {
	// 	logme.Error("app.DelFile:", err)
	// 	return "", err
	// }
	// return r, err
	return "", fmt.Errorf("delFile not implemented yet")
}

func (a *App) RunFile(drivepathcsv string) error {
	// tmp := strings.Split(drivepathcsv, ",")
	// if len(tmp) != 2 {
	// 	logme.Error("RunFile: Invalid file arg format. Expected 'drive,path'")
	// 	return fmt.Errorf("invalid drivepathcsv format")
	// }
	// drive := tmp[0]
	// path := tmp[1]

	// logme.Debug(fmt.Sprintf("app.RunFile(%s) -> drive: %s, path: %s", drivepathcsv, drive, path))

	// if drive == "USB" {
	// 	content, err := getFileUSB(path)
	// 	if err != nil {
	// 		logme.Error("app.RunFile: Error getting file from USB:", err)
	// 		return err
	// 	}
	// 	fname := filepath.Base(path)
	// 	n := filepath.Join("/", fname)
	// 	err = a.Cnc.PutFile(n, content)
	// 	if err != nil {
	// 		logme.Error("app.RunFile: Error uploading file to CNC:", err)
	// 		return err
	// 	}
	// 	path = n
	// }

	// err := a.Cnc.RunFile(path)
	// if err != nil {
	// 	logme.Error("app.RunFile:", err)
	// }
	// return err
	return fmt.Errorf("RunFile not implemented yet")
}

func (a *App) ListFiles(drive, path string) (string, error) {
	// logme.Debug(fmt.Sprintf("app.ListFiles(%s , %s)", drive, path))
	// if drive == "USB" {
	// 	ret, err := listFilesUSB(path)
	// 	if err != nil {
	// 		logme.Error("app.ListFiles:", err)
	// 	}
	// 	return ret, err
	// }
	// if drive == "MACROS" {
	// 	ret, err := a.listMacros()
	// 	if err != nil {
	// 		logme.Error("app.ListFiles:", err)
	// 	}
	// 	return ret, err
	// }

	// ret, err := a.Cnc.ListFiles(path)
	// if err != nil {
	// 	logme.Error("app.ListFiles:", err)
	// }
	// return ret, err
	return "", fmt.Errorf("ListFiles not implemented yet")
}

func (a *App) SaveMacro(name, content string) error {
	// logme.Debug(fmt.Sprintf("app.SaveMacro( %s , len(%d) )", name, len(content)))
	// err := os.WriteFile(filepath.Join(a.Cfg.MacroPath, name), []byte(content), 0644)
	// if err != nil {
	// 	logme.Error("app.SaveMacro: Error saving macro:", err)

	// }
	// return err
	return fmt.Errorf("SaveMacro not implemented yet")
}

func (a *App) GetFile(drive, path string) (string, error) {
	// logme.Debug(fmt.Sprintf("app.GetFile(%s , %s )", drive, path))
	// if drive == "USB" {
	// 	ret, err := getFileUSB(path)
	// 	if err != nil {
	// 		logme.Error("app.GetFile:", err)
	// 	}
	// 	return ret, err
	// }
	// if drive == "MACROS" {
	// 	ret, err := a.getMacro(path)
	// 	if err != nil {
	// 		logme.Error("app.GetFile:", err)
	// 	}
	// 	return ret, err
	// }
	// ret, err := a.Cnc.GetFile(path)
	// if err != nil {
	// 	logme.Error("app.GetFile:", err)
	// }
	// return ret, err
	return "", fmt.Errorf("GetFile not implemented yet")
}

func (a *App) TestIngest() {
	// a.Cnc.TestIngest()
}

func (a *App) TestSender() {
	// a.Cnc.TestSender()
}

func (a *App) ClearProbeHistory() {
	a.Cnc.GetState().ClearProbeHistory()
}

func (a *App) GetProbeHistory() []state.ProbeResult {
	return a.Cnc.GetState().ProbeHistory
}

func (a *App) GetLastProbe() state.ProbeResult {
	return a.Cnc.GetState().GetLastProbeResult()
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
