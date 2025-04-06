package websocket

import (
	"go2cnc/pkg/logme"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type WebSocketProvider struct {
	url             string
	conn            *websocket.Conn
	onReceive       func([]byte)
	reconnectTicker *time.Ticker
	reconnectDelay  time.Duration
	connected       bool
}
type WebSocketConfig struct {
	Url string `json:"url" yaml:"url"`
}

func NewWebSocketProvider(cfg *WebSocketConfig) *WebSocketProvider {
	return &WebSocketProvider{
		url:            cfg.Url,
		reconnectDelay: 5 * time.Second,
	}
}

func (w *WebSocketProvider) Connect() error {
	go w.connectLoop()
	return nil
}

func (w *WebSocketProvider) connectLoop() {
	for {
		conn, _, err := websocket.DefaultDialer.Dial(w.url, http.Header{})
		if err != nil {
			w.connected = false
			logme.Error("WebSocket connection failed:", err)
			time.Sleep(w.reconnectDelay)
			continue
		}

		w.conn = conn
		w.connected = true
		logme.Success("WebSocket connected to ", w.url)
		w.readLoop()
		w.connected = false
	}
}

func (w *WebSocketProvider) readLoop() {
	for {
		type_, msg, err := w.conn.ReadMessage()
		if err != nil {
			logme.Error("WebSocket read error:", err)
			return
		}
		if type_ == 1 {
			continue
		}
		if w.onReceive != nil {
			w.onReceive(msg)
		}
	}
}

func (w *WebSocketProvider) Disconnect() error {
	if w.conn != nil {
		return w.conn.Close()
	}
	return nil
}

func (w *WebSocketProvider) IsConnected() bool {
	return w.connected
}

func (w *WebSocketProvider) Send(data []byte) error {
	if w.conn == nil {
		return nil
	}
	return w.conn.WriteMessage(websocket.TextMessage, data)
}

func (w *WebSocketProvider) SetReceiveHandler(handler func([]byte)) {
	w.onReceive = handler
}

func (w *WebSocketProvider) SetReconnectInterval(delay time.Duration) {
	w.reconnectDelay = delay
}
