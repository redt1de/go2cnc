package logme

import (
	"fmt"
	"log"
	"runtime"
	"strings"
)

var Log *logMe

type logMe struct {
	Level int
}

const (
	ERROR = 0
	INFO  = 1
	DEBUG = 2
	TRACE = 3
)

const (
	colorNone   = "\033[0m"
	colorRed    = "\033[0;31m"
	colorGreen  = "\033[0;32m"
	colorYellow = "\033[0;33m"
	colorBlue   = "\033[0;34m"
	colorPurple = "\033[0;35m"
	colorCyan   = "\033[0;36m"
	colorWhite  = "\033[0;37m"
	colorGray   = "\033[0;90m"
)

const (
	MsgWarn    = colorYellow + "⚠️  [WARN] " + colorNone
	MsgError   = colorRed + "❌ [ERROR] " + colorNone
	MsgFatal   = colorRed + "❌ [FATAL] " + colorNone
	MsgDebug   = colorCyan + "🔧 [DEBUG] " + colorNone
	MsgSuccess = colorGreen + "✅ [SUCCESS] " + colorNone
)

func NewLogger(level int) *logMe {

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
		Level: logLevel,
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
	log.Println("🔧 [TRACE]", message+getCaller())

}

func (l *logMe) Debug(message string) {
	if l.Level < DEBUG {
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
				return " (FRONTEND)"
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
