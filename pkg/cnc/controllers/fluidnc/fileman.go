package fluidnc

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/logme"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path/filepath"
	"time"
)

type FluidNCFileManager struct {
	apiUrl     string
	httpClient *http.Client
}

func withDevProxy(u string) *http.Client {
	proxyStr := u

	proxyURL, err := url.Parse(proxyStr)
	if err != nil {
		logme.Fatal("Error parsing proxy URL:", err)
		return nil
	}

	transport := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
	}

	logme.Warning("Using dev proxy: ", proxyStr)

	return &http.Client{
		Transport: transport,
	}

}
func withDefaultClient() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second,
	}
}

func NewFluidNCFileManager(apiUrl string) *FluidNCFileManager {
	return &FluidNCFileManager{
		apiUrl:     apiUrl,
		httpClient: withDefaultClient(),
		// httpClient: withDevProxy("http://localhost:8080"),
	}
}

type listResponse struct {
	Files []struct {
		Name string `json:"name"`
		Size string `json:"size"`
	} `json:"files"`
	Path string `json:"path"`
}

func (f *FluidNCFileManager) List(path string) (fileman.FileList, error) {
	ret := fileman.FileList{
		Files: []fileman.FileInfo{},
		Path:  path,
	}
	endpoint := fmt.Sprintf("%s/upload", f.apiUrl)

	query := url.Values{}
	query.Set("path", "/"+path) // ensure path is rooted
	query.Set("action", "list")

	fullUrl := fmt.Sprintf("%s?%s", endpoint, query.Encode())

	resp, err := f.httpClient.Get(fullUrl)
	if err != nil {
		return ret, fmt.Errorf("failed to request file list: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ret, fmt.Errorf("unexpected status code: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ret, fmt.Errorf("failed to read list response: %w", err)
	}

	var parsed listResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return ret, fmt.Errorf("failed to parse JSON: %w", err)
	}

	var result []fileman.FileInfo
	for _, fInfo := range parsed.Files {
		result = append(result, fileman.FileInfo{
			Path: path,
			Name: fInfo.Name,
			Size: fInfo.Size,
		})
	}

	ret.Files = result

	return ret, nil
}

func (f *FluidNCFileManager) Read(path string) (string, error) {
	fullUrl := fmt.Sprintf("%s/sd/%s", f.apiUrl, path)

	resp, err := f.httpClient.Get(fullUrl)
	if err != nil {
		return "", fmt.Errorf("failed to send read request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	return string(body), nil
}
func (f *FluidNCFileManager) Write(name, content string) error {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Extract path and filename
	dir := filepath.Dir(name)
	if dir == "." {
		dir = "/" // root
	}
	base := filepath.Base(name)

	// Add required fields
	writer.WriteField("path", dir)
	writer.WriteField("/"+base+"S", fmt.Sprintf("%d", len(content))) // Size
	writer.WriteField("/"+base+"T", time.Now().Format(time.RFC3339)) // Timestamp

	// Create file field
	formFile, err := writer.CreateFormFile("myfiles", "/"+base)
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	_, err = formFile.Write([]byte(content))
	if err != nil {
		return fmt.Errorf("failed to write file content: %w", err)
	}

	// Finalize the multipart message
	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Build the request
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/upload", f.apiUrl), &buf)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send the request
	resp, err := f.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("upload failed: %w", err)
	}
	defer resp.Body.Close()

	// Check the response
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("upload failed with status: %s", resp.Status)
	}

	return nil
}

func (f *FluidNCFileManager) Delete(path string) error {
	dir := filepath.Dir(path)
	filename := filepath.Base(path)

	url := fmt.Sprintf("%s/upload?path=%s&action=delete&filename=%s", f.apiUrl, dir, filename)

	resp, err := f.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("failed to send delete request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("delete request failed with HTTP status: %s", resp.Status)
	}

	return nil
}

func (f *FluidNCFileManager) MkDir(path string) error {
	dir := filepath.Dir(path)
	if dir == "." {
		dir = "/"
	}
	name := filepath.Base(path)

	url := fmt.Sprintf("%s/upload?path=%s&action=createdir&filename=%s", f.apiUrl, dir, name)
	resp, err := f.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("failed to send mkdir request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("mkdir failed: received HTTP %s", resp.Status)
	}

	// Optionally read and parse response (not necessary unless you want to log or verify)
	_, err = io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read mkdir response body: %w", err)
	}

	return nil
}

func (f *FluidNCFileManager) RmDir(path string) error {
	dir := filepath.Dir(path)
	if dir == "." {
		dir = "/"
	}
	name := filepath.Base(path)

	url := fmt.Sprintf("%s/upload?path=%s&action=deletedir&filename=%s", f.apiUrl, dir, name)
	resp, err := f.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("failed to send deletedir request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("deletedir failed: received HTTP %s", resp.Status)
	}

	// Optionally read and discard body for logging or debugging
	_, err = io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read deletedir response body: %w", err)
	}

	return nil
}

func (f *FluidNCFileManager) RunFile(path string) error {
	// /command?cmd=$SD/Run=/safe-test.nc
	filename := filepath.Base(path)

	// url := fmt.Sprintf("%s/upload?path=%s&action=delete&filename=%s", f.apiUrl, dir, filename)
	url := fmt.Sprintf("%s/command?cmd=$SD/Run=/%s", f.apiUrl, filename)

	resp, err := f.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("failed to send delete request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("delete request failed with HTTP status: %s", resp.Status)
	}

	return nil
}
