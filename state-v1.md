{
    "status": {
        "activeState": "",
        "mpos": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "wpos": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "ov": null,
        "subState": 0,
        "activeWCS": "",
        "wco": null,
        "buf": {
            "planner": 0,
            "rx": 0
        },
        "feedrate": 0,
        "spindle": 0,
        "modal": {
            "motion": "",
            "wcs": "",
            "plane": "",
            "units": "",
            "distance": "",
            "feedrate": "",
            "program": "",
            "spindle": "",
            "coolant": null
        },
        "tool": {
            "number": 0,
            "speed": 0,
            "tlo": 0
        }
    },
    "probeHistory": null
}


(*controller.Machine)(0xc000128000)({
 Status: (controller.Status) {
  ActiveState: (string) "",
  Mpos: (controller.Coordinate) {
   X: (float64) 0,
   Y: (float64) 0,
   Z: (float64) 0
  },
  Wpos: (controller.Coordinate) {
   X: (float64) 0,
   Y: (float64) 0,
   Z: (float64) 0
  },
  Ov: ([]int) <nil>,
  SubState: (int) 0,
  ActiveWCS: (string) "",
  Wco: (map[string]controller.Coordinate) <nil>,
  Buf: (struct { Planner int "json:\"planner\""; Rx int "json:\"rx\"" }) {
   Planner: (int) 0,
   Rx: (int) 0
  },
  Feedrate: (int) 0,
  Spindle: (int) 0,
  Modal: (controller.Modal) {
   Motion: (string) "",
   Wcs: (string) "",
   Plane: (string) "",
   Units: (string) "",
   Distance: (string) "",
   Feedrate: (string) "",
   Program: (string) "",
   Spindle: (string) "",
   Coolant: ([]string) <nil>
  },
  Tool: (controller.Tool) {
   Number: (int) 0,
   Speed: (int) 0,
   TLO: (float64) 0
  }
 },
 ProbeHistory: ([]controller.ProbeResult) <nil>
})