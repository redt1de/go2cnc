import React, { useEffect, useState } from "react";
import styles from "./css/StateGroup.module.css";
import { useCNC } from '../context/CNCContext';
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function StateGroup() {
    const { consoleMessages, status, sendAsync } = useCNC();
    const [infoMessage, setInfoMessage] = useState("");

    // ✅ Ensure gState is always a valid string
    const gState = status?.activeState || "unknown";
    // LogDebug("gState:", gState); // Debugging

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


    useEffect(() => {
        // LogDebug("consoleMessages:", consoleMessages); // Debugging

        const lastMessage = consoleMessages
            .slice() // Copy array to avoid mutating state
            .reverse() // ✅ Reverse the array to start from the last element
            .map(msg => String(msg)) // ✅ Ensure all messages are strings
            .find(msg => msg.startsWith("[MSG:") || msg.startsWith("[DBG:")); // ✅ Get the latest message

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

            {/* <label className={styles.infoLabel} htmlFor="info">Msg:</label> */}
            <label className={styles.info} id="info">
                {infoMessage || ""}
            </label>
            {/* ----------------------------------------- */}
            {(true || status?.job?.active) && (
                < div className={styles.progressContainer}>
                    <div className={styles.progressBar}>

                        <div
                            className={styles.progressFill}
                            style={{ width: `${status?.job?.progress}%` }}
                        />
                        <span className={styles.progressText}>
                            {status?.job?.path?.split("/").pop() || "No File"}
                        </span>

                    </div>
                </div>

            )
            }


        </div >
    );
}

