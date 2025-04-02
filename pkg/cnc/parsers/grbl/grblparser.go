package grbl

import (
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/logme"
	"regexp"
	"strconv"
	"strings"
)

const (
	CHANGE_NONE = iota
	CHANGE_STATUS
	CHANGE_PARSER_STATE
	CHANGE_PROBE_RESULT
	CHANGE_WORK_OFFSETS
)

func ParseGrblData(data string, g *state.State) (bool, int) {
	// logme.Trace("ParseGrblData() called with data:", data)
	section := CHANGE_NONE
	switch {
	case strings.HasPrefix(data, "<"):
		parseStatusReport(data, g)
		section = CHANGE_STATUS
	case strings.HasPrefix(data, "[GC:"):
		parseGCodeParserState(data, g)
		section = CHANGE_PARSER_STATE
	case strings.HasPrefix(data, "[PRB:"):
		parseProbeResult(data, g)
		section = CHANGE_PROBE_RESULT
	case strings.HasPrefix(data, "[G"):
		parseWorkOffsets(data, g)
		section = CHANGE_WORK_OFFSETS
	case strings.HasPrefix(data, "[TLO:"): // TLO should be the last item in wco list
		parseWorkOffsets(data, g)
		section = CHANGE_WORK_OFFSETS
	default:
		return false, 0

	}
	// TODO calc work position???
	g.UpdateWpos()

	return true, section
}

// parseProbeResult parses Grbl probe results ([PRB:...])
func parseProbeResult(data string, g *state.State) {
	re := regexp.MustCompile(`\[PRB:([-\d.]+),([-\d.]+),([-\d.]+):([01])\]`)
	matches := re.FindStringSubmatch(data)

	if len(matches) < 5 {
		logme.Println("Invalid Grbl probe result:", data)
		return
	}

	x, _ := strconv.ParseFloat(matches[1], 64)
	y, _ := strconv.ParseFloat(matches[2], 64)
	z, _ := strconv.ParseFloat(matches[3], 64)
	success := matches[4] == "1"

	probe := state.ProbeResult{X: x, Y: y, Z: z, Success: success}

	// Append to probe history
	// g.ProbeHistory = append(g.ProbeHistory, probe)
	g.AddProbeResult(probe)
	// g.emitProbeHitory()
}

// parseStatusReport parses Grbl's real-time status reports
func parseStatusReport(rawdata string, g *state.State) {
	// Remove `< >` brackets
	data := strings.Trim(rawdata, "<>")

	// Split the report into key-value pairs
	fields := strings.Split(data, "|")
	hasJob := false
	// Iterate through fields and update machine status
	for _, field := range fields {

		parts := strings.SplitN(field, ":", 2)
		key := parts[0]
		value := ""
		if len(parts) > 1 {
			value = parts[1]
		}

		switch key {
		// parse Running file SD:13.45,/sd/test.nc
		case "SD":
			hasJob = true
			parts := strings.Split(value, ",")
			if len(parts) == 2 {
				g.Job.Active = true
				g.Job.Progress, _ = strconv.ParseFloat(parts[0], 64)
				g.Job.Path = parts[1]
			}

		case "Idle", "Run", "Hold", "Jog", "Alarm", "Door", "Check", "Home":
			g.ActiveState = key

		case "MPos":
			// Machine Position
			mpos := strings.Split(value, ",")
			if len(mpos) == 3 {
				g.Mpos.X, _ = strconv.ParseFloat(mpos[0], 64)
				g.Mpos.Y, _ = strconv.ParseFloat(mpos[1], 64)
				g.Mpos.Z, _ = strconv.ParseFloat(mpos[2], 64)
			}

		case "WPos":
			// Work Position
			wpos := strings.Split(value, ",")
			if len(wpos) == 3 {
				g.Wpos.X, _ = strconv.ParseFloat(wpos[0], 64)
				g.Wpos.Y, _ = strconv.ParseFloat(wpos[1], 64)
				g.Wpos.Z, _ = strconv.ParseFloat(wpos[2], 64)
			}

		case "WCO": // tracking work offsets stored in Status.Wco[Status.ActiveWCS]

			// logme.Println("Satus includes WCO, triggering ForceUpdate()  ($G + $# + ?)")

			// Work state.Coordinate Offset
			// wco := strings.Split(value, ",")
			// if len(wco) == 3 {
			// 	wcoX, _ := strconv.ParseFloat(wco[0], 64)
			// 	wcoY, _ := strconv.ParseFloat(wco[1], 64)
			// 	wcoZ, _ := strconv.ParseFloat(wco[2], 64)

			// 	// Compute Work Position (WPos) if MPos is available
			// 	mposX, _ := strconv.ParseFloat(g.Mpos.X, 64)
			// 	mposY, _ := strconv.ParseFloat(g.Mpos.Y, 64)
			// 	mposZ, _ := strconv.ParseFloat(g.Mpos.Z, 64)

			// 	g.Wpos.X = strconv.FormatFloat(mposX-wcoX, 'f', 3, 64)
			// 	g.Wpos.Y = strconv.FormatFloat(mposY-wcoY, 'f', 3, 64)
			// 	g.Wpos.Z = strconv.FormatFloat(mposZ-wcoZ, 'f', 3, 64)
			// }

		case "FS":
			// Feedrate and Spindle Speed
			fs := strings.Split(value, ",")
			if len(fs) == 2 {
				g.Feedrate, _ = strconv.Atoi(fs[0])
				g.Tool.Speed, _ = strconv.Atoi(fs[1])
			}

		case "Ov":
			// Override values (Feedrate, Rapid, Spindle)
			ov := strings.Split(value, ",")
			g.Overrides = []int{}
			for _, val := range ov {
				num, _ := strconv.Atoi(val)
				g.Overrides = append(g.Overrides, num)
			}

		case "Buf", "Bf":
			// Buffer info (Planner buffer, RX buffer)
			buf := strings.Split(value, ",")
			if len(buf) == 2 {
				g.Buf.Planner, _ = strconv.Atoi(buf[0])
				g.Buf.Rx, _ = strconv.Atoi(buf[1])
			}

		case "Pn":
			// logme.Println("📡 Input Pin State:", value)

		default:
			logme.Println("Unknown Grbl status field:", key, " in ", rawdata)
		}
	}
	if !hasJob {
		g.Job.Active = false
		g.Job.Path = ""
		g.Job.Progress = 0.0
	}
}

