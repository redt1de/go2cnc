package provider

import (
	"bufio"
	"errors"
	"go2cnc/pkg/logme"
	"sync"
	"time"

	"go.bug.st/serial"
	"go.bug.st/serial/enumerator"
)

// SerialProvider communicates with a CNC machine over Serial (USB/UART)
type SerialProvider struct {
	Port         string
	BaudRate     int
	isConnected  bool
	serialPort   serial.Port
	OnData       func(string)
	OnConnection func(bool)
	mu           sync.Mutex // Prevents race conditions
}

// SetOnData sets the callback function for incoming data
func (s *SerialProvider) SetOnData(f func(string)) {
	s.OnData = f
}

// SetOnConnection sets the callback function for connection status changes
func (s *SerialProvider) SetOnConnection(f func(bool)) {
	s.OnConnection = f
}

func (w *SerialProvider) setConnected(is bool) {
	w.isConnected = is
	if w.OnConnection != nil {
		w.OnConnection(is)
	}
}

// NewSerialProvider creates a new instance of SerialProvider
func NewSerialProvider(port string, baudRate int) *SerialProvider {
	logme.Println("🔗 Initializing Serial Provider using go-serial...")
	return &SerialProvider{
		Port:     port,
		BaudRate: baudRate,
	}
}

// Connect establishes a serial connection
func (s *SerialProvider) Connect() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Prevent duplicate connections
	if s.isConnected {
		return nil
	}

	// Configure the serial port
	mode := &serial.Mode{
		BaudRate: s.BaudRate,
		Parity:   serial.NoParity,
		DataBits: 8,
		StopBits: serial.OneStopBit,
	}

	port, err := serial.Open(s.Port, mode)
	if err != nil {
		logme.Println("Failed to open serial port:", s.Port)
		logme.Println("Failed to open serial port:", err)
		return err
	}

	s.serialPort = port
	s.setConnected(true)

	logme.Println("✅ Connected to CNC via Serial on", s.Port)

	// Start listening for serial data in a separate goroutine
	go s.listen()

	return nil
}

// listen continuously reads messages from the serial port
func (s *SerialProvider) listen() {
	reader := bufio.NewReader(s.serialPort)

	for s.isConnected {
		// Read until newline
		line, err := reader.ReadString('\n')
		if err != nil {
			logme.Println("Serial read error:", err)
			s.handleDisconnect() // Handles automatic reconnection
			return
		}

		cleanLine := line[:len(line)-1] // Trim newline
		// logme.Println("📥 Received:", cleanLine)

		// Send data to OnData callback
		if s.OnData != nil {
			s.OnData(cleanLine)
		}
	}
}

// Send sends a command over Serial
func (s *SerialProvider) Send(msg string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.serialPort == nil || !s.isConnected {
		logme.Println("Attempted to send, but serial port is disconnected.")
		s.setConnected(false)
		return errors.New("serial port not connected")
	}

	_, err := s.serialPort.Write([]byte(msg + "\n"))
	return err
}

// SendRaw sends a raw byte command over Serial
func (s *SerialProvider) SendRaw(msg []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.serialPort == nil || !s.isConnected {
		logme.Println("Attempted to send raw data, but serial port is disconnected.")
		s.setConnected(false)
		return errors.New("serial port not connected")
	}

	_, err := s.serialPort.Write(msg)
	return err
}

// handleDisconnect handles connection loss and retries connection
func (s *SerialProvider) handleDisconnect() {
	s.mu.Lock()
	defer s.mu.Unlock()

	logme.Println("🔌 Serial connection lost. Attempting to reconnect...")

	s.setConnected(false)

	// Close the port if open
	if s.serialPort != nil {
		s.serialPort.Close()
		s.serialPort = nil
	}

	// Continuous reconnect loop
	go func() {
		for !s.isConnected {
			logme.Println("🔄 Reconnecting to serial port...")
			err := s.Connect()
			if err == nil {
				logme.Println("✅ Reconnected successfully!")
				return
			}
			time.Sleep(3 * time.Second) // Wait before retrying
		}
	}()
}

// Disconnect closes the Serial connection
func (s *SerialProvider) Disconnect() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.serialPort != nil {
		logme.Println("🔌 Closing serial connection...")
		s.serialPort.Close()
		s.serialPort = nil
		s.setConnected(false)
	}
}

// IsConnected returns the connection status
func (s *SerialProvider) IsConnected() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.isConnected
}

// ListPorts lists available serial ports
func ListPorts() ([]string, error) {
	ports, err := enumerator.GetDetailedPortsList()
	if err != nil {
		return nil, err
	}

	var portNames []string
	for _, port := range ports {
		portNames = append(portNames, port.Name)
	}

	return portNames, nil
}
