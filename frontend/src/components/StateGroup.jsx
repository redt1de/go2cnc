import React, { useEffect, useState } from "react";
import styles from "./css/StateGroup.module.css";
import { useWebSocket } from "../websocket/WebSocketProvider";

export default function StateGroup() {
    const { consoleMessages, status, sendCommand } = useWebSocket();
    const [infoMessage, setInfoMessage] = useState("");

    // ✅ Ensure gState is always a valid string
    const gState = status?.state || "unknown";

    // ✅ Determine the state class for background color
    const getStateClass = () => {
        const stateMap = {
            idle: styles.idle,
            run: styles.running,
            hold: styles.hold,
            home: styles.home,
            alarm: `${styles.alarm} ${styles.flashing}`, // Flashing effect
            check: styles.check,
            door: styles.door
        };
        return stateMap[gState.toLowerCase()] || styles.idle; // Defaults to "idle"
    };

    // ✅ Extract  messages from console output
    useEffect(() => {
        const lastMessage = consoleMessages.find(
            (msg) => msg.startsWith("[MSG:") || msg.startsWith("[DBG:")
        );

        if (lastMessage) {
            setInfoMessage(
                lastMessage.replace(/\[(MSG|DBG):/, "").replace("]", "")
            );
        }
    }, [consoleMessages]);


    return (
        <div className={styles.stateContainer}>
            <label className={styles.stateLabel} htmlFor="state">State:</label>
            <label className={`${styles.state} ${getStateClass()}`} id="state">
                {gState.toUpperCase()}
            </label>

            <label className={styles.infoLabel} htmlFor="info">Msg:</label>
            <label className={styles.info} id="info">
                {infoMessage || ""}
            </label>
        </div>
    );
}

