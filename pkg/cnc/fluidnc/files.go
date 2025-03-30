package fluidnc

import (
	"bytes"
	"fmt"
	"go2cnc/pkg/logme"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

func (f *FluidNC) DelFile(delfile string) (string, error) {

	path := filepath.Dir(delfile)
	name := filepath.Base(delfile)
	// resp, err := http.Get(fmt.Sprintf("%s/upload?path=%s&action=delete&filename=%s", f.ApiUrl, path, name))

	logme.Debug(fmt.Sprintf("FluidNC.DelFile(%s) -> path: %s, name: %s", delfile, path, name))

	resp, err := f.httpClient.Get(fmt.Sprintf("%s/upload?path=%s&action=delete&filename=%s", f.ApiUrl, path, name))
	if err != nil {
		return "", fmt.Errorf("failed to send GET request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to delete file: received HTTP %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return string(body), fmt.Errorf("failed to read response body: %w", err)
	}
	return string(body), nil
}

func (f *FluidNC) PutFile(fpath, content string) error {
	filename := filepath.Base(fpath)
	targetPath := filepath.Dir(fpath)

	logme.Debug(fmt.Sprintf("FluidNC.PutFile(%s, bytes(%d)) -> path: %s, name: %s", fpath, len(content), targetPath, filename))

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Required form fields
	writer.WriteField("path", targetPath)
	writer.WriteField(fpath+"S", fmt.Sprintf("%d", len(content))) // Size
	writer.WriteField(fpath+"T", time.Now().Format(time.RFC3339)) // Timestamp

	// Create file field
	formFile, err := writer.CreateFormFile("myfiles", fpath)
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	_, err = formFile.Write([]byte(content))
	if err != nil {
		return fmt.Errorf("failed to write file content: %w", err)
	}

	// Close writer to finalize the multipart message
	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}

	// Build the request
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/upload", f.ApiUrl), &buf)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send the request
	resp, err := f.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("upload failed: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("upload failed: received HTTP %s", resp.Status)
	}

	return nil
}

func (f *FluidNC) RunFile(filePath string) error {
	cmd := fmt.Sprintf("$SD/Run=%s", filePath)
	logme.Debug(fmt.Sprintf("FluidNC.RunFile(%s) -> cmd: %s", filePath, cmd))
	f.SendAsync(cmd)
	return nil
}

func (f *FluidNC) GetFile(path string) (string, error) {
	cmd := fmt.Sprintf("$SD/Show=%s", path)
	logme.Debug(fmt.Sprintf("FluidNC.GetFile(%s) -> cmd: %s", path, cmd))

	j, err := f.SendWait(cmd)
	if err != nil {
		logme.Error("GetFile-> SendWait -> error:", err)
		return "", err
	}
	// remove last item if its ok
	if len(j) > 0 && j[len(j)-1] == "ok" {
		j = j[:len(j)-1]
	}

	return strings.Join(j, "\n"), nil

}

func (f *FluidNC) ListFiles(path string) (string, error) {
	cmd := "$SD/ListJSON"
	if path != "" {
		cmd = fmt.Sprintf("$SD/ListJSON=%s", path)
	}
	logme.Debug(fmt.Sprintf("FluidNC.ListFiles(%s) -> cmd: %s", path, cmd))

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
