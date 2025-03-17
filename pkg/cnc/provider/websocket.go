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
	lastMessage  time.Time
	OnData       func(string)
	OnConnection func(bool)
}

// SetOnData sets the callback function for incoming data
func (w *WebSocketProvider) SetOnData(f func(string)) {
	w.OnData = f
}

// SetOnConnection sets the callback function for connection status changes
func (w *WebSocketProvider) SetOnConnection(f func(bool)) {
	w.OnConnection = f
}

func (w *WebSocketProvider) setConnected(is bool) {
	w.isConnected = is
	if w.OnConnection != nil {
		w.OnConnection(is)
	}
}

// NewWebSocketProvider creates a new instance of WebSocketProvider
func NewWebSocketProvider(ip string, port int) *WebSocketProvider {
	log.Println("🔗 Initializing WebSocket Provider...")
	return &WebSocketProvider{
		Addr:        fmt.Sprintf("ws://%s:%d", ip, port),
		stopChan:    make(chan struct{}),
		lastMessage: time.Now(),
	}
}

// Connect establishes a WebSocket connection
func (w *WebSocketProvider) Connect() error {
	log.Println("🔗 Connecting to WebSocket:", w.Addr)
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.isConnected {
		log.Println("⚠️ Already connected, skipping reconnection")
		return nil
	}

	var err error
	w.conn, _, err = websocket.DefaultDialer.Dial(w.Addr, nil)
	if err != nil {
		log.Println("❌ WebSocket Connection Failed:", err)
		return err
	}

	w.lastMessage = time.Now()

	log.Println("✅ WebSocket Connected:", w.Addr)

	// Start listening for incoming data
	go w.listen()

	// Start timeout checker
	go w.checkConnectionHealth()

	w.setConnected(true)

	return nil
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
				log.Println("❌ WebSocket Disconnected:", err)
				w.reconnect()
				return
			}

			// ✅ Update last received message timestamp
			w.lastMessage = time.Now()

			// Filter ignored messages
			if ignore(string(bMsg)) {
				continue
			}

			message := strings.TrimSpace(string(bMsg))
			// log.Println("📥 Received from CNC:", message)

			if w.OnData != nil {
				w.OnData(message)
			}
		}
	}
}

// checkConnectionHealth checks if WebSocket has been inactive for too long
func (w *WebSocketProvider) checkConnectionHealth() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-w.stopChan:
			return
		case <-ticker.C:
			w.mutex.Lock()
			if time.Since(w.lastMessage) > 10*time.Second { // 🔥 If no data for 10 seconds, assume lost connection
				log.Println("⚠️ No WebSocket data for 10s, assuming connection lost...")
				w.mutex.Unlock()
				w.reconnect()
				return
			}

			// ✅ Force send a small message to detect if WebSocket is alive
			w.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			err := w.conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				log.Println("⚠️ WebSocket Ping Failed, forcing reconnect:", err)
				w.setConnected(false)
				w.mutex.Unlock()
				w.reconnect()
				return
			}
			w.mutex.Unlock()
		}
	}
}

// Send sends a command over the WebSocket connection
func (w *WebSocketProvider) Send(msg string) error {
	msg = strings.TrimRight(msg, "\n")
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.conn == nil || !w.isConnected {
		log.Println("⚠️ Attempted to send, but WebSocket is disconnected.")
		w.setConnected(false)
		return errors.New("WebSocket not connected")
	}

	// ✅ Set write deadline to detect failed connections
	w.conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	err := w.conn.WriteMessage(websocket.TextMessage, []byte(msg+"\n"))
	if err != nil {
		log.Println("❌ WebSocket Send Failed:", err)
		w.setConnected(false)
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
		log.Println("⚠️ Attempted to send, but WebSocket is disconnected.")
		w.setConnected(false)
		return errors.New("WebSocket not connected")
	}

	// ✅ Set write deadline to detect failed connections
	w.conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	err := w.conn.WriteMessage(websocket.TextMessage, msg)
	if err != nil {
		log.Println("❌ WebSocket Send Failed:", err)
		w.setConnected(false)
		w.reconnect()
		return err
	}

	log.Println("📤 Sent to CNC:", msg)
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
		w.setConnected(false)
		log.Println("🔌 WebSocket Disconnected")
	}
}

