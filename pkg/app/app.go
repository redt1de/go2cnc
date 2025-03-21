package app

import (
	"context"
	"go2cnc/pkg/cnc"
	"go2cnc/pkg/cnc/controller"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var ConfigFile string

// App struct
type App struct {
	ctx           context.Context
	cncController controller.Controller
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {

	runtime.LogSetLogLevel(ctx, 3)
	logme.Info("Starting up CNC controller")
	a.ctx = ctx
	c, err := config.LoadYamlConfig(ConfigFile)
	if err != nil {
		log.Fatal(err)
	}

	a.cncController = cnc.InitController(&c.MachineCfg)
	a.cncController.SetEmitter(a.Emitter)

	err = a.cncController.Connect()
	if err != nil {
		logme.Error("Failed to connect to CNC:", err)
	}

}
