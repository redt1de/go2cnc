package state

import (
	"fmt"
	"go2cnc/pkg/logme"
)

type State struct {
	ActiveState  string                `json:"activeState"`
	Mpos         Coordinate            `json:"mpos"`
	Wpos         Coordinate            `json:"wpos"`
	WCS          string                `json:"wcs"`
	WCO          map[string]Coordinate `json:"wco"`
	Tool         Tool                  `json:"tool"`
	Feedrate     int                   `json:"feed"`
	Overrides    []int                 `json:"ov"`
	Units        string                `json:"units"`
	ProbeHistory []ProbeResult         `json:"probeHistory"`
	Buf          struct {
		Planner int `json:"planner"`
		Rx      int `json:"rx"`
	} `json:"buf"`
	Job struct {
		Active   bool    `json:"active"`
		Path     string  `json:"path"`
		Progress float64 `json:"progress"`
	} `json:"job"`

	Modal Modal `json:"modal"`
}

type Modal struct {
	Motion   string   `json:"motion"`
	Wcs      string   `json:"wcs"`
	Plane    string   `json:"plane"`
	Units    string   `json:"units"`
	Distance string   `json:"distance"`
	Feedrate string   `json:"feedrate"`
	Program  string   `json:"program"`
	Spindle  string   `json:"spindle"`
	Coolant  []string `json:"coolant"`
}

type ProbeResult struct {
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	Z       float64 `json:"z"`
	Success bool    `json:"success"`
}

type Coordinate struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type Tool struct {
	Number int     `json:"number"` // current tool number i.e. M6T1
	Speed  int     `json:"speed"`  // S value
	TLO    float64 `json:"tlo"`    // Tool Length Offset
}

func NewState() *State {
	// logme.Error("remove the test probe history")
	return &State{
		WCO:          make(map[string]Coordinate),
		ProbeHistory: make([]ProbeResult, 0),
		// ProbeHistory: []ProbeResult{ // TODO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..remove this
		// 	{X: 1.01, Y: 1.02, Z: 1.03, Success: true},
		// 	{X: 2.01, Y: 2.02, Z: 2.03, Success: true},
		// 	{X: 3.01, Y: 3.02, Z: 3.03, Success: true},
		// },
		Mpos: Coordinate{},
	}
}

func (s *State) ClearProbeHistory() {
	s.ProbeHistory = make([]ProbeResult, 0)
}

// GetLastProbeResult
func (s *State) GetLastProbeResult() ProbeResult {
	if len(s.ProbeHistory) > 0 {
		return s.ProbeHistory[len(s.ProbeHistory)-1]
	}
	return ProbeResult{}
}

func (s *State) AddProbeResult(pr ProbeResult) {
	s.ProbeHistory = append(s.ProbeHistory, pr)
}

func (s *State) UpdateWpos() {
	if s.WCS == "" {
		logme.Warning("WCS not set, assuming G54")
		s.WCS = "G54" // Default to G54 if WCS is not set
		return
	}

	offset, ok := s.WCO[s.WCS]
	if !ok {
		// If WCS is not found in WCO, assume zero offset
		logme.Warning(fmt.Sprintf("WCO[%s] not found. Assuming 0,0,0", s.WCS))
		offset = Coordinate{}
	}

	s.Wpos.X = s.Mpos.X - offset.X
	s.Wpos.Y = s.Mpos.Y - offset.Y
	s.Wpos.Z = s.Mpos.Z - offset.Z
}
