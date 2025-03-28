import React from "react";
import styles from "./css/WCSModal.module.css"; // Reuse existing modal styles
import { useCNC } from "../context/CNCContext";

export default function WCSModal({ onClose }) {
    const { status, sendAsync } = useCNC();

    const currentWCS = status?.wcs || 54; // Default to G54

    const handleSelectWCS = (wcs) => {
        sendAsync(`G${wcs}`);
        onClose();
    };

    const wcsList = [54, 55, 56, 57, 58, 59];

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h3>Select Coordinate System</h3>

                <div className={styles.buttons}>
                    {wcsList.map((wcs) => (
                        <button
                            key={wcs}
                            className={styles.btn}
                            style={{
                                background: currentWCS === wcs ? "#0a0" : undefined
                            }}
                            onClick={() => handleSelectWCS(wcs)}
                        >
                            G{wcs}
                        </button>
                    ))}
                </div>

                <button className={styles.done} onClick={onClose}>Done</button>
            </div>
        </div>
    );
}