// reconnect handles automatic reconnection
func (w *WebSocketProvider) reconnect() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	log.Println("🔄 Attempting to reconnect...")

	// Continuous reconnect loop
	go func() {
		for {
			time.Sleep(5 * time.Second) // Wait before retrying
			err := w.Connect()
			if err == nil {
				log.Println("✅ Reconnected Successfully!")
				return
			}
		}
	}()
}

// IsConnected returns the connection status
func (w *WebSocketProvider) IsConnected() bool {
	return w.isConnected
}

// List of ignored messages
var ignoreFilters = []string{
	"PING:",
	"ACTIVE_ID:",
	"CURRENT_ID",
}

// ignore filters out unnecessary WebSocket messages
func ignore(data string) bool {
	for _, filter := range ignoreFilters {
		if strings.HasPrefix(data, filter) {
			return true
		}
	}
	return false
}

// package provider

// import (
// 	"errors"
// 	"fmt"
// 	"log"
// 	"strings"
// 	"sync"
// 	"time"

// 	"github.com/gorilla/websocket"
// )

// // WebSocketProvider communicates with a CNC machine over WebSockets (e.g., FluidNC)
// type WebSocketProvider struct {
// 	Addr         string
// 	isConnected  bool
// 	conn         *websocket.Conn
// 	mutex        sync.Mutex
// 	stopChan     chan struct{}
// 	OnData       func(string)
// 	OnConnection func(bool)
// }

// // SetOnData sets the callback function for incoming data
// func (w *WebSocketProvider) SetOnData(f func(string)) {
// 	w.OnData = f
// }

// // SetOnConnection sets the callback function for connection status changes
// func (w *WebSocketProvider) SetOnConnection(f func(bool)) {
// 	w.OnConnection = f
// }

// // NewWebSocketProvider creates a new instance of WebSocketProvider
// func NewWebSocketProvider(ip string, port int) *WebSocketProvider {
// 	log.Println("🔗 Initializing WebSocket Provider...")
// 	return &WebSocketProvider{
// 		Addr:     fmt.Sprintf("ws://%s:%d", ip, port),
// 		stopChan: make(chan struct{}),
// 	}
// }

// // Connect establishes a WebSocket connection
// func (w *WebSocketProvider) Connect() error {
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()

// 	if w.isConnected {
// 		log.Println("⚠️ Already connected, skipping reconnection")
// 		return nil
// 	}

// 	var err error
// 	w.conn, _, err = websocket.DefaultDialer.Dial(w.Addr, nil)
// 	if err != nil {
// 		log.Println("❌ WebSocket Connection Failed:", err)
// 		return err
// 	}

// 	w.isConnected = true

// 	// ✅ Ensure OnConnection is not nil before calling
// 	if w.OnConnection != nil {
// 		w.OnConnection(true)
// 	}

// 	log.Println("✅ WebSocket Connected:", w.Addr)

// 	// Start listening for incoming data
// 	go w.listen()

// 	// Start keepalive ping-pong routine
// 	go w.keepAlive()

// 	return nil
// }

// var lastPing time.Time

// // listen reads messages and calls the OnData callback
// func (w *WebSocketProvider) listen() {
// 	for {
// 		select {
// 		case <-w.stopChan:
// 			return
// 		default:
// 			_, bMsg, err := w.conn.ReadMessage()
// 			if err != nil {
// 				log.Println("❌ WebSocket Disconnected:", err)
// 				w.reconnect()
// 				return
// 			}

// 			if strings.HasPrefix(string(bMsg), "PING:") {
// 				lastPing = time.Now()
// 			}

// 			// Filter ignored messages
// 			if ignore(string(bMsg)) {
// 				continue
// 			}

// 			message := strings.TrimSpace(string(bMsg))
// 			log.Println("📥 Received from CNC:", message)

