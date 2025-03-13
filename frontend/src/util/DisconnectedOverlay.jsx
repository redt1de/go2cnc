import React, { useContext } from "react";
import styles from "./css/DisconnectedOverlay.module.css";
import { useWebSocket } from "../websocket/WebSocketProvider";

export default function DisconnectedOverlay() {
    const { consoleMessages, status, sendCommand } = useWebSocket();
    const isConnected = true; // TODO: Implement connection status


    if (isConnected) {
        return null; // ✅ Do not show if connected
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.messageBox}>
                <h2>Please check your CNC connection.</h2>
            </div>
        </div>
    );
}
