package logme

import (
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"strings"
)

var Log *logMe

type logMe struct {
	Level   int
	LogFile string
}

const (
	ERROR = 0
	INFO  = 1
	DEBUG = 2
	TRACE = 3
)

const (
	colorNone    = "\033[0m"
	colorRed     = "\033[0;31m"
	colorGreen   = "\033[0;32m"
	colorYellow  = "\033[0;33m"
	colorBlue    = "\033[0;34m"
	colorPurple  = "\033[0;35m"
	colorCyan    = "\033[0;36m"
	colorWhite   = "\033[0;37m"
	colorGray    = "\033[0;90m"
	colorMagenta = "\033[0;95m"
)

const (
	MsgWarn    = colorYellow + "⚠️  [WARN] " + colorNone
	MsgError   = colorRed + "❌ [ERROR] " + colorNone
	MsgFatal   = colorRed + "❌ [FATAL] " + colorNone
	MsgDebug   = colorCyan + "🔧 [DEBUG] " + colorNone
	MsgSuccess = colorGreen + "✅ [SUCCESS] " + colorNone
)

func (l *logMe) logRotate() {
	// Target path: lLogFile.2
	log2 := l.LogFile + ".2"

	// Delete .2 if it exists
	if _, err := os.Stat(log2); err == nil {
		if err := os.Remove(log2); err != nil {
			fmt.Printf("Failed to delete old log: %v\n", err)
		}
	}

	// Rename current log file to .2, if it exists
	if _, err := os.Stat(l.LogFile); err == nil {
		if err := os.Rename(l.LogFile, log2); err != nil {
			fmt.Printf("Failed to rotate log to .2: %v\n", err)
		}
	}
}

func (l *logMe) initLogFile() {
	l.logRotate()
	// Open log file for writing
	lf, err := os.OpenFile(l.LogFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}

	// Write to both stdout and the file
	mw := io.MultiWriter(os.Stdout, lf)
	log.SetOutput(mw)
}

func NewLogger(level int, logfile string) *logMe {
	logLevel := ERROR
	if level > 0 {
		logLevel = INFO
	}
	if level > 1 {
		logLevel = DEBUG
	}
	if level > 2 {
		logLevel = TRACE
	}

	Log = &logMe{
		Level:   logLevel,
		LogFile: logfile,
	}
	if logfile != "" {
		Log.initLogFile()
	}
	return Log
}

func (l *logMe) Print(message string) {
	log.Println(message)

}

func (l *logMe) Success(message string) {
	log.Println(MsgSuccess + message + getCaller())

}

func (l *logMe) Println(message string) {
	log.Println(message + getCaller())

}

func (l *logMe) Trace(message string) {
	if l.Level < TRACE {
		return
	}
	if strings.Contains(message, "listeners") {
		return
	}
	message = strings.TrimSpace(message)
	log.Println("🔧 [TRACE]", message+getCaller())

}

func (l *logMe) Debug(message string) {
	if l.Level < DEBUG {
		return
	}
	if strings.Contains(message, "AssetHandler") {
		return
	}
	log.Println(MsgDebug, message+getCaller())
}

func (l *logMe) Info(message string) {
	if l.Level < INFO {
		return
	}
	log.Println("🔍 [INFO]", message+getCaller())
}

func (l *logMe) Warning(message string) {
	if l.Level < INFO {
		return
	}
	log.Println(MsgWarn, message+getCaller())
}

func (l *logMe) Error(message string) {

	log.Println(MsgError, message+getCaller())
}

func (l *logMe) Fatal(message string) {

	log.Println(MsgFatal, message+getCaller())
}

func Trace(a ...any)   { Log.Trace(fmt.Sprint(a...)) }
func Debug(a ...any)   { Log.Debug(fmt.Sprint(a...)) }
func Info(a ...any)    { Log.Info(fmt.Sprint(a...)) }
func Warning(a ...any) { Log.Warning(fmt.Sprint(a...)) }
func Error(a ...any)   { Log.Error(fmt.Sprint(a...)) }
func Fatal(a ...any)   { Log.Fatal(fmt.Sprint(a...)) }
func Println(a ...any) { Log.Println(fmt.Sprint(a...)) }
func Success(a ...any) { Log.Success(fmt.Sprint(a...)) }

// ---------------------------------------

func getCaller() string {
	if Log.Level < DEBUG {
		return ""
	}
	skip := 2
	const maxDepth = 10
	pc := make([]uintptr, maxDepth)
	n := runtime.Callers(skip, pc) // Skip frames to ignore runtime.Callers and PrintCallStack
	frames := runtime.CallersFrames(pc[:n])

	for i := 0; ; i++ {
		frame, more := frames.Next()
		if !strings.Contains(frame.File, "log") {
			if strings.HasSuffix(frame.File, "dispatcher/dispatcher.go") {
				return fmt.Sprintf(" %s(FRONTEND)%s", colorMagenta, colorNone) //" (FRONTEND)"
			}
			return fmt.Sprintf(" %s(%s:%d)%s", colorGray, trimPath(frame.File), frame.Line, colorNone)
		}
		// fmt.Println(trimPath(frame.File))
		if !more {
			break
		}
	}
	return "???:??? "
}

func trimPath(path string) string {
	parts := strings.Split(path, "/")
	if len(parts) > 2 {
		return strings.Join(parts[len(parts)-2:], "/")
	}
	return path
}
