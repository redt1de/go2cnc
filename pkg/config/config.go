package config

import (
	"io/ioutil"

	"go2cnc/pkg/cnc"

	"gopkg.in/yaml.v3"
)

const DefaultYamlConfig = `
pendant_cfg:
  server_address: :8080
machine_cfg:
  controller_type: "grbl"
  socket_provider: "serial"
  socket_address: "192.168.0.134"
  socket_port: 81
  baudrate: 115200
  serial_port: "/dev/ttyUSB0"
  auth: "TODO"
  `

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

func UnmarshalConfig(rawCfg string) (*Config, error) {
	var config Config

	err := yaml.Unmarshal([]byte(rawCfg), &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