// parseGCodeParserState parses Grbl's G-code parser state ($G)
func parseGCodeParserState(data string, g *state.State) {
	re := regexp.MustCompile(`\[GC:(.+)\]`)
	matches := re.FindStringSubmatch(data)

	if len(matches) < 2 {
		logme.Println("Invalid Grbl parser state:", data)
		return
	}

	tokens := strings.Fields(matches[1])

	for _, token := range tokens {
		switch {
		case strings.HasPrefix(token, "G"):
			// Store active work state.Coordinate system
			if token == "G54" || token == "G55" || token == "G56" || token == "G57" || token == "G58" || token == "G59" {
				g.WCS = token
				g.Modal.Wcs = token
			}
			g.Modal.Motion = token

		case strings.HasPrefix(token, "M"):
			g.Modal.Program = token
		case strings.HasPrefix(token, "T"):
			g.Tool.Number, _ = strconv.Atoi(strings.TrimPrefix(token, "T"))
		case strings.HasPrefix(token, "S"):
			g.Tool.Speed, _ = strconv.Atoi(strings.TrimPrefix(token, "S"))
		case strings.HasPrefix(token, "F"):
			g.Feedrate, _ = strconv.Atoi(strings.TrimPrefix(token, "F"))
		}
	}
}

// parseWorkOffsets parses Grbl's work state.Coordinate offsets ($#)
func parseWorkOffsets(data string, g *state.State) {
	// logme.Warning("parseWorkOffsets() called")
	// Updated regex to capture all state.Coordinate systems (G54-G59, G28, G30, G92, TLO)
	re := regexp.MustCompile(`\[(G[5-9][0-9]?|G28|G30|G92|TLO):([-\d.]+)(?:,([-\d.]+),([-\d.]+))?\]`)
	matches := re.FindAllStringSubmatch(data, -1)

	if len(matches) == 0 {
		logme.Println("Invalid Grbl offset data:", data)
		return
	}

	// Ensure Wco map is initialized
	if g.WCO == nil {
		g.WCO = make(map[string]state.Coordinate)
	}

	for _, match := range matches {
		if len(match) < 3 {
			continue
		}

		wcs := match[1] // state.Coordinate system name (G54, G28, etc.)
		x, _ := strconv.ParseFloat(match[2], 64)
		y, z := 0.0, 0.0

		if len(match) >= 5 {
			y, _ = strconv.ParseFloat(match[3], 64)
			z, _ = strconv.ParseFloat(match[4], 64)
		}

		// Store offsets in Status.Wco map
		g.WCO[wcs] = state.Coordinate{X: x, Y: y, Z: z}
		// logme.Printf("📡 Work state.Coordinate %s: X=%.3f, Y=%.3f, Z=%.3f\n", wcs, x, y, z)

		// Special handling for Tool Length Offset (TLO)
		if wcs == "TLO" {
			g.Tool.TLO = x
			// logme.Printf("📡 Tool Length Offset (TLO): %.3f\n", x)
		}
	}
}
