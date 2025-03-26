package fluidnc

import (
	"fmt"
	"go2cnc/pkg/logme"
	"strings"
)

func (f *FluidNC) GetFile(path string) (string, error) {
	cmd := fmt.Sprintf("$SD/Show=%s", path)
	j, err := f.SendWait(cmd)
	if err != nil {
		logme.Error("GetFile-> SendWait -> error:", err)
		return "", err
	}
	return strings.Join(j, "\n"), nil

}

func (f *FluidNC) ListFiles(path string) (string, error) {
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

	logme.Success("ListFiles -> success")
	return js, nil
}
