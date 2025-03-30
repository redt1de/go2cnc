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

	return &options.App{
		// Title:              "go2cnc",
		Width:              1024,
		Height:             600,
		DisableResize:      true,
		LogLevelProduction: logger.DEBUG,
		LogLevel:           logger.DEBUG,
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
