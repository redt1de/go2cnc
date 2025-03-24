import React, { useContext } from "react";
import styles from "./css/DisconnectedOverlay.module.css";
import { useCNC } from "../context/CNCContext";

export default function DisconnectedOverlay() {
    const { isConnected } = useCNC();



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
