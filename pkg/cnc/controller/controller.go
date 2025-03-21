package controller

type Controller interface {
	Connect() error
	Send(string) error
	SendRaw([]byte) error
	GetStatus() Status
	IsConnected() bool
	Disconnect()
	SetEmitter(func(eventName string, optionalData ...interface{}))
	onData(data string)
	onConnection(isConnected bool)
	ClearProbeHistory()
	GetProbeHistory() []ProbeResult
}
