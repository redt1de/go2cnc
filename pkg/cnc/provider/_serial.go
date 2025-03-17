package provider

import (
	"bufio"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/tarm/serial"
)

// SerialProvider communicates with a CNC machine over Serial (USB/UART)
type SerialProvider struct {
	Port         string
	BaudRate     int
	isConnected  bool
	serialPort   *serial.Port
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

// NewSerialProvider creates a new instance of SerialProvider
func NewSerialProvider(port string, baudRate int) *SerialProvider {
	log.Println("🔗 Initializing Serial Provider...")
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

	config := &serial.Config{
		Name:        s.Port,
		Baud:        s.BaudRate,
		Size:        8,
		Parity:      serial.ParityNone,
		StopBits:    serial.Stop1,
		ReadTimeout: time.Millisecond * 500, // ✅ Prevents blocking forever
	}

	port, err := serial.OpenPort(config)
	if err != nil {
		log.Println("❌ Failed to open serial port:", err)
		return err
	}

	s.serialPort = port
	s.isConnected = true

	// ✅ Safely call OnConnection if it is set
	if s.OnConnection != nil {
		s.OnConnection(true)
	}

	log.Println("✅ Connected to CNC via Serial on", s.Port)

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
			continue
			log.Println("❌ Serial read error:", err)
			s.handleDisconnect() // Handles automatic reconnection
			return
		}

		cleanLine := line[:len(line)-1] // Trim newline
		log.Println("📥 Received:", cleanLine)

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
		log.Println("⚠️ Attempted to send, but serial port is disconnected.")
		if s.OnConnection != nil {
			s.OnConnection(false)
		}
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
		log.Println("⚠️ Attempted to send raw data, but serial port is disconnected.")
		if s.OnConnection != nil {
			s.OnConnection(false)
		}
		return errors.New("serial port not connected")
	}

	_, err := s.serialPort.Write(msg)
	return err
}

// handleDisconnect handles connection loss and retries connection
func (s *SerialProvider) handleDisconnect() {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Println("🔌 Serial connection lost. Attempting to reconnect...")

	s.isConnected = false
	if s.OnConnection != nil {
		s.OnConnection(false)
	}

	// Close the port if open
	if s.serialPort != nil {
		s.serialPort.Close()
		s.serialPort = nil
	}

	// Continuous reconnect loop
	go func() {
		for !s.isConnected {
			log.Println("🔄 Reconnecting to serial port...")
			err := s.Connect()
			if err == nil {
				log.Println("✅ Reconnected successfully!")
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
		log.Println("🔌 Closing serial connection...")
		s.serialPort.Close()
		s.serialPort = nil
		s.isConnected = false
		if s.OnConnection != nil {
			s.OnConnection(false)
		}
	}
}

// IsConnected returns the connection status
func (s *SerialProvider) IsConnected() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.isConnected
}

// package provider

// import (
// 	"bufio"
// 	"errors"
// 	"fmt"
// 	"log"

// 	"github.com/tarm/serial"
// )

// // SerialProvider communicates with a CNC machine over a Serial (USB/UART) connection
// type SerialProvider struct {
// 	Port         string
// 	BaudRate     int
// 	isConnected  bool
// 	serialPort   *serial.Port
// 	OnData       func(string)
// 	OnConnection func(bool)
// }

// func (w *SerialProvider) SetOnData(f func(string)) {
// 	w.OnData = f
// }

// func (w *SerialProvider) SetOnConnection(f func(bool)) {
// 	w.OnConnection = f
// }

// // NewSerialProvider creates a new instance of SerialProvider
// func NewSerialProvider(port string, baudRate int) *SerialProvider {
// 	log.Println("🔗 Using WebSocket Provider...")
// 	return &SerialProvider{
// 		Port:     port,
// 		BaudRate: baudRate,
// 	}
// }

// // Connect establishes a serial connection
// func (s *SerialProvider) Connect() error {
// 	config := &serial.Config{
// 		Name: s.Port,
// 		Baud: s.BaudRate,
// 		// ReadTimeout: time.Second * 2,
// 		// ReadTimeout: time.Millisecond * 500,
// 		Size:     8,
// 		Parity:   serial.ParityNone,
// 		StopBits: serial.Stop1,
// 	}
// 	port, err := serial.OpenPort(config)
// 	if err != nil {
// 		return fmt.Errorf("failed to open serial port: %w", err)
// 	}

// 	s.serialPort = port
// 	s.isConnected = true
// 	s.OnConnection(s.isConnected)
// 	log.Println("✅ Connected to CNC via Serial on", s.Port)

// 	// Start reading serial data
// 	go s.listen()
// 	return nil
// }

// func (s *SerialProvider) listen() {
// 	scanner := bufio.NewScanner(s.serialPort)
// 	for scanner.Scan() {
// 		cleanLine := scanner.Text()
// 		log.Println("📥 Complete Line Received:", cleanLine)

// 		if s.OnData != nil {
// 			s.OnData(cleanLine) // Fire OnData with complete line
// 		}
// 	}

// 	if scanner.Err() != nil {
// 		log.Println("❌ Serial read error:", scanner.Err())
// 	}
// }

// // Send sends a command over Serial
// func (s *SerialProvider) Send(msg string) error {
// 	if s.serialPort == nil || !s.isConnected {
// 		s.OnConnection(s.isConnected)
// 		return errors.New("serial port not connected")
// 	}

// 	_, err := s.serialPort.Write([]byte(msg + "\n"))
// 	return err
// }

// // Send sends a command over Serial
// func (s *SerialProvider) SendRaw(msg []byte) error {
// 	if s.serialPort == nil || !s.isConnected {
// 		s.OnConnection(s.isConnected)
// 		return errors.New("serial port not connected")
// 	}

// 	_, err := s.serialPort.Write(msg)
// 	return err
// }

// // Disconnect closes the Serial connection
// func (s *SerialProvider) Disconnect() {
// 	if s.serialPort != nil {
// 		s.serialPort.Close()
// 		s.serialPort = nil
// 		s.isConnected = false
// 		s.OnConnection(s.isConnected)
// 		log.Println("🔌 Serial connection closed")
// 	}
// }

// // IsConnected returns the connection status
// func (s *SerialProvider) IsConnected() bool {
// 	return s.isConnected
// }
