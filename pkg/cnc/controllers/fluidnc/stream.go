package fluidnc

type StreamConfig struct {
	Simple     bool `json:"simple" yaml:"simple"`
	RxBuffer   int  `json:"rx_buffer" yaml:"rx_buffer"`
	LineBuffer int  `json:"line_buffer" yaml:"line_buffer"`
}

func (f *FluidNC) Stream(lines []string) error {
	// f.cfg.Stream.Simple = true
	return nil
}
