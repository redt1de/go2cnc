package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"github.com/redt1de/go2cnc/backend/server"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/gorilla/websocket"
)

// Message represents WebSocket messages from the backend

func main() {
	// Connect to WebSocket server
	url := "ws://localhost:8080/ws"
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		log.Fatal("❌ Failed to connect to WebSocket:", err)
	}
	defer conn.Close()

	// Handle system interrupts (CTRL+C)
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	// Start listening for WebSocket messages
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Println("❌ WebSocket error:", err)
				return
			}

			var msg server.WebSocketEvent
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Println("⚠️ Error parsing message:", err)
				fmt.Println(string(message))
				continue
			}

			// Print received messages
			switch msg.Event {
			case "console":
				fmt.Println(msg.Data)
			case "status":
				// fmt.Println("📡 Status Update")
			default:
				fmt.Println("📥 UNKNOWN EVT:", msg.Event, msg.Data)
			}
		}
	}()

	// Start reading commands from the terminal
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("🚀 CNC Terminal Started. Type commands and press Enter.")

	for {
		fmt.Print("> ")
		scanner.Scan()
		command := strings.TrimSpace(scanner.Text())

		if command == "" {
			continue
		}

		// Handle exit
		if command == "exit" || command == "quit" {
			fmt.Println("👋 Exiting...")
			break
		}

		// Send the command over WebSocket
		err := conn.WriteMessage(websocket.TextMessage, []byte(command))
		if err != nil {
			log.Println("❌ Error sending command:", err)
			break
		}

		fmt.Println("📤 Sent:", command)
	}

	// Close WebSocket connection
	conn.Close()
}
