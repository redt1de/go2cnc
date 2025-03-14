package main

/*
's/github.com\/redt1de\/go2cnc\/backend/go2cnc\/pkg/g'
*/
import (
	"log"

	"go2cnc/pkg/cnc"
	"go2cnc/pkg/config"
	"go2cnc/pkg/server"
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
