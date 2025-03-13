package server

import "encoding/json"

// WebSocketEvent represents an event message sent to clients
type WebSocketEvent struct {
	Event string      `json:"event"` // Event type: "console", "status", "error", "connection"
	Data  interface{} `json:"data"`  // Payload
}

// ToJSON converts the event to a JSON string
func (e *WebSocketEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}
