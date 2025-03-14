package provider

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/tarm/serial"
)

// SerialProvider communicates with a CNC machine over a Serial (USB/UART) connection
type SerialProvider struct {
	Port        string
	BaudRate    int
	isConnected bool
	serialPort  *serial.Port
	OnData      func(string)
}

func (w *SerialProvider) SetOnData(f func(string)) {
	w.OnData = f
}

// NewSerialProvider creates a new instance of SerialProvider
func NewSerialProvider(port string, baudRate int) *SerialProvider {
	log.Println("🔗 Using WebSocket Provider...")
	return &SerialProvider{
		Port:     port,
		BaudRate: baudRate,
	}
}

// Connect establishes a serial connection
func (s *SerialProvider) Connect() error {
	config := &serial.Config{Name: s.Port, Baud: s.BaudRate, ReadTimeout: time.Second * 2}
	port, err := serial.OpenPort(config)
	if err != nil {
		return fmt.Errorf("failed to open serial port: %w", err)
	}

	s.serialPort = port
	s.isConnected = true
	log.Println("✅ Connected to CNC via Serial on", s.Port)

	// Start reading serial data
	go s.listen()
	return nil
}

// listen reads messages from the serial port
func (s *SerialProvider) listen() {
	buf := make([]byte, 128)
	for s.isConnected {
		n, err := s.serialPort.Read(buf)
		if err != nil {
			log.Println("❌ Serial read error:", err)
			s.Disconnect()
			return
		}

		message := string(buf[:n])
		log.Println("📥 Received from Serial:", message)
	}
}

// Send sends a command over Serial
func (s *SerialProvider) Send(msg string) error {
	if s.serialPort == nil || !s.isConnected {
		return errors.New("serial port not connected")
	}

	_, err := s.serialPort.Write([]byte(msg + "\n"))
	return err
}

// Send sends a command over Serial
func (s *SerialProvider) SendRaw(msg []byte) error {
	if s.serialPort == nil || !s.isConnected {
		return errors.New("serial port not connected")
	}

	_, err := s.serialPort.Write(msg)
	return err
}

// Disconnect closes the Serial connection
func (s *SerialProvider) Disconnect() {
	if s.serialPort != nil {
		s.serialPort.Close()
		s.serialPort = nil
		s.isConnected = false
		log.Println("🔌 Serial connection closed")
	}
}

// IsConnected returns the connection status
func (s *SerialProvider) IsConnected() bool {
	return s.isConnected
}
