package provider

// Provider is the interface for all CNC connection types
type Provider interface {
	Connect() error
	Disconnect()
	Send(string) error
	SendRaw([]byte) error
	SetOnData(func(string))
	IsConnected() bool
}
