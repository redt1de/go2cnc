import io from "socket.io-client";

let socket = null;
let gopt = null;
/*
options = {
    socketAddress: '127.0.0.1',
    socketPort: 8000,
    baudrate: 115200,
    controllerType: 'Grbl',
    port: '/dev/ttyUSB0',
  }
*/
// ✅ Fetch CNCjs token
async function getCncjsToken(baseUrl) {
    try {
        const response = await fetch(`${baseUrl}/api/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "", password: "" })
        });

        if (!response.ok) {
            throw new Error(`Sign-in failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.token) throw new Error("No token received from CNCjs");

        // console.log("✅ CNCjs Token:", data.token);
        return data.token;
    } catch (error) {
        console.error("❌ Error fetching CNCjs token:", error);
        return null;
    }
}

// ✅ Open CNCjs WebSocket connection
export async function openSocket(options, onMessageHandler) {
    gopt = options;
    if (socket) {
        console.warn("⚠️ CNCjs connection already exists. Closing old connection...");
        socket.disconnect();
    }

    // ✅ Fetch token
    const token = await getCncjsToken(`http://${options.socketAddress}:${options.socketPort}`);
    if (!token) {
        console.error("❌ Could not obtain a CNCjs token. Aborting connection.");
        return;
    }

    // ✅ Establish connection (no `.onAny()` in Socket.IO 2.5.0)
    socket = io(`ws://${options.socketAddress}:${options.socketPort}`, {
        path: "/socket.io",
        query: { token },
    });


    // ✅ Manually handle each CNCjs event (since `.onAny()` is unavailable)
    const events = [
        "startup",
        "config:change",
        "task:start",
        "task:finish",
        "task:error",
        "serialport:list",
        "serialport:change",
        "serialport:open",
        "serialport:close",
        "serialport:error",
        "serialport:read",
        "serialport:write",
        "gcode:load",
        "gcode:unload",
        "feeder:status",
        "sender:status",
        "workflow:state",
        "controller:settings",
        "controller:state",
        "message",
        "Grbl:state",
        "connect",
        "disconnect",
    ];

    events.forEach((event) => {
        socket.on(event, (data) => {
            if (onMessageHandler) onMessageHandler({ event, data });
        });
    });
}

// ✅ Close CNCjs connection
export function closeSocket() {
    if (socket) {
        console.log("❌ Closing CNCjs connection...");
        socket.disconnect();
        socket = null;
    } else {
        console.warn("⚠️ No active CNCjs connection to close.");
    }
}


export function openSerial(options){
    socket.emit("open", options.serialPort, {
        baudrate: Number(options.baudrate),
        controllerType: options.controllerType
    });
}

export function closeSerial(){
    socket.emit("close", gopt.serialPort);
}

// ✅ Send G-code
export function sendGcode(gcode) {
    if (!socket) {
        console.error("❌ CNCjs socket is not connected.");
        return;
    }
    console.log(`➡️ Sending G-Code: ${gcode}`);
    socket.emit("command",gopt.serialPort, "gcode", gcode);
}

// ✅ Send a raw CNCjs command (e.g., workflow commands)
export function sendCncjsCommand(command, args = []) {
    if (!socket) {
        console.error("❌ CNCjs socket is not connected.");
        return;
    }
    console.log(`➡️ Sending CNCjs Command: ${command}`, args);
    socket.emit("command",gopt.serialPort, command, ...args);
}

// ✅ Send raw serial data to the machine
export function sendRawSerial(data) {
    if (!socket) {
        console.error("❌ CNCjs socket is not connected.");
        return;
    }
    console.log(`➡️ Sending Raw Serial Data: ${data}`);
    socket.emit("writeln",gopt.serialPort, data);
}

export function checkPorts(){
    socket.emit("list");
}