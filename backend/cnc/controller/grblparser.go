package controller

import (
	"log"
	"regexp"
	"strconv"
	"strings"
)

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
		case "Idle", "Run", "Hold", "Jog", "Alarm", "Door", "Check":
			// Active machine state
			g.Machine.Status.ActiveState = key

		case "MPos":
			// Machine Position
			mpos := strings.Split(value, ",")
			if len(mpos) == 3 {
				g.Machine.Status.Mpos.X = mpos[0]
				g.Machine.Status.Mpos.Y = mpos[1]
				g.Machine.Status.Mpos.Z = mpos[2]
			}

		case "WPos":
			// Work Position
			wpos := strings.Split(value, ",")
			if len(wpos) == 3 {
				g.Machine.Status.Wpos.X = wpos[0]
				g.Machine.Status.Wpos.Y = wpos[1]
				g.Machine.Status.Wpos.Z = wpos[2]
			}

		case "WCO":
			// Work Coordinate Offset
			wco := strings.Split(value, ",")
			if len(wco) == 3 {
				wcoX, _ := strconv.ParseFloat(wco[0], 64)
				wcoY, _ := strconv.ParseFloat(wco[1], 64)
				wcoZ, _ := strconv.ParseFloat(wco[2], 64)

				// Compute Work Position (WPos) if MPos is available
				mposX, _ := strconv.ParseFloat(g.Machine.Status.Mpos.X, 64)
				mposY, _ := strconv.ParseFloat(g.Machine.Status.Mpos.Y, 64)
				mposZ, _ := strconv.ParseFloat(g.Machine.Status.Mpos.Z, 64)

				g.Machine.Status.Wpos.X = strconv.FormatFloat(mposX-wcoX, 'f', 3, 64)
				g.Machine.Status.Wpos.Y = strconv.FormatFloat(mposY-wcoY, 'f', 3, 64)
				g.Machine.Status.Wpos.Z = strconv.FormatFloat(mposZ-wcoZ, 'f', 3, 64)
			}

		case "FS":
			// Feedrate and Spindle Speed
			fs := strings.Split(value, ",")
			if len(fs) == 2 {
				g.Machine.Status.Feedrate, _ = strconv.Atoi(fs[0])
				g.Machine.Tool.Speed, _ = strconv.Atoi(fs[1])
			}

		case "Ov":
			// Override values (Feedrate, Rapid, Spindle)
			ov := strings.Split(value, ",")
			g.Machine.Status.Ov = []int{}
			for _, val := range ov {
				num, _ := strconv.Atoi(val)
				g.Machine.Status.Ov = append(g.Machine.Status.Ov, num)
			}

		case "Buf":
			// Buffer info (Planner buffer, RX buffer)
			buf := strings.Split(value, ",")
			if len(buf) == 2 {
				g.Machine.Status.Buf.Planner, _ = strconv.Atoi(buf[0])
				g.Machine.Status.Buf.Rx, _ = strconv.Atoi(buf[1])
			}

		case "Pn":
			// Input Pin States
			// g.Machine.Status.ActiveState = key
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
			g.Machine.Modal.Motion = token
		case strings.HasPrefix(token, "M"):
			g.Machine.Modal.Program = token
		case strings.HasPrefix(token, "T"):
			g.Machine.Tool.Number, _ = strconv.Atoi(strings.TrimPrefix(token, "T"))
		case strings.HasPrefix(token, "S"):
			g.Machine.Tool.Speed, _ = strconv.Atoi(strings.TrimPrefix(token, "S"))
		case strings.HasPrefix(token, "F"):
			g.Machine.Status.Feedrate, _ = strconv.Atoi(strings.TrimPrefix(token, "F"))
		}
	}
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
}

// parseWorkOffsets parses Grbl's work coordinate offsets ($#)
func (g *GrblController) parseWorkOffsets(data string) {
	re := regexp.MustCompile(`\[(G[5-9][0-9]?):([-\d.]+),([-\d.]+),([-\d.]+)\]`)
	matches := re.FindStringSubmatch(data)

	if len(matches) < 5 {
		log.Println("❌ Invalid Grbl offset data:", data)
		return
	}

	wcs := matches[1] // G54, G55, etc.
	x, _ := strconv.ParseFloat(matches[2], 64)
	y, _ := strconv.ParseFloat(matches[3], 64)
	z, _ := strconv.ParseFloat(matches[4], 64)

	log.Printf("📡 Work Coordinate %s: X=%.3f, Y=%.3f, Z=%.3f\n", wcs, x, y, z)
}
