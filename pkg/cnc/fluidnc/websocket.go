package fluidnc

import (
	"context"
	"go2cnc/pkg/logme"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

func (f *FluidNC) Connect() {
	f.ctx, f.cancel = context.WithCancel(context.Background())
	go f.connectLoop()
}

func (f *FluidNC) internalOnConnection(iscon bool) {
	f.setConnected(iscon)
	f.onConnection(iscon)
	if iscon { // force inital update
		// f.SendAsync("?")
		// f.SendAsync("$#")
		// f.SendAsync("$G")
		f.SendAsync("$Report/Interval=500")
	}
}

func (f *FluidNC) connectLoop() {
	for {
		select {
		case <-f.ctx.Done():
			return
		default:
			logme.Debug("Dialing to WebSocket...")
			conn, _, err := websocket.DefaultDialer.Dial(f.WsUrl, nil)
			if err != nil {
				logme.Error("WebSocket connection failed:", err)
				time.Sleep(5 * time.Second)
				continue
			}

			f.conn = conn
			f.internalOnConnection(true)

			f.readLoop()

			f.internalOnConnection(false)

			time.Sleep(2 * time.Second)
		}
	}
}

func (f *FluidNC) setConnected(val bool) {
	f.connected = val
}

func (f *FluidNC) readLoop() {
	for {
		_, msg, err := f.conn.ReadMessage()
		if err != nil {
			logme.Error("WebSocket read error:", err)
			return
		}

		text := strings.TrimSpace(string(msg))

		if strings.HasPrefix(text, "PING:") || strings.HasPrefix(text, "ACTIVE_ID:") || strings.HasPrefix(text, "CURRENT_ID:") {
			continue
		}

		f.handleMessage(text)

		f.waitMu.Lock()
		if len(f.waitQueue) > 0 {
			entry := f.waitQueue[0]
			entry.ch <- text

			if text == "ok" || strings.HasPrefix(text, "error:") {
				// Command response is complete
				f.waitQueue = f.waitQueue[1:]
			}
		}
		f.waitMu.Unlock()
	}
}
