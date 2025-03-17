package controller

type Machine struct {
	Status Status `json:"status"`
	// Modal        Modal         `json:"modal"`
	// Tool         Tool          `json:"tool"`
	ProbeHistory []ProbeResult `json:"probeHistory"`
}

// Status is a CNCjs compatible status struct
type Status struct {
	ActiveState string `json:"activeState"`
	Mpos        struct {
		X string `json:"x"`
		Y string `json:"y"`
		Z string `json:"z"`
	} `json:"mpos"`
	Wpos struct {
		X string `json:"x"`
		Y string `json:"y"`
		Z string `json:"z"`
	} `json:"wpos"`
	Ov       []int `json:"ov"`
	SubState int   `json:"subState"`
	Wco      struct {
		X string `json:"x"`
		Y string `json:"y"`
		Z string `json:"z"`
	} `json:"wco"`
	Buf struct {
		Planner int `json:"planner"`
		Rx      int `json:"rx"`
	} `json:"buf"`
	Feedrate int   `json:"feedrate"`
	Spindle  int   `json:"spindle"`
	Modal    Modal `json:"modal"`
	Tool     Tool  `json:"tool"`
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

type Tool struct {
	Number int     `json:"number"` // current tool number i.e. M6T1
	Speed  int     `json:"speed"`  // S value
	TLO    float64 `json:"tlo"`    // Tool Length Offset
}

/*
	{
	    "status": {
	        "activeState": "Alarm",
	        "mpos": {
	            "x": "0.000",
	            "y": "0.000",
	            "z": "0.000"
	        },
	        "wpos": {
	            "x": "-2.000",
	            "y": "-2.000",
	            "z": "2.000"
	        },
	        "ov": [
	            100,
	            100,
	            100
	        ],
	        "subState": 0,
	        "wco": {
	            "x": "2.000",
	            "y": "2.000",
	            "z": "-2.000"
	        },
	        "buf": {
	            "planner": 15,
	            "rx": 128
	        },
	        "feedrate": 0,
	        "spindle": 0
	    },
	    "parserstate": {
	        "modal": {
	            "motion": "G0",
	            "wcs": "G54",
	            "plane": "G17",
	            "units": "G21",
	            "distance": "G90",
	            "feedrate": "G94",
	            "spindle": "M5",
	            "coolant": "M9"
	        },
	        "tool": "0",
	        "feedrate": "0",
	        "spindle": "0"
	    }
	}
*/

/*
modal: {
		motion: 'G0', // G0, G1, G2, G3, G38.2, G38.3, G38.4, G38.5, G80
		wcs: 'G54', // G54, G55, G56, G57, G58, G59
		plane: 'G17', // G17: xy-plane, G18: xz-plane, G19: yz-plane
		units: 'G21', // G20: Inches, G21: Millimeters
		distance: 'G90', // G90: Absolute, G91: Relative
		feedrate: 'G94', // G93: Inverse Time Mode, G94: Units Per Minutes
		program: 'M0', // M0, M1, M2, M30
		spindle: 'M3', // M3, M4, M5
		coolant: ['M7', 'M8'], // M7, M8, M9
	},
	tool: '0',
	feedrate: '2000',
	spindle: '20',
	}
*/
