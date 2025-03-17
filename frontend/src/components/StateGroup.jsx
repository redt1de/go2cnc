import React, { useEffect, useState } from "react";
import styles from "./css/StateGroup.module.css";
import { useCNC } from '../context/CNCContext';

export default function StateGroup() {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();
    const [infoMessage, setInfoMessage] = useState("");

    // ✅ Ensure gState is always a valid string
    const gState = status?.activeState || "unknown";
    // console.log("gState:", gState); // Debugging

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
    // useEffect(() => {
    //     const lastMessage = consoleMessages.find(
    //         (msg) => msg.filter(msg => typeof msg === "string")
    //             .startsWith("[MSG:") || msg.startsWith("[DBG:")
    //     );

    //     if (lastMessage) {
    //         setInfoMessage(
    //             lastMessage.replace(/\[(MSG|DBG):/, "").replace("]", "")
    //         );
    //     }
    // }, [consoleMessages]);

    useEffect(() => {
        console.log("consoleMessages:", consoleMessages); // Debugging

        const lastMessage = consoleMessages
            .filter(msg => typeof msg === "string") // ✅ Ensure only strings
            .find(msg => msg.startsWith("[MSG:") || msg.startsWith("[DBG:"));

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

