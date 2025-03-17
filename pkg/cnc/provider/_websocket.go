package provider

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketProvider communicates with a CNC machine over WebSockets (e.g., FluidNC)
type WebSocketProvider struct {
	Addr         string
	isConnected  bool
	conn         *websocket.Conn
	mutex        sync.Mutex
	stopChan     chan struct{}
	OnData       func(string)
	OnConnection func(bool)
}

func (w *WebSocketProvider) SetOnData(f func(string)) {
	w.OnData = f
}

func (w *WebSocketProvider) SetOnConnection(f func(bool)) {
	w.OnConnection = f
}

// NewWebSocketProvider creates a new instance of WebSocketProvider
func NewWebSocketProvider(ip string, port int) *WebSocketProvider {
	log.Println("🔗 Using WebSocket Provider...")
	return &WebSocketProvider{
		Addr:        fmt.Sprintf("ws://%s:%d", ip, port),
		isConnected: false,
		stopChan:    make(chan struct{}),
	}
}

// Connect establishes a WebSocket connection
func (w *WebSocketProvider) Connect() error {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.isConnected {
		return nil
	}

	var err error
	for {
		w.conn, _, err = websocket.DefaultDialer.Dial(w.Addr, nil)
		if err != nil {
			log.Println("❌ WebSocket -> CNC:", err)
			time.Sleep(5 * time.Second)
			continue
		}

		w.isConnected = true
		w.OnConnection(w.isConnected)
		log.Println("✅ WebSocket -> CNC: Connected:", w.Addr)
		go w.listen()
		return nil
	}
}

// listen reads messages and calls the OnData callback
func (w *WebSocketProvider) listen() {
	for {
		select {
		case <-w.stopChan:
			return
		default:
			_, bMsg, err := w.conn.ReadMessage()
			if err != nil {
				log.Println("❌ WebSocket -> CNC: Disconnected:", err)
				w.reconnect()
				return
			}

			if ignore(string(bMsg)) {
				continue
			}
			message := strings.TrimSpace(string(bMsg))
			log.Println("📥 Received from CNC:", message)
			if w.OnData != nil {
				w.OnData(message)
			}
		}
	}
}

// Send sends a command over the WebSocket connection
func (w *WebSocketProvider) Send(msg string) error {
	msg = strings.TrimRight(msg, "\n")
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.conn == nil || !w.isConnected {
		w.OnConnection(w.isConnected)
		return errors.New("WebSocket not connected")
	}

	err := w.conn.WriteMessage(websocket.TextMessage, []byte(msg+"\n"))
	if err != nil {
		w.reconnect()
		return err
	}
	log.Println("📤 Sent to CNC:", msg)
	return nil
}

// Send sends a command over the WebSocket connection
func (w *WebSocketProvider) SendRaw(msg []byte) error {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.conn == nil || !w.isConnected {
		w.OnConnection(w.isConnected)
		return errors.New("WebSocket not connected")
	}

	err := w.conn.WriteMessage(websocket.TextMessage, msg)
	if err != nil {
		w.reconnect()
		return err
	}
	log.Println("📤 Sent to CNC:", string(msg))
	return nil
}

// Disconnect closes the WebSocket connection
func (w *WebSocketProvider) Disconnect() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.conn != nil {
		close(w.stopChan)
		w.conn.Close()
		w.conn = nil
		w.isConnected = false
		w.OnConnection(w.isConnected)
	}
}

// reconnect handles automatic reconnection
func (w *WebSocketProvider) reconnect() {
	w.Disconnect()
	time.Sleep(5 * time.Second)
	w.Connect()
}

// IsConnected returns the connection status
func (w *WebSocketProvider) IsConnected() bool {
	return w.isConnected
}

var ignoreFilters = []string{
	"PING:",
	"ACTIVE_ID:",
	"CURRENT_ID",
}

func ignore(data string) bool {
	for _, filter := range ignoreFilters {
		if strings.HasPrefix(data, filter) {
			return true
		}
	}
	return false

}
