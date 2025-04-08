package fluidnc

import "go2cnc/pkg/cnc/controllers"

type StreamOptions struct {
	blah int
}

func (s *StreamOptions) Get() int {
	return 0
}

func (f *FluidNC) Stream(lines []string, options controllers.StreamOptions) error {
	return nil
}
