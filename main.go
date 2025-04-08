package main

import (
	"embed"
	"flag"
	"log"

	"go2cnc/pkg/app"
	"go2cnc/pkg/config"
	"go2cnc/pkg/logme"
	"go2cnc/pkg/util"

	"github.com/wailsapp/wails/v2"
)

//go:embed all:frontend/dist
var assets embed.FS

var (
	configFile string
)

func init() {

}

func main() {

	flag.StringVar(&configFile, "config", "./config.yaml", "Path to the configuration file")
	flag.Parse()

	var err error
	app.CurrentConfig, err = config.LoadYamlConfig(configFile)
	if err != nil {
		log.Fatal(err)
	}

	err = util.MkDirIfNotExist(app.CurrentConfig.LocalFsPath)
	if err != nil {
		log.Fatal(err)
	}
	err = util.MkDirIfNotExist(app.CurrentConfig.MacroPath)
	if err != nil {
		log.Fatal(err)
	}

	// Create an instance of the app structure
	a := app.NewApp()
	logs := logme.NewLogger(app.CurrentConfig.LogLevel, app.CurrentConfig.LogFile)
	opts := getAppOptions(a, assets, app.CurrentConfig.LogLevel)
	opts.Logger = logs
	// Create application with options

	logme.Info("Config File: ", configFile)
	logme.Info("Log Level: ", app.CurrentConfig.LogLevel)
	err = wails.Run(opts)

	if err != nil {
		println("Error:", err.Error())
	}
}
