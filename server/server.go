package server

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/redt1de/go2cnc/cnc/controller"

	"github.com/gorilla/websocket"
)

// WebSocketServer manages WebSocket clients and CNC communication
type WebSocketServer struct {
	clients       map[*websocket.Conn]bool
	clientMux     sync.Mutex
	upgrader      websocket.Upgrader
	cncController controller.Controller
}

// NewWebSocketServer initializes a new WebSocket server
func NewWebSocketServer(cnc controller.Controller) *WebSocketServer {
	return &WebSocketServer{
		clients:       make(map[*websocket.Conn]bool),
		upgrader:      websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }},
		cncController: cnc,
	}
}
func (ws *WebSocketServer) Start(srvAddr string) {
	err := ws.cncController.Connect()
	if err != nil {
		log.Fatal("❌ Failed to connect to CNC MachineCfg:", err)

	}

	http.HandleFunc("/ws", ws.HandleConnections)
	ws.StartStatusUpdates()
	ws.ListenToConsole()
	log.Println("🚀 WebSocket server running at ws://" + srvAddr + "/ws")
	log.Fatal(http.ListenAndServe(srvAddr, nil))

}

// HandleConnections manages WebSocket client connections
func (ws *WebSocketServer) HandleConnections(w http.ResponseWriter, r *http.Request) {
	conn, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	ws.clientMux.Lock()
	ws.clients[conn] = true
	ws.clientMux.Unlock()
	log.Println("✅ WebSocket client connected")

	// Listen for commands from React (sent to CNC)
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("❌ Client disconnected:", err)
			ws.clientMux.Lock()
			delete(ws.clients, conn)
			ws.clientMux.Unlock()
			break
		}

		command := string(msg)
		log.Println("📥 Received command from React:", command)

		// Send the command to the CNC machine
		if ws.cncController != nil {
			tr, err := strconv.Atoi(string(msg))
			if err == nil {
				ws.cncController.SendRaw([]byte{byte(tr)})
				continue
			}
			ws.cncController.Send(command)
		}
	}
}

// Broadcast sends an event message to all WebSocket clients
func (ws *WebSocketServer) Broadcast(eventType string, data interface{}) {
	message, err := json.Marshal(map[string]interface{}{"event": eventType, "data": data})
	if err != nil {
		log.Println("❌ Error encoding message:", err)
		return
	}

	ws.clientMux.Lock()
	defer ws.clientMux.Unlock()

	for conn := range ws.clients {
		err := conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Println("❌ Error sending message:", err)
			conn.Close()
			delete(ws.clients, conn)
		}
	}
}

// StartStatusUpdates continuously sends CNC status updates
func (ws *WebSocketServer) StartStatusUpdates() {
	go func() {
		for {
			if ws.cncController != nil {
				status := ws.cncController.GetStatus()
				ws.Broadcast("status", status)
			}
			time.Sleep(1 * time.Second)
		}
	}()
}

// ListenToConsole reads console messages from CNC and forwards them
func (ws *WebSocketServer) ListenToConsole() {
	go func() {
		for msg := range ws.cncController.Console() {
			log.Println("📡 Console:", msg)
			ws.Broadcast("console", msg)
		}
	}()
}
