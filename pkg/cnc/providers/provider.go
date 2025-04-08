package providers

import "time"

// Provider is a generic interface for connection methods (websocket, serial, etc.)
type Provider interface {
	Connect() error
	Disconnect() error
	IsConnected() bool
	Send(data []byte) error
	SetReceiveHandler(func([]byte))
	SetConnHandler(handler func(bool))
	SetReconnectInterval(time.Duration)
}
