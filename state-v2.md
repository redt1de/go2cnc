{
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
    "wcs": "",
    "wco": {},
    "tool": {
        "number": 0,
        "speed": 0,
        "tlo": 0
    },
    "feed": 0,
    "ov": null,
    "units": "",
    "probeHistory": [],
    "buf": {
        "planner": 0,
        "rx": 0
    },
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
    }
}

(*state.State)(0xc0000fa000)({
 ActiveState: (string) "",
 Mpos: (state.Coordinate) {
  X: (float64) 0,
  Y: (float64) 0,
  Z: (float64) 0
 },
 Wpos: (state.Coordinate) {
  X: (float64) 0,
  Y: (float64) 0,
  Z: (float64) 0
 },
 WCS: (string) "",
 WCO: (map[string]state.Coordinate) {
 },
 Tool: (state.Tool) {
  Number: (int) 0,
  Speed: (int) 0,
  TLO: (float64) 0
 },
 Feedrate: (int) 0,
 Overrides: ([]int) <nil>,
 Units: (string) "",
 ProbeHistory: ([]state.ProbeResult) {
 },
 Buf: (struct { Planner int "json:\"planner\""; Rx int "json:\"rx\"" }) {
  Planner: (int) 0,
  Rx: (int) 0
 },
 Modal: (state.Modal) {
  Motion: (string) "",
  Wcs: (string) "",
  Plane: (string) "",
  Units: (string) "",
  Distance: (string) "",
  Feedrate: (string) "",
  Program: (string) "",
  Spindle: (string) "",
  Coolant: ([]string) <nil>
 }
})