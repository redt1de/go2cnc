package app

import (
	"encoding/json"
	"fmt"
	"go2cnc/pkg/cnc/controller"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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

func (a *App) ClearProbeHistory() {
	a.cncController.ClearProbeHistory()
}

func (a *App) Emitter(eventName string, optionalData ...interface{}) {
	// log.Println("📡 Emitting event:", eventName)
	runtime.EventsEmit(a.ctx, eventName, optionalData)
}

func (a *App) Test() string {
	// a.cncController.FakeDataTest()
	// b, err := json.MarshalIndent(a.cncController.GetProbeHistory(), "", "    ")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// fmt.Println(string(b))

	// a.cncController.().ProbeTest()
	casted := a.cncController.(*controller.FluidNCController)
	casted.ProbeTest()
	return "Hello frontend"
}
