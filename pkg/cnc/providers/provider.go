package providers

import "time"

// Provider is a generic interface for connection methods (websocket, serial, etc.)
type Provider interface {
	Connect() error
	Disconnect() error
	IsConnected() bool
	Send(data []byte) error
	SetReceiveHandler(func([]byte))
	SetReconnectInterval(time.Duration)
}
