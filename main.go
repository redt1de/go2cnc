package main

import (
	"embed"
	"flag"

	"go2cnc/pkg/app"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	flag.StringVar(&app.ConfigFile, "config", "./config.yaml", "Path to the configuration file")
	flag.Parse()
	// Create an instance of the app structure
	app := app.NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		// Title:              "go2cnc",
		Width:              1024,
		Height:             600,
		DisableResize:      true,
		LogLevelProduction: logger.ERROR,
		// WindowStartState:   options.Maximised,
		AlwaysOnTop: true,
		// Fullscreen:         true,
		// Frameless:          true,

		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
