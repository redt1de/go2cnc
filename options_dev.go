//go:build dev
// +build dev

package main

import (
	"embed"
	"go2cnc/pkg/app"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func getAppOptions(a *app.App, assets embed.FS, v int) *options.App {
	logLevel := logger.ERROR // v is inverse of wails loglevel i.e. trace = 1 in wails, here its 5
	if v == 1 {
		logLevel = logger.ERROR
	} else if v == 2 {
		logLevel = logger.WARNING
	} else if v == 3 {
		logLevel = logger.INFO
	} else if v == 4 {
		logLevel = logger.DEBUG
	} else if v == 5 {
		logLevel = logger.TRACE
	}
	return &options.App{
		// Title:              "go2cnc",
		Width:              1024,
		Height:             600,
		DisableResize:      true,
		LogLevelProduction: logLevel,
		LogLevel:           logLevel,
		// WindowStartState:   options.Maximised,
		// AlwaysOnTop: true,
		// Fullscreen:         true,
		// Frameless:          true,
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},

		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        a.Startup,
		Bind: []interface{}{
			a,
		},
	}
}
