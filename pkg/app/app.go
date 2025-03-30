package app

import (
	"context"
	"go2cnc/pkg/cnc"
	"go2cnc/pkg/cnc/fluidnc"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var CurrentConfig *config.Config

// App struct
type App struct {
	ctx context.Context
	Cnc cnc.Controller
	// UiCfg *config.UiCfg
	Cfg *config.Config
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	// runtime.LogSetLogLevel(ctx, 5)
	logme.Info("Starting up CNC controller")
	a.ctx = ctx

	a.Cfg = CurrentConfig

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

	// a.Cnc.Connect()

	go func() {
		time.Sleep(2 * time.Second)
		a.Cnc.Connect()
		// runtime.EventsEmit(a.ctx, "connectionEvent", a.Cnc.IsConnected())
	}()

	///////////////////////////////////////////////////////////////
}
