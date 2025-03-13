package controller

import (
	"github.com/redt1de/go2cnc/backend/cnc/provider"
	"log"
	"strings"
)

type GrblController struct {
	Provider    provider.Provider
	Machine     *Machine
	consoleChan chan string
}

func NewGrblController(provider provider.Provider) *GrblController {
	g := &GrblController{
		Provider:    provider,
		consoleChan: make(chan string, 250),
	}
	g.Machine = &Machine{
		Status: Status{},
		Modal:  Modal{},
	}
	g.Provider.SetOnData(g.onData)
	return g
}

// Console() returns a channel for receiving console messages
func (g *GrblController) Console() chan string {
	return g.consoleChan
}

// onData parses CNC machine responses
func (g *GrblController) onData(data string) {
	// log.Println("📥 Grbl parsing:", data)
	g.parseData(data)
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

	// ✅ Send raw console message to the channel
	select {
	case g.consoleChan <- data:
	default:
		log.Println("⚠️ Console channel full, dropping message:", data)
	}
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
