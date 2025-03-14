package config

import (
	"io/ioutil"

	"go2cnc/pkg/cnc"

	"gopkg.in/yaml.v3"
)

// {
//     "socketProvider": "websocket",
//     "socketAddress": "192.168.0.134",
//     "socketPort": 81,
//     "baudrate": 115200,
//     "controllerType": "fluidnc",
//     "serialPort": "/dev/ttyUSB0"
// }%

type Config struct {
	PendantCfg struct {
		ServerAddr string `json:"serverAddress" yaml:"server_address"`
	} `json:"pendantCfg" yaml:"pendant_cfg"`
	MachineCfg cnc.MachineCfg `json:"machineCfg" yaml:"machine_cfg"`
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
