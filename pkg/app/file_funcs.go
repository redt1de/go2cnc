package app

import (
	"fmt"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/logme"
	"strings"
)

func (a *App) IsRemoteFS() bool {
	return a.Cnc.FileManager() != nil
}

func (a *App) IsUsbFS() bool {
	pth := a.UsbFs.(*USBFs).Path()
	return pth != ""
}

func (a *App) IsLocalFS() bool {
	return a.LocalFs != nil
}

func (a *App) IsMacroFS() bool {
	return a.LocalFs != nil
}

func (a *App) ListDrives() ([]string, error) {
	ret := []string{}
	if a.IsRemoteFS() {
		ret = append(ret, "REMOTE")
	}
	if a.IsUsbFS() {
		ret = append(ret, "USB")
	}
	if a.IsLocalFS() {
		ret = append(ret, "LOCAL")
	}
	logme.Trace("ListDrives -> ", ret)
	return ret, nil
}

func (a *App) ListFiles(drive, path string) (fileman.FileList, error) {
	if drive == "USB" && a.IsUsbFS() {
		return a.UsbFs.List(path)
	}
	if drive == "LOCAL" && a.IsLocalFS() {
		return a.LocalFs.List(path)
	}
	if drive == "MACROS" && a.IsMacroFS() {
		return a.MacroFs.List(path)
	}
	if drive == "REMOTE" && a.IsRemoteFS() {
		return a.Cnc.FileManager().List(path)
	}
	return fileman.FileList{}, fmt.Errorf("invalid location %s", drive)
}

func (a *App) GetFile(drive, path string) (string, error) {
	if drive == "USB" && a.IsUsbFS() {
		return a.UsbFs.Read(path)
	}
	if drive == "LOCAL" && a.IsLocalFS() {
		return a.LocalFs.Read(path)
	}
	if drive == "MACROS" && a.IsMacroFS() {
		return a.MacroFs.Read(path)
	}
	if drive == "REMOTE" && a.IsRemoteFS() {
		return a.Cnc.FileManager().Read(path)
	}
	return "", fmt.Errorf("invalid location %s", drive)
}

func (a *App) DelFile(drive, path string) error {
	if drive == "USB" && a.IsUsbFS() {
		return a.UsbFs.Delete(path)
	}
	if drive == "LOCAL" && a.IsLocalFS() {
		return a.LocalFs.Delete(path)
	}
	if drive == "MACROS" && a.IsMacroFS() {
		return a.MacroFs.Delete(path)
	}
	if drive == "REMOTE" && a.IsRemoteFS() {
		return a.Cnc.FileManager().Delete(path)
	}
	return fmt.Errorf("invalid location %s", drive)
}

func (a *App) PutFile(drive, path, content string) error {
	if drive == "USB" && a.IsUsbFS() {
		return a.UsbFs.Write(path, content)
	}
	if drive == "LOCAL" && a.IsLocalFS() {
		return a.LocalFs.Write(path, content)
	}
	if drive == "MACROS" && a.IsMacroFS() {
		return a.MacroFs.Write(path, content)
	}
	if drive == "REMOTE" && a.IsRemoteFS() {
		return a.Cnc.FileManager().Write(path, content)
	}
	return fmt.Errorf("invalid location %s", drive)
}

func (a *App) RunFile(drive, path string) error {

	// if fileman.RunFile; err == not implemented then fileman.GetFile > a.Cnc.Stream <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<, MAYBE
	if drive == "USB" && a.IsUsbFS() {
		raw, err := a.UsbFs.Read(path)
		if err != nil {
			return err
		}
		lines := strings.Split(raw, "\n")
		a.streamWrap(lines)
		return nil
	}

	if drive == "LOCAL" && a.IsLocalFS() {
		raw, err := a.LocalFs.Read(path)
		if err != nil {
			return err
		}
		lines := strings.Split(raw, "\n")
		a.streamWrap(lines)
		return nil
	}
	if drive == "MACROS" && a.IsMacroFS() {
		raw, err := a.MacroFs.Read(path)
		if err != nil {
			return err
		}
		lines := strings.Split(raw, "\n")
		a.streamWrap(lines)
		return nil
	}

	if drive == "REMOTE" && a.IsRemoteFS() {
		return a.Cnc.FileManager().RunFile(path)
	}

	return fmt.Errorf("invalid location %s", drive)
}

func (a *App) streamWrap(lines []string) {
	go func() {
		err := a.Cnc.Stream(lines)
		if err != nil {
			logme.Error("Streaming failed:", err)
		} else {
			logme.Success("Streaming completed successfully")
		}
	}()
}
