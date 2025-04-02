package fluidnc

import (
	"context"
	"errors"
	"go2cnc/pkg/cnc/fileman"
	"go2cnc/pkg/cnc/parsers/grbl"
	"go2cnc/pkg/cnc/providers"
	"go2cnc/pkg/cnc/providers/websocket"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/logme"
	"strings"
	"sync"
	"time"
)

type FluidNC struct {
	provider  providers.Provider
	sendMu    sync.Mutex
	waitMu    sync.Mutex
	waitQueue []*waitEntry
	ctx       context.Context
	cancel    context.CancelFunc
	Fs        fileman.FileManager

	state        *state.State
	onMessage    func(msg string)
	onConnection func(iscon bool)
	onUpdate     func(status *state.State)
	onProbe      func(pr []state.ProbeResult)

	connected bool
}

type FluidNCConfig struct {
	Websocket *websocket.WebSocketConfig `json:"websocket,omitempty" yaml:"websocket,omitempty"`
	// Serial    *SerialConfig    `json:"serial,omitempty" yaml:"serial,omitempty"` // TODO
	ApiUrl   string `json:"api_url" yaml:"api_url"`
	DevProxy string `json:"devProxy" yaml:"dev_proxy"`
}

type waitEntry struct {
	ch     chan string
	buffer []string
	done   bool
}

func NewFluidNcController(cfg FluidNCConfig) *FluidNC {
	var provider providers.Provider

	if cfg.Websocket != nil {
		provider = websocket.NewWebSocketProvider(cfg.Websocket)
		// } else if cfg.Serial != nil {
		// provider := serial.New(cfg.FluidNC.Serial)
	}

	var fs *FluidNCFileManager
	if cfg.ApiUrl != "" {
		fs = NewFluidNCFileManager(cfg.ApiUrl)
	} else {
		fs = nil
	}

	f := &FluidNC{
		provider:     provider,
		state:        state.NewState(),
		onMessage:    func(msg string) {},
		onConnection: func(bool) {},
		onUpdate:     func(*state.State) {},
		onProbe:      func([]state.ProbeResult) {},
		connected:    false,
		waitQueue:    []*waitEntry{},
		Fs:           fs,
	}

	provider.SetReceiveHandler(func(data []byte) {
		f.handleMessage(string(data), (len(f.waitQueue) > 0))
	})

	f.ctx, f.cancel = context.WithCancel(context.Background())
	return f
}

func (f *FluidNC) Connect() {
	f.provider.Connect()

	for {
		if f.provider.IsConnected() {
			break
		}
		time.Sleep(1 * time.Second)
	}

	f.connected = true
	f.onConnection(true)

	f.SendAsync("$G")
	f.SendAsync("$#")
	f.SendAsync("?")
	f.SendAsync("$Report/Interval=500")
}

func (f *FluidNC) IsConnected() bool {
	return f.connected && f.provider.IsConnected()
}

func (f *FluidNC) GetState() *state.State {
	return f.state
}

func (f *FluidNC) FileManager() fileman.FileManager {
	return f.Fs
}

func (f *FluidNC) OnMessage(handler func(msg string))               { f.onMessage = handler }
func (f *FluidNC) OnConnection(handler func(iscon bool))            { f.onConnection = handler }
func (f *FluidNC) OnUpdate(handler func(status *state.State))       { f.onUpdate = handler }
func (f *FluidNC) OnProbe(handler func(result []state.ProbeResult)) { f.onProbe = handler }

func (f *FluidNC) SendAsync(msg string) {
	logme.Debug("SendAsync: ", strings.TrimSpace(msg))
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}
	f.sendMu.Lock()
	defer f.sendMu.Unlock()

	err := f.provider.Send([]byte(msg))
	if err != nil {
		logme.Error("SendAsyncRaw: ", err)
	}
}

func (f *FluidNC) SendAsyncRaw(msg []byte) {
	f.sendMu.Lock()
	defer f.sendMu.Unlock()
	err := f.provider.Send(msg)
	if err != nil {
		logme.Error("SendAsyncRaw: ", err)
	}
}

func (f *FluidNC) SendWait(msg string) ([]string, error) {
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}

	entry := &waitEntry{
		ch: make(chan string, 10),
	}

	f.waitMu.Lock()
	f.waitQueue = append(f.waitQueue, entry)
	f.waitMu.Unlock()

	err := f.provider.Send([]byte(msg))
	if err != nil {
		return nil, err
	}

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
		}
	}
}

func (f *FluidNC) handleMessage(msg string, silent bool) {
	didChange, section := grbl.ParseGrblData(msg, f.state)
	// if didChange {
	// 	if section == grbl.CHANGE_PROBE_RESULT {
	// 		f.onProbe(f.state.ProbeHistory)
	// 		f.onUpdate(f.state)
	// 	} else if section != grbl.CHANGE_NONE {
	// 		f.onUpdate(f.state)
	// 	}
	// }
	if didChange {
		if section == grbl.CHANGE_PROBE_RESULT {
			f.onProbe(f.state.ProbeHistory)
			f.onUpdate(f.state)
		}
		if section != grbl.CHANGE_NONE && section != grbl.CHANGE_PROBE_RESULT {
			f.onUpdate(f.state)
		}
	}

	text := strings.TrimSpace(string(msg))
	msg = text
	if !silent {
		f.onMessage(msg)
	}

	f.waitMu.Lock()
	if len(f.waitQueue) > 0 {
		entry := f.waitQueue[0]
		entry.ch <- msg

		if msg == "ok" || strings.HasPrefix(msg, "error:") {
			f.waitQueue = f.waitQueue[1:]
		}
	}
	f.waitMu.Unlock()
}