// 			if w.OnData != nil {
// 				w.OnData(message)
// 			}
// 		}
// 	}
// }

// // keepAlive sends periodic pings to detect disconnections
// func (w *WebSocketProvider) keepAlive() {
// 	ticker := time.NewTicker(5 * time.Second)
// 	defer ticker.Stop()

// 	for {
// 		select {
// 		case <-w.stopChan:
// 			return
// 		case <-ticker.C:
// 			w.mutex.Lock()
// 			if w.conn != nil {
// 				err := w.conn.WriteMessage(websocket.PingMessage, nil)
// 				if err != nil {
// 					log.Println("⚠️ WebSocket Ping failed, reconnecting:", err)
// 					w.mutex.Unlock()
// 					w.reconnect()
// 					return
// 				}
// 			}
// 			w.mutex.Unlock()
// 		}
// 	}
// }

// // Send sends a command over the WebSocket connection
// func (w *WebSocketProvider) Send(msg string) error {
// 	msg = strings.TrimRight(msg, "\n")
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()

// 	if w.conn == nil || !w.isConnected {
// 		log.Println("⚠️ Attempted to send, but WebSocket is disconnected.")
// 		if w.OnConnection != nil {
// 			w.OnConnection(false)
// 		}
// 		return errors.New("WebSocket not connected")
// 	}

// 	err := w.conn.WriteMessage(websocket.TextMessage, []byte(msg+"\n"))
// 	if err != nil {
// 		log.Println("❌ WebSocket Send Failed:", err)
// 		w.reconnect()
// 		return err
// 	}

// 	log.Println("📤 Sent to CNC:", msg)
// 	return nil
// }

// // SendRaw sends a raw byte command over the WebSocket connection
// func (w *WebSocketProvider) SendRaw(msg []byte) error {
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()

// 	if w.conn == nil || !w.isConnected {
// 		log.Println("⚠️ Attempted to send raw data, but WebSocket is disconnected.")
// 		if w.OnConnection != nil {
// 			w.OnConnection(false)
// 		}
// 		return errors.New("WebSocket not connected")
// 	}

// 	err := w.conn.WriteMessage(websocket.TextMessage, msg)
// 	if err != nil {
// 		log.Println("❌ WebSocket Send Failed:", err)
// 		w.reconnect()
// 		return err
// 	}

// 	log.Println("📤 Sent to CNC:", string(msg))
// 	return nil
// }

// // Disconnect closes the WebSocket connection
// func (w *WebSocketProvider) Disconnect() {
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()

// 	if w.conn != nil {
// 		close(w.stopChan)
// 		w.conn.Close()
// 		w.conn = nil
// 		w.isConnected = false
// 		if w.OnConnection != nil {
// 			w.OnConnection(false)
// 		}
// 		log.Println("🔌 WebSocket Disconnected")
// 	}
// }

// // reconnect handles automatic reconnection
// func (w *WebSocketProvider) reconnect() {
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()

// 	if w.isConnected {
// 		return
// 	}

// 	log.Println("🔄 Attempting to reconnect...")

// 	// Continuous reconnect loop
// 	go func() {
// 		for {
// 			time.Sleep(5 * time.Second) // Wait before retrying
// 			err := w.Connect()
// 			if err == nil {
// 				log.Println("✅ Reconnected Successfully!")
// 				return
// 			}
// 		}
// 	}()
// }

// // IsConnected returns the connection status
// func (w *WebSocketProvider) IsConnected() bool {
// 	w.mutex.Lock()
// 	defer w.mutex.Unlock()
// 	return w.isConnected
// }

// // List of ignored messages
// var ignoreFilters = []string{
// 	"PING:",
// 	"ACTIVE_ID:",
// 	"CURRENT_ID",
// }

// // ignore filters out unnecessary WebSocket messages
// func ignore(data string) bool {
// 	for _, filter := range ignoreFilters {
// 		if strings.HasPrefix(data, filter) {
// 			return true
// 		}
// 	}
// 	return false
// }
