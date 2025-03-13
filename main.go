package main

import (
	"log"

	"github.com/redt1de/go2cnc/backend/cnc"
	"github.com/redt1de/go2cnc/backend/config"
	"github.com/redt1de/go2cnc/backend/server"
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
