package controller

import (
	"go2cnc/pkg/cnc/provider"
	"time"
)

type FluidNCController struct {
	GrblController
}

func NewFluidNCController(provider provider.Provider) *FluidNCController {
	grblC := NewGrblController(provider)
	grblC.Machine = &Machine{
		Status: Status{},
	}

	fC := &FluidNCController{
		GrblController: *grblC,
	}
	fC.Provider.SetOnData(fC.onData)
	fC.Provider.SetOnConnection(fC.onConnection)
	fC.GrblController.SetPolling(-1)
	return fC
}

func (g *FluidNCController) onData(data string) {
	g.GrblController.onData(data)
}

func (g *FluidNCController) onConnection(isConnected bool) {
	g.emitConn()

	if isConnected {
		go func() {
			time.Sleep(3 * time.Second) // needs a delay to ensure mutex is released, and connection is stable
			g.Send("$#")
			g.Send("$Report/Interval=500")

		}()
	}

}

func (g *FluidNCController) ProbeTest() {
	g.parseData("[PRB:0.000,0.000,1.490:1]")
	g.parseData("[PRB:0.000,0.000,1.491:1]")
	g.parseData("[PRB:0.000,0.000,1.492:1]")
	g.parseData("[PRB:0.000,0.000,1.493:1]")
	g.parseData("[PRB:0.000,0.000,1.494:1]")
	g.parseData("[PRB:0.000,0.000,1.495:1]")
}
