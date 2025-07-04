package cam

import (
	"fmt"
	"go2cnc/pkg/logme"
	"net/http"
	"sync"
	"time"

	"github.com/blackjack/webcam"
)

type StreamServer struct {
	devicePath string
	port       int
	mutex      sync.Mutex
	cam        *webcam.Webcam
}

func NewStreamServer(devicePath string, port int) *StreamServer {
	return &StreamServer{
		devicePath: devicePath,
		port:       port,
	}
}

func (s *StreamServer) Start() error {
	var err error
	s.cam, err = webcam.Open(s.devicePath)
	if err != nil {
		return fmt.Errorf("failed to open webcam: %w", err)
	}

	// Pick a supported format
	formatDesc := s.cam.GetSupportedFormats()
	var format webcam.PixelFormat
	for f, desc := range formatDesc {
		if desc == "Motion-JPEG" {
			format = f
			break
		}
	}
	if format == 0 {
		return fmt.Errorf("Motion-JPEG format not supported")
	}

	// Set desired format and resolution
	_, _, _, err = s.cam.SetImageFormat(format, 640, 480)
	if err != nil {
		return fmt.Errorf("failed to set image format: %w", err)
	}

	err = s.cam.StartStreaming()
	if err != nil {
		return fmt.Errorf("failed to start streaming: %w", err)
	}

	http.HandleFunc("/", s.handleStream)
	go func() {
		logme.Log.Info(fmt.Sprintf("Starting webcam MJPEG stream on http://localhost:%d\n", s.port))
		logme.Log.Error(fmt.Sprintf("webcam stream server failed:", http.ListenAndServe(fmt.Sprintf(":%d", s.port), nil)))
	}()

	return nil
}

func (s *StreamServer) handleStream(w http.ResponseWriter, r *http.Request) {
	// logme.Log.Info(fmt.Sprintf("Client connected: %s\n", r.RemoteAddr))
	w.Header().Add("Content-Type", "multipart/x-mixed-replace; boundary=frame")

	for {
		err := s.cam.WaitForFrame(5)
		switch err.(type) {
		case nil:
			frame, err := s.cam.ReadFrame()
			if err != nil {
				logme.Log.Error(fmt.Sprintf("Error reading webcam frame: %v", err))
				continue
			}
			if len(frame) == 0 {
				continue
			}

			s.mutex.Lock()

			_, _ = fmt.Fprintf(w, "--frame\r\nContent-Type: image/jpeg\r\n\r\n")
			_, _ = w.Write(frame)
			_, _ = fmt.Fprintf(w, "\r\n")
			s.mutex.Unlock()

			time.Sleep(33 * time.Millisecond) // ~30 FPS
		default:
			logme.Log.Error(fmt.Sprintf("webcam WaitForFrame error: %v", err))
		}
	}
}

// func decodeMJPEG(frame []byte) image.Image {
// 	img, err := jpeg.Decode(bytes.NewReader(frame))
// 	if err != nil {
// 		log.Printf("Failed to decode MJPEG frame: %v", err)
// 		return nil
// 	}
// 	return img
// }
