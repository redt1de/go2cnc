package main

import (
	"embed"
	"flag"

	"go2cnc/pkg/app"

	"github.com/wailsapp/wails/v2"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	flag.StringVar(&app.ConfigFile, "config", "./config.yaml", "Path to the configuration file")
	flag.Parse()
	// Create an instance of the app structure
	app := app.NewApp()

	// Create application with options
	err := wails.Run(getAppOptions(app, assets))

	if err != nil {
		println("Error:", err.Error())
	}
}
