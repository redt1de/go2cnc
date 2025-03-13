package main

import (
	"log"

	"github.com/redt1de/go2cnc/cnc"
	"github.com/redt1de/go2cnc/config"
	"github.com/redt1de/go2cnc/server"
)

func main() {
	// Load configurationd
	c, err := config.LoadYamlConfig("./config.yaml")
	if err != nil {
		log.Fatal(err)
	}

	// Initialize CNC controller
	cncController := cnc.InitController(&c.MachineCfg)

	// Start WebSocket Server with CNC controller
	wsServer := server.NewWebSocketServer(cncController)
	wsServer.Start(c.PendantCfg.ServerAddr)

}
