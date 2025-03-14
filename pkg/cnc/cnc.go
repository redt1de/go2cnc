package cnc

import (
	"log"

	"go2cnc/pkg/cnc/controller"
	"go2cnc/pkg/cnc/provider"
)

type MachineCfg struct {
	Auth           string `json:"auth" yaml:"auth"`
	SocketProvider string `json:"socketProvider" yaml:"socket_provider"`
	SocketAddress  string `json:"socketAddress" yaml:"socket_address"`
	SocketPort     int    `json:"socketPort" yaml:"socket_port"`
	Baudrate       int    `json:"baudrate" yaml:"baudrate"`
	ControllerType string `json:"controllerType" yaml:"controller_type"`
	SerialPort     string `json:"serialPort" yaml:"serial_port"`
}

func InitController(m *MachineCfg) controller.Controller {
	// Initialize CNC provider
	var cncProvider provider.Provider
	switch m.SocketProvider {
	case "websocket":
		cncProvider = provider.NewWebSocketProvider(m.SocketAddress, m.SocketPort)
	case "serial":
		cncProvider = provider.NewSerialProvider(m.SerialPort, m.Baudrate)
	default:
		log.Fatal("❌ Unsupported provider:", m.SocketProvider)
	}

	// Initialize CNC controller
	var cncController controller.Controller
	switch m.ControllerType {
	case "grbl":
		cncController = controller.NewGrblController(cncProvider)
	case "fluidnc":
		cncController = controller.NewFluidNCController(cncProvider)
	default:
		log.Fatal("❌ Unsupported controller:", m.ControllerType)
	}

	return cncController
}
