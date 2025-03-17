package main

import (
	"context"
	"encoding/json"
	"fmt"
	"go2cnc/pkg/cnc"
	"go2cnc/pkg/cnc/controller"
	"go2cnc/pkg/config"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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
func (a *App) startup(ctx context.Context) {

	runtime.LogSetLogLevel(ctx, 3)
	runtime.LogInfo(ctx, "Starting up CNC controller")
	a.ctx = ctx
	c, err := config.LoadYamlConfig("./config.yaml")
	if err != nil {
		log.Fatal(err)
	}

	a.cncController = cnc.InitController(&c.MachineCfg)
	a.cncController.SetEmitter(a.Emitter)

	err = a.cncController.Connect()
	if err != nil {
		log.Fatal("❌ Failed to connect to CNC MachineCfg:", err)
	}

}

func (a *App) Send(cmd string) {

	if cmd == "dump" {
		b, err := json.MarshalIndent(a.cncController.GetStatus(), "", "    ")
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(string(b))

		return
	}

	a.cncController.Send(cmd)
}

func (a *App) SendRaw(cmd interface{}) {
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
		log.Println("❌ SendRaw: Unsupported command type:", cmd)
		return
	}

	// Send the correctly formatted byte slice
	a.cncController.SendRaw(data)
}

func (a *App) Emitter(eventName string, optionalData ...interface{}) {
	log.Println("📡 Emitting event:", eventName)
	runtime.EventsEmit(a.ctx, eventName, optionalData)
}
