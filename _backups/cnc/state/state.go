package state

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
	return &State{
		WCO:          make(map[string]Coordinate),
		ProbeHistory: make([]ProbeResult, 0),
		Mpos:         Coordinate{},
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
