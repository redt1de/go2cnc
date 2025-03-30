package config

import (
	"go2cnc/pkg/cnc/fluidnc"
	"io/ioutil"

	"gopkg.in/yaml.v3"
)

const testCfgProxy = `
ui:
 probeMacro1: "G38.2 Z-50 F100"
pendantCfg:
 serverAddress: ""
fluidnc:
 api_url: "http://fluidnc.local"
 ws_url: "ws://localhost:81"
`
const testCfg = `
ui:
 probeMacro1: "G38.2 Z-50 F100"
pendantCfg:
 serverAddress: ""
fluidnc:
 api_url: "http://fluidnc.local"
 ws_url: "ws://fluidnc.local:81"
`

type Config struct {
	MacroPath string `json:"macroPath" yaml:"macro_path"`
	LogLevel  int    `json:"logLevel" yaml:"log_level"`
	LogFile   string `json:"logFile" yaml:"log_file"`
	//
	FluidNCConfig fluidnc.FluidNCConfig `json:"fluidnc" yaml:"fluidnc"`
}

func LoadYamlConfig(fpath string) (*Config, error) {
	var config Config

	data, err := ioutil.ReadFile(fpath)
	if err != nil {
		return nil, err
	}

	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func UnmarshalConfig(rawCfg string) (*Config, error) {
	var config Config

	err := yaml.Unmarshal([]byte(rawCfg), &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
