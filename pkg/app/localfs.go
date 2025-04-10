package app

import (
	"errors"
	"fmt"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/logme"
	"os"
	"path/filepath"
)

type LocalFs struct {
	pathRoot string
}

func NewLocalFs(pathRoot string) *LocalFs {
	return &LocalFs{
		pathRoot: pathRoot,
	}
}

func (u *LocalFs) Path() string {
	return u.pathRoot
}

func (u *LocalFs) List(path string) (fileman.FileList, error) {
	ret := fileman.FileList{
		Files: []fileman.FileInfo{},
		Path:  path,
	}
	var result []fileman.FileInfo
	base := filepath.Join(u.Path(), path)
	entries, err := os.ReadDir(base)
	if err != nil {
		return ret, err
	}

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

func (u *LocalFs) Read(path string) (string, error) {
	full := filepath.Join(u.Path(), path)
	data, err := os.ReadFile(full)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (u *LocalFs) Write(name, content string) error {
	full := filepath.Join(u.Path(), name)
	return os.WriteFile(full, []byte(content), 0644)
}

func (u *LocalFs) Delete(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.Remove(full)
}

func (u *LocalFs) MkDir(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.MkdirAll(full, 0755)
}
func (u *LocalFs) RmDir(path string) error {
	full := filepath.Join(u.Path(), path)
	return os.RemoveAll(full)
}

func (u *LocalFs) RunFile(path string) error {
	logme.Error("RunFile not implemented")
	return errors.New("RunFile not implemented") // TODO
}
