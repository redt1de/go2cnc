import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// Create WebSocket Context
const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [cncStatus, setCncStatus] = useState({});
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    const socketRef = useRef(null);

    useEffect(() => {
        const connectWebSocket = () => {
            socketRef.current = new WebSocket("ws://localhost:8080/ws");

            socketRef.current.onopen = () => {
                console.log("✅ WebSocket connected");
            };

            socketRef.current.onmessage = (event) => {
                try {
                    const { event: eventType, data } = JSON.parse(event.data);

                    switch (eventType) {
                        case "console":
                            setConsoleMessages((prev) => [...prev, data]); // Append message
                            break;
                        case "status":
                            setCncStatus(data); // Update status
                            break;
                        case "error":
                            console.error("⚠️ CNC Error:", data);
                            break;
                        case "connection":
                            setConnectionStatus(data); // Update connection state
                            break;
                        default:
                            console.warn("⚠️ Unknown WebSocket event:", eventType);
                    }
                } catch (error) {
                    console.error("❌ Error parsing WebSocket message:", error);
                }
            };

            socketRef.current.onclose = () => {
                console.log("❌ WebSocket disconnected. Reconnecting in 3s...");
                setTimeout(connectWebSocket, 3000);
            };

            socketRef.current.onerror = (error) => {
                console.log("⚠️ WebSocket error:", error);
            };
        };

        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    // ✅ Function to send a command to the CNC machine
    const sendCommand = (command) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(command);
            console.log("📤 Sent command:", command);
        } else {
            console.log("⚠️ Cannot send, WebSocket not connected");
        }
    };

    const sendRaw = (command) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(command);
            console.log("📤 Sent command:", command);
        } else {
            console.log("⚠️ Cannot send, WebSocket not connected");
        }
    };

    return (
        <WebSocketContext.Provider value={{ cncStatus, consoleMessages, connectionStatus, sendCommand }}>
            {children}
        </WebSocketContext.Provider>
    );
};
