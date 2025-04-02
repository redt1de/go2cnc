package app

import (
	"fmt"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/util"
	"os"
	"path/filepath"
)

type USBFs struct {
	drivePresent bool
	drivePath    string
}

func (u *USBFs) Init() {
	drives, err := util.DetectUSB()
	if err != nil {
		u.drivePresent = false
		u.drivePath = ""
	}
	if len(drives) == 0 {
		u.drivePresent = false
		u.drivePath = ""
		return
	}

	d := drives[0]
	if d == "" {
		u.drivePresent = false
		u.drivePath = ""
	}
	u.drivePresent = true
	u.drivePath = d
}

func (u *USBFs) Path() string {
	u.Init()
	return u.drivePath
}

func (u *USBFs) List(path string) (fileman.FileList, error) {
	ret := fileman.FileList{
		Files: []fileman.FileInfo{},
		Path:  path,
	}
	base := filepath.Join(u.Path(), path)
	entries, err := os.ReadDir(base)
	if err != nil {
		return ret, err
	}

	var result []fileman.FileInfo
	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name()) // relative path
		info, err := entry.Info()
		if err != nil {
			continue
		}
		size := "-1"
		if !entry.IsDir() {
			size = fmt.Sprintf("%d", info.Size())
		}
		result = append(result, fileman.FileInfo{
			Path: fullPath,
			Name: entry.Name(),
			Size: size,
		})
	}
	ret.Files = result
	return ret, nil
}

func (u *USBFs) Read(path string) (string, error) {
	full := filepath.Join(u.Path(), path)
	data, err := os.ReadFile(full)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (u *USBFs) Write(name, content string) error {
	full := filepath.Join(u.Path(), name)
	return os.WriteFile(full, []byte(content), 0644)
}

func (u *USBFs) Delete(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.Remove(full)
}

func (u *USBFs) MkDir(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.MkdirAll(full, 0755)
}
func (u *USBFs) RmDir(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.RemoveAll(full)
}
