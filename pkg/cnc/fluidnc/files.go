package fluidnc

import (
	"encoding/json"
	"errors"
	"fmt"
	"go2cnc/pkg/logme"
	"go2cnc/pkg/util"
	"os"
	"path/filepath"
	"strings"
)

/*
$LocalFS/List
	[FILE: config.yaml|SIZE:4920]
	[FILE: favicon.ico|SIZE:1150]
	[FILE: holdmonitor.html.gz|SIZE:1243]
	[FILE: index.html.gz|SIZE:89556]
	[FILE: preferences.json|SIZE:5053]
	[/littlefs/ Free:72.00 KB Used:120.00 KB Total:192.00 KB]

$LocalFS/ListJSON
	{"files":[
		{"name":"config.yaml","size":"4920"},
		{"name":"favicon.ico","size":"1150"},
		{"name":"holdmonitor.html.gz","size":"1243"},
		{"name":"index.html.gz","size":"89556"},
		{"name":"preferences.json","size":"5053"}
	],
	"path":"",
	"total":"192.00 KB",
	"used":"120.00 KB",
	"occupation":"62"
}

$SD/List
	[DIR:Spoilboard]
	[FILE:  spoil-drill.nc|SIZE:1164]
	[FILE:  test.nc|SIZE:161]
	[FILE:  surf.nc|SIZE:1328]
	[FILE: grid.nc|SIZE:580]
	[FILE: drill.nc|SIZE:5589]
	[FILE: center.nc|SIZE:623]
	[DIR:Macros]
	[FILE:  lazer-mark-0.nc|SIZE:158]
	[FILE:  probe_macro.nc|SIZE:3264]
	[FILE:  probe_inner.nc|SIZE:651]
	[/sd/ Free:3.68 GB Used:52.00 KB Total:3.68 GB]

$SD/ListJSON

$Files/ListGcode
	returns the same as $SD/ListJSON but only nc files
*/

/*
drive = SD (fluidnc SD card)
usb = USB plugged into pendant
*/

/*
{"files":[
{"name":"Spoilboard",
"size":"-1"
},
{"name":"grid.nc",
"size":"580"
},
{"name":"drill.nc",
"size":"5589"
},
{"name":"center.nc",
"size":"623"
},
{"name":"Macros",
"size":"-1"
}
],
"path":"",
"total":"3.68 GB",
"used":"52.00 KB",
"occupation":"0"
}
*/

type FileList struct {
	Files      []FileInfo `json:"files"`
	Path       string     `json:"path"`
	Total      string     `json:"total"`
	Used       string     `json:"used"`
	Occupation string     `json:"occupation"`
}

type FileInfo struct {
	Name string `json:"name"`
	Size string `json:"size"` // Note: size is a string in the JSON
}

func (f *FluidNC) ListFiles(drive, path string) (string, error) {

	drive = strings.ToUpper(drive)
	switch drive {
	case "SD":
		return f.listFluidNCSD(path)
	case "USB":
		return f.listUSB(path)
	default:
		return f.listFluidNCSD(path)
	}
}

func (f *FluidNC) GetFile(drive, path string) (string, error) {
	drive = strings.ToUpper(drive)
	switch drive {
	case "SD":
		return f.getFileFluidNCSD(path)
	case "USB":
		return f.getFileUSB(path)
	default:
		return f.getFileFluidNCSD(path)
	}
}

func (f *FluidNC) getFileFluidNCSD(path string) (string, error) {
	cmd := fmt.Sprintf("$SD/Show=%s", path)
	j, err := f.SendWait(cmd)
	if err != nil {
		logme.Error("GetFile-> SendWait -> error:", err)
		return "", err
	}
	return strings.Join(j, "\n"), nil

}

func (f *FluidNC) getFileUSB(path string) (string, error) {
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

func (f *FluidNC) listFluidNCSD(path string) (string, error) {
	cmd := "$SD/ListJSON"
	if path != "" {
		cmd = fmt.Sprintf("$SD/ListJSON=%s", path)
	}

	j, err := f.SendWait(cmd)
	if err != nil {
		logme.Error("ListFiles -> SendWait -> error:", err)
		return "", err
	}
	var js string
	for _, l := range j {
		if l == "ok" {
			continue
		}

		js += strings.TrimSpace(l)
	}

	// ok := false

	// if !ok {
	// 	logme.Error("ListFiles -> failed")
	// 	return "", err
	// }

	logme.Success("ListFiles -> success")
	fmt.Println(">>>>>>>>>>>>>", js)
	return js, nil
}

func (f *FluidNC) listUSB(path string) (string, error) {
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

func listFiles(dirPath string) (*FileList, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	var files []FileInfo
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

		files = append(files, FileInfo{
			Name: entry.Name(),
			Size: size,
		})
	}

	fileList := &FileList{
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
