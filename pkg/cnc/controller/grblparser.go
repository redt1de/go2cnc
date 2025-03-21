package controller

import (
	"log"
	"regexp"
	"strconv"
	"strings"
)

func (g *GrblController) parseData(data string) {
	if ignore(data) {
		return
	}
	// log.Println("🔍 recieved data:", data)

	switch {
	case strings.HasPrefix(data, "<"):
		if g.statusRequestPending {
			g.statusRequestPending = false
			data = data + " (SILENCE)"
		}
		g.parseStatusReport(data)
	case strings.HasPrefix(data, "[GC:"):
		if g.modalRequestPending {
			g.modalRequestPending = false
			data = data + " (SILENCE)"
		}
		g.parseGCodeParserState(data)
	case strings.HasPrefix(data, "[PRB:"):
		g.parseProbeResult(data)
	case strings.HasPrefix(data, "[G"):
		if g.wcoRequestPending {
			data = data + " (SILENCE)"
		}
		g.parseWorkOffsets(data)
	case strings.HasPrefix(data, "[TLO:"): // TLO should be the last item in wco list
		if g.wcoRequestPending {
			g.wcoRequestPending = false
			data = data + " (SILENCE)"
		}
		g.parseWorkOffsets(data)

	}

	g.shouldConsole(data)
	g.emitStatus()
}

// parseProbeResult parses Grbl probe results ([PRB:...])
func (g *GrblController) parseProbeResult(data string) {
	re := regexp.MustCompile(`\[PRB:([-\d.]+),([-\d.]+),([-\d.]+):([01])\]`)
	matches := re.FindStringSubmatch(data)

	if len(matches) < 5 {
		log.Println("❌ Invalid Grbl probe result:", data)
		return
	}

	x, _ := strconv.ParseFloat(matches[1], 64)
	y, _ := strconv.ParseFloat(matches[2], 64)
	z, _ := strconv.ParseFloat(matches[3], 64)
	success := matches[4] == "1"

	probe := ProbeResult{X: x, Y: y, Z: z, Success: success}

	// Append to probe history
	g.Machine.ProbeHistory = append(g.Machine.ProbeHistory, probe)
	g.emitProbeHitory()
}

// parseStatusReport parses Grbl's real-time status reports
func (g *GrblController) parseStatusReport(data string) {
	// Remove `< >` brackets
	data = strings.Trim(data, "<>")

	// Split the report into key-value pairs
	fields := strings.Split(data, "|")

	// Iterate through fields and update machine status
	for _, field := range fields {
		parts := strings.SplitN(field, ":", 2)
		key := parts[0]
		value := ""
		if len(parts) > 1 {
			value = parts[1]
		}

		switch key {
		case "Idle", "Run", "Hold", "Jog", "Alarm", "Door", "Check", "Home":
			g.Machine.Status.ActiveState = key

		case "MPos":
			// Machine Position
			mpos := strings.Split(value, ",")
			if len(mpos) == 3 {
				g.Machine.Status.Mpos.X, _ = strconv.ParseFloat(mpos[0], 64)
				g.Machine.Status.Mpos.Y, _ = strconv.ParseFloat(mpos[1], 64)
				g.Machine.Status.Mpos.Z, _ = strconv.ParseFloat(mpos[2], 64)
			}

		case "WPos":
			// Work Position
			wpos := strings.Split(value, ",")
			if len(wpos) == 3 {
				g.Machine.Status.Wpos.X, _ = strconv.ParseFloat(wpos[0], 64)
				g.Machine.Status.Wpos.Y, _ = strconv.ParseFloat(wpos[1], 64)
				g.Machine.Status.Wpos.Z, _ = strconv.ParseFloat(wpos[2], 64)
			}

		case "WCO": // tracking work offsets stored in Status.Wco[Status.ActiveWCS]

			// log.Println("⚠️ Satus includes WCO, triggering ForceUpdate()  ($G + $# + ?)")

			// Work Coordinate Offset
			// wco := strings.Split(value, ",")
			// if len(wco) == 3 {
			// 	wcoX, _ := strconv.ParseFloat(wco[0], 64)
			// 	wcoY, _ := strconv.ParseFloat(wco[1], 64)
			// 	wcoZ, _ := strconv.ParseFloat(wco[2], 64)

			// 	// Compute Work Position (WPos) if MPos is available
			// 	mposX, _ := strconv.ParseFloat(g.Machine.Status.Mpos.X, 64)
			// 	mposY, _ := strconv.ParseFloat(g.Machine.Status.Mpos.Y, 64)
			// 	mposZ, _ := strconv.ParseFloat(g.Machine.Status.Mpos.Z, 64)

			// 	g.Machine.Status.Wpos.X = strconv.FormatFloat(mposX-wcoX, 'f', 3, 64)
			// 	g.Machine.Status.Wpos.Y = strconv.FormatFloat(mposY-wcoY, 'f', 3, 64)
			// 	g.Machine.Status.Wpos.Z = strconv.FormatFloat(mposZ-wcoZ, 'f', 3, 64)
			// }

		case "FS":
			// Feedrate and Spindle Speed
			fs := strings.Split(value, ",")
			if len(fs) == 2 {
				g.Machine.Status.Feedrate, _ = strconv.Atoi(fs[0])
				g.Machine.Status.Tool.Speed, _ = strconv.Atoi(fs[1])
			}

		case "Ov":
			// Override values (Feedrate, Rapid, Spindle)
			ov := strings.Split(value, ",")
			g.Machine.Status.Ov = []int{}
			for _, val := range ov {
				num, _ := strconv.Atoi(val)
				g.Machine.Status.Ov = append(g.Machine.Status.Ov, num)
			}

		case "Buf", "Bf":
			// Buffer info (Planner buffer, RX buffer)
			buf := strings.Split(value, ",")
			if len(buf) == 2 {
				g.Machine.Status.Buf.Planner, _ = strconv.Atoi(buf[0])
				g.Machine.Status.Buf.Rx, _ = strconv.Atoi(buf[1])
			}

		case "Pn":
			log.Println("📡 Input Pin State:", value)

		default:
			log.Println("⚠️ Unknown Grbl status field:", key, "=", value)
		}
	}
}

