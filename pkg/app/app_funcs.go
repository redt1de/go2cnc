package app

import (
	"encoding/json"
	"fmt"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"os"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Config() returns the UiCfg configuration
func (a *App) Config() *config.Config {
	return a.Cfg
}

// For dev, remove me
func (a *App) TestIngest() {
	// a.Cnc.TestIngest()
}

// For dev, remove me
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
	if a.internalCmd(msg) {
		return
	}
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
	if a.internalCmd(msg) {
		return []string{}, nil
	}
	runtime.EventsEmit(a.ctx, "consoleEvent", fmt.Sprintf("> %s", msg))
	return a.Cnc.SendWait(msg)
}

// //////////////////////////////////////////////////////////////////////////////

func (a *App) ImportProbeHistory() error {
	val, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import Probe JSON",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON Files",
				Pattern:     "*.json",
			},
		},
		DefaultDirectory:     a.Cfg.LocalFsPath,
		CanCreateDirectories: true,
	},
	)
	if err != nil {
		logme.Error("Error opening file dialog:", err)
		return err
	}
	logme.Debug("Importing probe history from: ", val)

	data, err := os.ReadFile(val)
	if err != nil {
		logme.Error("Error reading file:", err)
		return err
	}
	var probeResults []state.ProbeResult
	err = json.Unmarshal(data, &probeResults)
	if err != nil {
		logme.Error("Error unmarshalling JSON:", err)
	}

	a.Cnc.GetState().ProbeHistory = probeResults
	runtime.EventsEmit(a.ctx, "probeEvent", probeResults)
	return nil
}

func (a *App) ExportProbeHistory() error {
	//timestamp
	ts := time.Now().Format("2006-01-02_15-04-05")
	val, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title: "Export Probe JSON",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "JSON Files",
				Pattern:     "*.json",
			},
		},
		DefaultFilename:  fmt.Sprintf("probe_history_%s.json", ts),
		DefaultDirectory: a.Cfg.LocalFsPath,
	},
	)

	if err != nil {
		logme.Error("Error opening file dialog:", err)
		return err
	}

	logme.Debug("Exporting probe history to: ", val)
	data, err := json.MarshalIndent(a.Cnc.GetState().ProbeHistory, "", "  ")
	if err != nil {
		logme.Error("Error marshalling JSON:", err)
		return err
	}
	err = os.WriteFile(val, data, 0644)
	if err != nil {
		logme.Error("Error writing file:", err)
	}

	return err
}

// returns true if its an internal command
func (a *App) internalCmd(msg string) bool {
	msg = strings.TrimSpace(msg)
	switch msg {
	case "exit", "quit", "q":
		logme.Warning("User initiated exit via console")
		runtime.Quit(a.ctx)
		return true
	case "reload", "refresh", "r":
		logme.Warning("User initiated reload via console")
		runtime.WindowReloadApp(a.ctx)
	case "verbose", "debug", "vvv":
		runtime.LogSetLogLevel(a.ctx, logger.TRACE)
	}

	return false
}
