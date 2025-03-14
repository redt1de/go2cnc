package controller

import (
	"go2cnc/pkg/cnc/provider"
)

type FluidNCController struct {
	GrblController
}

func NewFluidNCController(provider provider.Provider) *FluidNCController {
	grblC := NewGrblController(provider)
	grblC.Machine = &Machine{
		Status: Status{},
		Modal:  Modal{},
	}

	fC := &FluidNCController{
		GrblController: *grblC,
	}
	fC.Provider.SetOnData(fC.onData)
	return fC
}

func (g *FluidNCController) onData(data string) {
	// log.Println("📥 FluidNC parsing:", data)
	g.GrblController.onData(data)
}
