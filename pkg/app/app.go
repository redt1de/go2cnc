package app

import (
	"context"
	"go2cnc/pkg/cam"
	"go2cnc/pkg/cnc/controllers"
	"go2cnc/pkg/cnc/controllers/fluidnc"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var CurrentConfig *config.Config

// App struct
type App struct {
	ctx     context.Context
	Cnc     controllers.Controller
	Cfg     *config.Config
	UsbFs   fileman.FileManager // USBFs
	LocalFs fileman.FileManager // LocalFs
	MacroFs fileman.FileManager // MacroFs
	Webcam  *cam.StreamServer
	// MacroFs
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		UsbFs:   &USBFs{},
		LocalFs: nil,
		MacroFs: nil,
		Webcam:  nil,
	}
}

// 2025/04/05 19:59:24 ❌ [ERROR]  WebSocket connection failed:dial tcp: lookup fluidnc.local: no such host (websocket/websocket.go:39)

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	// runtime.LogSetLogLevel(ctx, 5)
	logme.Info("Starting up CNC controller")
	a.ctx = ctx

	a.Cfg = CurrentConfig
	a.LocalFs = NewLocalFs(a.Cfg.LocalFsPath)
	a.MacroFs = NewLocalFs(a.Cfg.MacroPath)

	///////////////////////////////////////////////////////////////
	a.Cnc = fluidnc.NewFluidNcController(a.Cfg.FluidNCConfig)
	a.Cnc.OnConnection(func(iscon bool) {
		runtime.EventsEmit(a.ctx, "connectionEvent", iscon)
		if iscon {
			logme.Success("Connected to FluidNC")
		} else {
			logme.Error("Fluidnc websocket connection failed...")
		}
	})

	a.Cnc.OnMessage(func(msg string) {
		runtime.EventsEmit(a.ctx, "consoleEvent", msg)
	})

	a.Cnc.OnUpdate(func(status *state.State) {
		runtime.EventsEmit(a.ctx, "statusEvent", status)
	})

	a.Cnc.OnProbe(func(result []state.ProbeResult) {
		// logme.Debug("emitting on probe")
		runtime.EventsEmit(a.ctx, "probeEvent", result)
	})

	go func() {
		time.Sleep(2 * time.Second)
		a.Cnc.Connect()
		// runtime.EventsEmit(a.ctx, "connectionEvent", a.Cnc.IsConnected())
	}()

	///////////////////////////////////////////////////////////////
}
