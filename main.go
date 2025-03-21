package main

import (
	"embed"
	"flag"

	"go2cnc/pkg/app"
	"go2cnc/pkg/logme"

	"github.com/wailsapp/wails/v2"
)

//go:embed all:frontend/dist
var assets embed.FS

var (
	verbosity  int
	configFile string
)

func init() {

}

func main() {
	flag.IntVar(&verbosity, "v", 0, "Verbosity level")
	flag.StringVar(&configFile, "config", "./config.yaml", "Path to the configuration file")
	flag.Parse()

	verbosity = 5
	app.ConfigFile = configFile

	// Create an instance of the app structure
	app := app.NewApp()

	logs := logme.NewLogger(verbosity)

	opts := getAppOptions(app, assets, verbosity)
	opts.Logger = logs

	// Create application with options
	err := wails.Run(opts)

	if err != nil {
		println("Error:", err.Error())
	}
}