// parseGCodeParserState parses Grbl's G-code parser state ($G)
func (g *GrblController) parseGCodeParserState(data string) {
	re := regexp.MustCompile(`\[GC:(.+)\]`)
	matches := re.FindStringSubmatch(data)

	if len(matches) < 2 {
		log.Println("❌ Invalid Grbl parser state:", data)
		return
	}

	tokens := strings.Fields(matches[1])

	for _, token := range tokens {
		switch {
		case strings.HasPrefix(token, "G"):
			// Store active work coordinate system
			if token == "G54" || token == "G55" || token == "G56" || token == "G57" || token == "G58" || token == "G59" {
				g.Machine.Status.ActiveWCS = token
				g.Machine.Status.Modal.Wcs = token
			}
			g.Machine.Status.Modal.Motion = token

		case strings.HasPrefix(token, "M"):
			g.Machine.Status.Modal.Program = token
		case strings.HasPrefix(token, "T"):
			g.Machine.Status.Tool.Number, _ = strconv.Atoi(strings.TrimPrefix(token, "T"))
		case strings.HasPrefix(token, "S"):
			g.Machine.Status.Tool.Speed, _ = strconv.Atoi(strings.TrimPrefix(token, "S"))
		case strings.HasPrefix(token, "F"):
			g.Machine.Status.Feedrate, _ = strconv.Atoi(strings.TrimPrefix(token, "F"))
		}
	}
}

// parseWorkOffsets parses Grbl's work coordinate offsets ($#)
func (g *GrblController) parseWorkOffsets(data string) {
	// Updated regex to capture all coordinate systems (G54-G59, G28, G30, G92, TLO)
	re := regexp.MustCompile(`\[(G[5-9][0-9]?|G28|G30|G92|TLO):([-\d.]+)(?:,([-\d.]+),([-\d.]+))?\]`)
	matches := re.FindAllStringSubmatch(data, -1)

	if len(matches) == 0 {
		log.Println("❌ Invalid Grbl offset data:", data)
		return
	}

	// Ensure Wco map is initialized
	if g.Machine.Status.Wco == nil {
		g.Machine.Status.Wco = make(map[string]Coordinate)
	}

	for _, match := range matches {
		if len(match) < 3 {
			continue
		}

		wcs := match[1] // Coordinate system name (G54, G28, etc.)
		x, _ := strconv.ParseFloat(match[2], 64)
		y, z := 0.0, 0.0

		if len(match) >= 5 {
			y, _ = strconv.ParseFloat(match[3], 64)
			z, _ = strconv.ParseFloat(match[4], 64)
		}

		// Store offsets in Status.Wco map
		g.Machine.Status.Wco[wcs] = Coordinate{X: x, Y: y, Z: z}
		// log.Printf("📡 Work Coordinate %s: X=%.3f, Y=%.3f, Z=%.3f\n", wcs, x, y, z)

		// Special handling for Tool Length Offset (TLO)
		if wcs == "TLO" {
			g.Machine.Status.Tool.TLO = x
			// log.Printf("📡 Tool Length Offset (TLO): %.3f\n", x)
		}
	}
}
