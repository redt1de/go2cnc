package main

import (
	"embed"
	"flag"
	"fmt"

	"go2cnc/pkg/app"
	"go2cnc/pkg/logme"

	"github.com/wailsapp/wails/v2"
)

//go:embed all:frontend/dist
var assets embed.FS

// Verbosity is a custom flag.Value implementation
type Verbosity int

func (v *Verbosity) String() string {
	return fmt.Sprintf("%d", *v)
}

func (v *Verbosity) Set(s string) error {
	*v += Verbosity(len(s))
	return nil
}

func main() {
	var verbose Verbosity
	flag.Var(&verbose, "v", "Increase verbosity (use -v, -vv, -vvv, etc.)")
	flag.StringVar(&app.ConfigFile, "config", "./config.yaml", "Path to the configuration file")

	flag.Parse()

	// Create an instance of the app structure
	app := app.NewApp()

	logs := logme.NewLogger(int(verbose))

	opts := getAppOptions(app, assets, int(verbose))
	opts.Logger = logs

	// Create application with options
	err := wails.Run(opts)

	if err != nil {
		println("Error:", err.Error())
	}
}
