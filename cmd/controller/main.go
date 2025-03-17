package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"go2cnc/pkg/cnc/controller"
	"go2cnc/pkg/cnc/provider"
	"go2cnc/pkg/config"
)

var cncController controller.Controller

const yamlCfg = `
pendant_cfg:
  server_address: :8080
machine_cfg:
  controller_type: "grbl"
  socket_provider: "websocket"
  socket_address: "192.168.0.134"
  socket_port: 81
  baudrate: 115200
  serial_port: "/dev/ttyUSB1"
  auth: "TODO"
  `

func main() {
	withProvider()
	// withController()
}

func withController() {
	// Load configuration
	c, err := config.UnmarshalConfig(yamlCfg)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize CNC provider
	var cncProvider provider.Provider
	switch c.MachineCfg.SocketProvider {
	case "websocket":
		cncProvider = provider.NewWebSocketProvider(c.MachineCfg.SocketAddress, c.MachineCfg.SocketPort)
	case "serial":
		cncProvider = provider.NewSerialProvider(c.MachineCfg.SerialPort, c.MachineCfg.Baudrate)
	default:
		log.Fatal("❌ Unsupported provider:", c.MachineCfg.SocketProvider)
	}

	// Initialize CNC controller
	switch c.MachineCfg.ControllerType {
	case "grbl":
		cncController = controller.NewGrblController(cncProvider)
	case "fluidnc":
		cncController = controller.NewFluidNCController(cncProvider)
	default:
		log.Fatal("❌ Unsupported controller:", c.MachineCfg.ControllerType)
	}

	// Connect to CNC MachineCfg
	err = cncController.Connect()
	if err != nil {
		log.Fatal("❌ Failed to connect to CNC MachineCfg:", err)
	}

	///////
	// Start reading commands from the terminal
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("🚀 CNC Terminal Started. Type commands and press Enter.")

	for {
		fmt.Print("> ")
		scanner.Scan()
		command := strings.TrimSpace(scanner.Text())

		if command == "" {
			continue
		}

		// Handle exit
		if command == "exit" || command == "quit" {
			fmt.Println("👋 Exiting...")
			break
		}

		if command == "reset" {
			cncController.SendRaw([]byte{0x18})
			continue
		}

		// Send the command over WebSocket
		err := cncController.Send(command)
		if err != nil {
			log.Println("❌ Failed to send command:", err)
		}
	}

	// Close WebSocket connection
	cncController.Disconnect()

}

func withProvider() {
	// Load configuration
	// c, err := config.LoadYamlConfig("./config.yaml")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// Load configuration
	c, err := config.UnmarshalConfig(yamlCfg)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize CNC provider
	var cncProvider provider.Provider
	switch c.MachineCfg.SocketProvider {
	case "websocket":
		cncProvider = provider.NewWebSocketProvider(c.MachineCfg.SocketAddress, c.MachineCfg.SocketPort)
	case "serial":
		cncProvider = provider.NewSerialProvider(c.MachineCfg.SerialPort, c.MachineCfg.Baudrate)
	default:
		log.Fatal("❌ Unsupported provider:", c.MachineCfg.SocketProvider)
	}

	cncProvider.SetOnData(func(data string) {
		fmt.Println("📥 Received from CNC:", data)
	})

	// Connect to CNC MachineCfg
	err = cncProvider.Connect()
	if err != nil {
		log.Fatal("❌ Failed to connect to CNC MachineCfg:", err)
	}

	///////
	// Start reading commands from the terminal
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("🚀 CNC Terminal Started. Type commands and press Enter.")

	for {
		fmt.Print("> ")
		scanner.Scan()
		command := strings.TrimSpace(scanner.Text())

		if command == "" {
			continue
		}

		// Handle exit
		if command == "exit" || command == "quit" {
			fmt.Println("👋 Exiting...")
			break
		}

		if command == "reset" {
			cncProvider.SendRaw([]byte{0x18})
			continue
		}

		// Send the command over WebSocket
		err := cncProvider.Send(command)
		if err != nil {
			log.Println("❌ Failed to send command:", err)
		}
	}

	// Close WebSocket connection
	cncProvider.Disconnect()

}
