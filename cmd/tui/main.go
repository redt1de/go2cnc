package main

import (
	"bufio"
	"flag"
	"fmt"
	"go2cnc/pkg/cnc"
	"go2cnc/pkg/cnc/fluidnc"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"log"
	"os"
	"time"
)

var (
	verbosity  int
	configFile string
	Cnc        cnc.Controller
)

func main() {
	flag.IntVar(&verbosity, "v", 0, "Verbosity level")
	flag.StringVar(&configFile, "config", "./config.yaml", "Path to the configuration file")
	flag.Parse()

	// Create an instance of the app structure
	verbosity = 5
	logme.NewLogger(verbosity)

	logme.Info("Starting up CNC controller")
	c, err := config.LoadYamlConfig(configFile)
	if err != nil {
		log.Fatal(err)
	}

	///////////////////////////////////////////////////////////////
	Cnc = fluidnc.NewFluidNcController(c.FluidNCConfig)
	Cnc.OnConnection(func(iscon bool) {
		if iscon {
			logme.Success("Connected to FluidNC")
		} else {
			logme.Error("Fluidnc websocket connection failed...")
		}
	})

	Cnc.OnMessage(func(msg string) {
		fmt.Println(msg)
	})

	Cnc.OnUpdate(func(status *state.State) {

	})

	Cnc.OnProbe(func(result []state.ProbeResult) {
		// logme.Debug("emitting on probe")
		// runtime.EventsEmit(a.ctx, "probeEvent", result)
	})

	// Cnc.Connect()

	go func() {
		time.Sleep(2 * time.Second)
		Cnc.Connect()
		// runtime.EventsEmit(a.ctx, "connectionEvent", Cnc.IsConnected())
	}()

	for {
		time.Sleep(1 * time.Second)
		if Cnc.IsConnected() {

			break
		}
	}

	logme.Success("connected")
	// read lines from stdin
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Text()

		switch line {
		case "exit":
			os.Exit(0)
		case "cat":
			a, err := Cnc.GetFile("center.nc")
			// a, err := Cnc.GetFile("usb", "sha256sum.README") //// /media/redt1de/Parrot home 6.3.2/sha256sum.README
			if err != nil {
				logme.Error("GetFile -> error:", err)
				continue
			}
			fmt.Println(a)
			continue
		case "list":
			a, err := Cnc.ListFiles("")
			if err != nil {
				logme.Error("ListFiles -> error:", err)
				continue
			}
			fmt.Println(a)
			continue
		}

		Cnc.SendAsync(line)
	}

}
