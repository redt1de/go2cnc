import { BaseProvider } from "./BaseProvider";

export class WebSocketProvider extends BaseProvider {
    constructor(options, onUpdate, onData) {
        super(onData);
        this.options = options;
        this.onUpdate = onUpdate;
        this.socket = null;
        this.isConnected = false;
        this.reconnectTimeout = null;

        this.connect();
    }

    connect = () => {
        if (this.socket) {
            console.warn("⚠️ Already connected to WebSocket");
            return;
        }

        console.log(`🔌 Connecting to WebSocket: ws://${this.options.socketAddress}:81`);
        this.socket = new WebSocket(`ws://${this.options.socketAddress}:81`);

        this.socket.onopen = () => {
            this.isConnected = true;
            console.log("✅ WebSocket connected");
            this.onUpdate();
        };

        this.socket.onmessage = async (event) => {
            // console.log(">>>>>",event);
            if (event.data instanceof Blob) {
                event.data.text().then((text) => {
                    this.onData(text);  // ✅ Pass directly to GrblController
                });
            } else {
                this.onData(event.data);
            }
        };

        this.socket.onclose = () => {
            console.warn("🔌 WebSocket disconnected");
            this.isConnected = false;
            this.socket = null;
            this.onUpdate();
            this.scheduleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            this.socket?.close();
            this.socket = null;
        };
    };

    disconnect = () => {
        if (!this.socket) {
            console.warn("⚠️ No active connection to disconnect.");
            return;
        }

        console.log("❌ Manually disconnecting from WebSocket");
        clearTimeout(this.reconnectTimeout);
        
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
            this.socket.close();
        }

        this.socket = null;
        this.isConnected = false;
        this.onUpdate();
    };

    send = (command) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.onData(command); // ✅ Pass directly to GrblController
            this.socket.send(command + "\n");
            // this.consoleMessages.push(`➡️ ${command}`);
            console.log(`➡️ Sent to FluidNC: ${command}`);
            if (this.onUpdate) this.onUpdate();
        } else {
            console.error("❌ Cannot send command: WebSocket is not connected.");
        }
    };

    sendRaw = (data) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            
            if (typeof data === "number") {
                this.onData("Raw: 0x"+data.toString(16)); // echo back to GrblController
                this.socket.send(new Uint8Array([data]));
            } else {
                this.onData(data); // echo back to GrblController
                this.socket.send(data + "\n");
            }
    
            // this.consoleMessages.push(`➡️ Sent: ${data}`);
            this.onUpdate();
        } else {
            console.error("❌ Cannot send command: WebSocket is not connected.");
        }
    };

    scheduleReconnect = () => {
        if (this.reconnectTimeout) return; // ✅ Prevent multiple reconnect attempts

        console.log("⏳ Attempting to reconnect in 1 second...");
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, 1000);
    };
}
