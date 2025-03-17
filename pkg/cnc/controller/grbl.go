package controller

import (
	"go2cnc/pkg/cnc/provider"
	"log"
	"strings"
)

type GrblController struct {
	Provider provider.Provider
	Machine  *Machine
	Emitter  func(eventName string, optionalData ...interface{})
}

func NewGrblController(provider provider.Provider) *GrblController {
	g := &GrblController{
		Provider: provider,
		Emitter: func(ceventName string, optionalData ...interface{}) {
			log.Println("EmitConsole not set")
		},
	}
	g.Machine = &Machine{
		Status: Status{},
		// Modal:  Modal{},
	}
	g.Provider.SetOnData(g.onData)
	g.Provider.SetOnConnection(g.onConnection)
	return g
}

func (g *GrblController) SetEmitter(emitter func(eventName string, optionalData ...interface{})) {
	g.Emitter = emitter
}

// onData parses CNC machine responses
func (g *GrblController) onData(data string) {
	g.parseData(data)
}

func (g *GrblController) onConnection(isConnected bool) {
	log.Println("🔗 Emitting connection event:", isConnected)
	g.Emitter("connectionEvent", isConnected)
}

// Connect starts the connection to the CNC machine
func (g *GrblController) Connect() error {
	return g.Provider.Connect()
}

func (g *GrblController) Send(cmd string) error {
	// log.Println("📤 Sending command:", cmd)
	return g.Provider.Send(cmd)
}

func (g *GrblController) SendRaw(data []byte) error {
	// log.Println("📤 Sending Raw:", data)
	return g.Provider.SendRaw(data)
}

// GetStatus returns the current CNC machine status
func (g *GrblController) GetStatus() Status {
	return g.Machine.Status
}

// disconnect
func (g *GrblController) Disconnect() {
	g.Provider.Disconnect()
}

// IsConnected returns the connection status
func (g *GrblController) IsConnected() bool {
	return g.Provider.IsConnected()
}

func (g *GrblController) parseData(data string) {
	if ignore(data) {
		return
	}
	// log.Println("🔍 recieved data:", data)

	switch {
	case strings.HasPrefix(data, "<"):
		g.parseStatusReport(data)
	case strings.HasPrefix(data, "[GC:"):
		g.parseGCodeParserState(data)
	case strings.HasPrefix(data, "[PRB:"):
		g.parseProbeResult(data)
	case strings.HasPrefix(data, "[G"):
		g.parseWorkOffsets(data)
	}

	g.emitConsole(data)
	g.emitStatus()

}

var ignoreFilters = []string{
	"PING:",
	"ACTIVE_ID:",
	"CURRENT_ID",
}

func ignore(data string) bool {
	for _, filter := range ignoreFilters {
		if strings.HasPrefix(data, filter) {
			return true
		}
	}
	return false

}

func (g *GrblController) emitConsole(data string) {
	g.Emitter("consoleEvent", data)
}
func (g *GrblController) emitStatus() {
	g.Emitter("statusEvent", g.Machine.Status)
}
func (g *GrblController) emitConn() {
	g.Emitter("connectionEvent", g.Provider.IsConnected())
}
