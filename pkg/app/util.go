package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"go2cnc/pkg/cnc"
	"go2cnc/pkg/logme"
	"go2cnc/pkg/util"
	"os"
	"path/filepath"
)

func getFileUSB(path string) (string, error) {
	drives, err := util.DetectUSB()
	if err != nil {
		logme.Error("GetFile -> DetectUSB -> error:", err)
		return "", err
	}
	if len(drives) == 0 {
		logme.Error("GetFile -> no USB drives detected")
		return "", errors.New("no USB drives detected")
	}

	d := drives[0]

	data, err := os.ReadFile(filepath.Join(d, path))
	if err != nil {
		logme.Error("GetFile -> os.Read -> error:", err)
		return "", err
	}
	return string(data), nil
}

func listFilesUSB(path string) (string, error) {
	drives, err := util.DetectUSB()
	if err != nil {
		logme.Error("ListFiles -> DetectUSB -> error:", err)
		return "", err
	}
	if len(drives) == 0 {
		logme.Error("ListFiles -> no USB drives detected")
		return "", errors.New("no USB drives detected")
	}

	d := drives[0]

	fl, err := listFiles(d)
	if err != nil {
		logme.Error("ListFiles -> listfiles -> error:", err)
		return "", err
	}

	ret, err := json.Marshal(fl)
	if err != nil {
		logme.Error("ListFiles -> error:", err)
		return "", err
	}
	return string(ret), nil

}

func listFiles(dirPath string) (*cnc.FileList, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	var files []cnc.FileInfo
	var totalBytes int64

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		size := "-1"
		if !info.IsDir() {
			size = fmt.Sprintf("%d", info.Size())
			totalBytes += info.Size()
		}

		files = append(files, cnc.FileInfo{
			Name: entry.Name(),
			Size: size,
		})
	}

	fileList := &cnc.FileList{
		Files:      files,
		Path:       dirPath,
		Total:      "N/A",                  // You could calculate total disk space
		Used:       formatSize(totalBytes), // Convert bytes to string like "52.0 KB"
		Occupation: "0",                    // Optional: you can compute % usage
	}

	return fileList, nil
}

func formatSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
