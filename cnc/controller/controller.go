package controller

type Controller interface {
	Connect() error
	Send(string) error
	SendRaw([]byte) error
	GetStatus() Status
	IsConnected() bool
	Disconnect()
	Console() chan string
}
