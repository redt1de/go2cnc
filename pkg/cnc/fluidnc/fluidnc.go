package fluidnc

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"go2cnc/pkg/cnc/grbl"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/logme"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type FluidNC struct {
	conn      *websocket.Conn
	sendMu    sync.Mutex
	waitMu    sync.Mutex
	waitQueue []*waitEntry
	ctx       context.Context
	cancel    context.CancelFunc

	state        *state.State // stores the current machine state and postion data
	ApiUrl       string       // URL for the web api
	WsUrl        string       // websocket url
	connected    bool
	onMessage    func(msg string)
	onConnection func(iscon bool)
	onUpdate     func(status *state.State)
	onProbe      func(pr []state.ProbeResult)
}

type FluidNCConfig struct {
	ApiUrl string `json:"api_url" yaml:"api_url"`
	WsUrl  string `json:"ws_url" yaml:"ws_url"`
}

type waitEntry struct {
	ch     chan string
	buffer []string
	done   bool
}

func NewFluidNcController(cfg FluidNCConfig) *FluidNC {
	ret := FluidNC{
		state:     state.NewState(),
		ApiUrl:    cfg.ApiUrl,
		WsUrl:     cfg.WsUrl,
		connected: false,

		onMessage:    func(msg string) { logme.Warning("Default OnMessage handler: " + msg) },
		onConnection: func(iscon bool) { logme.Warning(fmt.Sprintf("Default OnConnection handler: %v", iscon)) },
		onUpdate:     func(status *state.State) { logme.Warning("Default OnUpdate handler") },
		onProbe:      func(pr []state.ProbeResult) { logme.Warning("Default OnProbe handler") },
	}
	return &ret
}

// ------------------------- Callbacks -----------------------
// whenever output is received from the CNC controllers websocket connection

func (f *FluidNC) OnMessage(handler func(msg string)) {
	f.onMessage = handler
}

func (f *FluidNC) handleMessage(msg string) {
	didChange, section := grbl.ParseGrblData(msg, f.state)
	// logme.Debug("handle message: ", didChange, section)
	if didChange {
		if section == grbl.CHANGE_PROBE_RESULT {

			f.onProbe(f.state.ProbeHistory)
			f.onUpdate(f.state)
		}
		if section != grbl.CHANGE_NONE && section != grbl.CHANGE_PROBE_RESULT {
			f.onUpdate(f.state)
		}
	}

	// TODO: fluidnc specific parser

	f.onMessage(msg)
}

// called when the websocket connects or disconnects
func (f *FluidNC) OnConnection(handler func(iscon bool)) {
	f.onConnection = handler
}

// called whenever f.state is changed, frontend will update the UI
func (f *FluidNC) OnUpdate(handler func(status *state.State)) {
	f.onUpdate = handler
}

// called whenever a probe is completed
func (f *FluidNC) OnProbe(handler func(result []state.ProbeResult)) {
	f.onProbe = handler
}

// ------------------------- Getters -----------------------
func (f *FluidNC) GetState() *state.State {
	return f.state
}

func (f *FluidNC) IsConnected() bool {
	return f.connected
}

func (f *FluidNC) ClearProbeHistory() {
	f.state.ClearProbeHistory()
	f.onProbe(f.state.ProbeHistory)
}

func (f *FluidNC) GetProbeHistory() []state.ProbeResult {
	return f.state.ProbeHistory
}

// ------------------------- Methods -----------------------

func (f *FluidNC) SendAsync(msg string) {
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}
	f.sendMu.Lock()
	defer f.sendMu.Unlock()

	logme.Debug("SendAsync: " + strings.TrimSpace(msg))
	if f.conn != nil {
		_ = f.conn.WriteMessage(websocket.TextMessage, []byte(msg))
	}
}

func (f *FluidNC) SendAsyncRaw(msg []byte) {
	f.sendMu.Lock()
	defer f.sendMu.Unlock()

	logme.Debug(fmt.Sprintf("SendAsyncRaw: 0x%x", msg))
	if f.conn != nil {
		_ = f.conn.WriteMessage(websocket.TextMessage, msg)
	}
}

// //////////////////////////////////////////////////////////////////////////////
func (f *FluidNC) SendWait(msg string) ([]string, error) {
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}

	logme.Debug("SendWait: " + strings.TrimSpace(msg))

	entry := &waitEntry{
		ch: make(chan string, 10), // buffered to prevent blocking
	}

	f.waitMu.Lock()
	f.waitQueue = append(f.waitQueue, entry)
	f.waitMu.Unlock()

	f.sendMu.Lock()
	err := f.conn.WriteMessage(websocket.TextMessage, []byte(msg))
	f.sendMu.Unlock()
	if err != nil {
		return nil, err
	}

	// timeout := time.After(3 * time.Second)
	for {
		select {
		case line := <-entry.ch:
			entry.buffer = append(entry.buffer, line)
			if line == "ok" {
				return entry.buffer, nil
			}
			if strings.HasPrefix(line, "error:") {
				return entry.buffer, errors.New(line)
			}
			// case <-timeout:
			// 	return entry.buffer, errors.New("timeout waiting for response")
		}
	}
}

// ------------------------------------------------------------
func (f *FluidNC) TestFunc() {
	// read file
	dataset, err := readLines("test_data.txt")
	if err != nil {
		logme.Error("TestFunc -> error reading file:", err)
		return
	}

	logme.Debug("FluidNC TestFunc...")
	go func() {
		for _, line := range dataset {
			if line == "DELAY" {
				logme.Debug("Delaying...")
				time.Sleep(3 * time.Second)
				continue
			}
			// logme.Debug("to onmessage: ", line)
			f.handleMessage(line)
		}
	}()

}

func readLines(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}
