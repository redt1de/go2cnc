package fluidnc

import (
	"errors"
	"go2cnc/pkg/logme"
	"strings"
	"time"
)

type StreamConfig struct {
	Simple     bool `json:"simple" yaml:"simple"`
	RxBuffer   int  `json:"rx_buffer" yaml:"rx_buffer"`
	LineBuffer int  `json:"line_buffer" yaml:"line_buffer"`
}

// Stream streams gcode lines to the controller using buffer-aware logic.
func (f *FluidNC) Stream(lines []string) error {
	if f.cfg == nil || f.cfg.Stream == nil {
		return errors.New("streaming configuration is not defined")
	}

	cfg := f.cfg.Stream
	lineBuffer := cfg.LineBuffer
	rxBuffer := cfg.RxBuffer

	if cfg.Simple || lineBuffer == 0 || rxBuffer == 0 {
		// fallback to simple blocking stream using SendWait
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, ";") {
				continue
			}
			logme.Debug("Stream: ", line)
			_, err := f.SendWait(line)
			if err != nil {
				return err
			}
		}
		return nil
	}

	// advanced planner-aware stream using SendAsync and state.Buf
	sent := 0
	// ack := 0
	for sent < len(lines) {
		// check if there's room in planner buffer
		used := f.state.Buf.Planner
		if used >= lineBuffer {
			time.Sleep(10 * time.Millisecond)
			continue
		}

		line := strings.TrimSpace(lines[sent])
		if line == "" || strings.HasPrefix(line, ";") {
			sent++
			continue
		}

		f.SendAsync(line)
		sent++
	}

	return nil
}
