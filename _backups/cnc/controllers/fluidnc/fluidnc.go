package fluidnc

import (
	"context"
	"errors"
	"fmt"
	"go2cnc/pkg/cnc/parsers/grbl"
	"go2cnc/pkg/cnc/state"
	"go2cnc/pkg/logme"
	"go2cnc/pkg/util"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type FluidNC struct {
	conn       *websocket.Conn
	sendMu     sync.Mutex
	waitMu     sync.Mutex
	waitQueue  []*waitEntry
	ctx        context.Context
	cancel     context.CancelFunc
	httpClient *http.Client

	state        *state.State // stores the current machine state and postion data
	ApiUrl       string       // URL for the web api
	WsUrl        string       // websocket url
	connected    bool
	onMessage    func(msg string)
	onConnection func(iscon bool)
	onUpdate     func(status *state.State)
	onProbe      func(pr []state.ProbeResult)
	// TODO add onError,onAck,onAlarm events? may be useful for streaming
}

type FluidNCConfig struct {
	ApiUrl   string `json:"api_url" yaml:"api_url"`
	WsUrl    string `json:"ws_url" yaml:"ws_url"`
	DevProxy string `json:"devProxy" yaml:"dev_proxy"`
}

type waitEntry struct {
	ch     chan string
	buffer []string
	done   bool
}

func withDevProxy(u string) *http.Client {
	proxyStr := u

	proxyURL, err := url.Parse(proxyStr)
	if err != nil {
		logme.Fatal("Error parsing proxy URL:", err)
		return nil
	}

	transport := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
	}

	logme.Warning("Using dev proxy: ", proxyStr)

	return &http.Client{
		Transport: transport,
	}

}
func withDefaultClient() *http.Client {
	return &http.Client{
		Timeout: 10 * time.Second,
	}
}

func NewFluidNcController(cfg FluidNCConfig) *FluidNC {
	var cl *http.Client
	if cfg.DevProxy != "" {
		cl = withDevProxy(cfg.DevProxy)
	} else {
		cl = withDefaultClient()
	}
	ret := FluidNC{
		state:      state.NewState(),
		ApiUrl:     cfg.ApiUrl,
		WsUrl:      cfg.WsUrl,
		connected:  false,
		httpClient: cl,
		// httpClient: withDefaultClient(),

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

func (f *FluidNC) handleMessage(msg string, silent bool) {
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

	if !silent {
		f.onMessage(msg)
	}
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

func (f *FluidNC) GetLastProbe() state.ProbeResult {
	return f.state.ProbeHistory[len(f.state.ProbeHistory)-1]
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
var testBool = true

func (f *FluidNC) TestSender() {
	dataset, err := util.ReadLines("test_data.out.txt")
	if err != nil {
		logme.Error("TestFunc -> error reading file:", err)
		return
	}
	for _, line := range dataset {
		switch line {
		case "DELAY":
			time.Sleep(1 * time.Second)
			continue
		case "FAKEPROBE":
			x := util.GenerateRandomPosition()
			y := util.GenerateRandomPosition()
			z := util.GenerateRandomPosition()

			f.handleMessage(fmt.Sprintf("[PRB:%.3f,%.3f,%.3f:1]", x, y, z), false)
			continue
		}

		// logme.Debug("to onmessage: ", line)
		f.SendAsync(line)
	}
}

func (f *FluidNC) TestIngest() {
	// read file
	dataset, err := util.ReadLines("test_data.in.txt")
	if err != nil {
		logme.Error("TestFunc -> error reading file:", err)
		return
	}

	logme.Debug("FluidNC TestFunc...")
	go func() {
		for _, line := range dataset {
			switch line {
			case "DELAY":
				time.Sleep(1 * time.Second)
				continue
			case "FAKEPROBE":
				x := util.GenerateRandomPosition()
				y := util.GenerateRandomPosition()
				z := util.GenerateRandomPosition()

				f.handleMessage(fmt.Sprintf("[PRB:%.3f,%.3f,%.3f:1]", x, y, z), false)
				continue
			}

			// logme.Debug("to onmessage: ", line)
			f.handleMessage(line, false)
		}
	}()

}

// func randFloat(min, max float64, n int) float64 {
// 	// Seed the random number generator to ensure different results each time
// 	rand.Seed(time.Now().UnixNano())
// 	return min + rand.Float64()*(max-min)
// }
