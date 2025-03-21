package controller

import (
	"fmt"
	"go2cnc/pkg/cnc/provider"
	"log"
	"strings"
	"time"
)

type GrblController struct {
	Provider             provider.Provider
	Machine              *Machine
	Emitter              func(eventName string, optionalData ...interface{})
	statusRequestPending bool
	modalRequestPending  bool
	wcoRequestPending    bool
	polling              bool
	statusInterval       time.Duration
}

func NewGrblController(provider provider.Provider) *GrblController {
	g := &GrblController{
		Provider: provider,
		Emitter: func(ceventName string, optionalData ...interface{}) {
			log.Println("EmitConsole not set")
		},
	}
	g.Machine = &Machine{
		Status:       Status{},
		ProbeHistory: []ProbeResult{},
	}

	g.Provider.SetOnData(g.onData)
	g.Provider.SetOnConnection(g.onConnection)
	g.SetPolling(1000)
	return g
}

func (g *GrblController) SetPolling(millis int) {
	if millis > 1 {
		g.polling = true
		g.statusInterval = time.Duration(millis) * time.Millisecond
	} else {
		g.polling = false
	}

}

func (g *GrblController) startPolling() {
	go func() {
		for g.polling {
			g.ForceUpdate()
			time.Sleep(g.statusInterval)
		}
	}()
}

func (g *GrblController) SetEmitter(emitter func(eventName string, optionalData ...interface{})) {
	g.Emitter = emitter
}

// onData parses CNC machine responses
func (g *GrblController) onData(data string) {
	g.parseData(data)
}

func (g *GrblController) onConnection(isConnected bool) {
	// log.Println("🔗 Emitting connection event:", isConnected)
	// g.Emitter("connectionEvent", isConnected)
	g.emitConn()
	if isConnected {
		go func() {
			time.Sleep(3 * time.Second) // needs a delay to ensure mutex is released, and connection is stable
			g.ForceUpdate()
			g.startPolling()

		}()
	}

}

// Connect starts the connection to the CNC machine
func (g *GrblController) Connect() error {
	return g.Provider.Connect()
}

func (g *GrblController) Send(cmd string) error {
	g.shouldConsole(" > " + cmd)
	return g.Provider.Send(cmd)
}

func (g *GrblController) SendRaw(data []byte) error {
	g.shouldConsole(fmt.Sprintf(" > 0x%x", data))
	return g.Provider.SendRaw(data)
}

// GetStatus returns the current CNC machine status
func (g *GrblController) GetStatus() Status {
	g.Machine.Status.Wpos = g.GetWorkPosition()
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

// dont waste time on these
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

func (g *GrblController) shouldConsole(data string) {
	if data == "ok" {
		if g.modalRequestPending || g.statusRequestPending || g.wcoRequestPending {
			return
		}
	}

	if strings.Contains(data, "(SILENCE)") {
		return
	}

	g.emitConsole(data)
}

func (g *GrblController) emitConsole(data string) {
	g.Emitter("consoleEvent", data)
}
func (g *GrblController) emitStatus() {
	g.Emitter("statusEvent", g.GetStatus())
}

func (g *GrblController) emitConn() {
	g.Emitter("connectionEvent", g.Provider.IsConnected())
}

func (g *GrblController) emitProbeHitory() {
	g.Emitter("probeEvent", g.Machine.ProbeHistory)
}

// GetWorkPosition calculates the current work position by subtracting the active work coordinate offset (WCO)
// from the machine position (MPos). It returns the calculated work position as a Coordinate struct.
func (g *GrblController) GetWorkPosition() Coordinate {
	g.Machine.Status.Wpos = Coordinate{} // Reset work position
	mpos := g.Machine.Status.Mpos
	activeWCS := g.Machine.Status.ActiveWCS
	wco, exists := g.Machine.Status.Wco[activeWCS]
	if !exists {
		wco = Coordinate{} // Default to zero offset
	}

	// Calculate Work Position = Machine Position - Work Offset
	workPos := Coordinate{
		X: mpos.X - wco.X,
		Y: mpos.Y - wco.Y,
		Z: mpos.Z - wco.Z,
	}

	// Store and return calculated Work Position
	g.Machine.Status.Wpos = workPos

	return workPos
}

func (g *GrblController) ForceUpdate() {
	// log.Println("📐 Forceing Status Update...")

	g.requestModal()
	g.requestWCO()
	g.requestStatus()
}

func (g *GrblController) requestStatus() {
	if g.statusRequestPending {
		return
	}
	g.statusRequestPending = true
	g.Send("? (SILENCE)")
}

func (g *GrblController) requestModal() {
	if g.modalRequestPending {
		return
	}
	g.modalRequestPending = true
	g.Send("$G (SILENCE)")
}

func (g *GrblController) requestWCO() {
	if g.wcoRequestPending {
		return
	}
	g.wcoRequestPending = true
	g.Send("$# (SILENCE)")
}

func (g *GrblController) ClearProbeHistory() {
	g.Machine.ProbeHistory = []ProbeResult{}
	g.emitProbeHitory()
}

func (g *GrblController) GetProbeHistory() []ProbeResult {
	return g.Machine.ProbeHistory
}
