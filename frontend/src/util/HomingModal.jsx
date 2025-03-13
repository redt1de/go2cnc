import React, { useState } from "react";
import styles from "./css/HomingModal.module.css";

/**
 * HomingModal Props:
 * - onOk(command: string): Called when user confirms selection
 * - onCancel(): Called when user cancels
 */
export default function HomingModal({ onOk, onCancel }) {
    const [selectedAxes, setSelectedAxes] = useState([]);

    // ✅ Toggle axis selection
    const toggleAxis = (axis) => {
        setSelectedAxes((prev) =>
            prev.includes(axis)
                ? prev.filter((a) => a !== axis) // Remove if already selected
                : [...prev, axis] // Add if not selected
        );
    };

    // ✅ Handle immediate homing with "All" button
    const homeAll = () => {
        onOk("$H"); // ✅ Immediately send homing command
    };

    // ✅ Handle OK button
    const handleOk = () => {
        const command = selectedAxes.length > 0 ? `$H${selectedAxes.join("")}` : "$H";
        onOk(command);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalBox}>
                <div className={styles.title}>Select Axes to Home</div>

                <div className={styles.buttonGroup}>
                    {["X", "Y", "Z"].map((axis) => (
                        <button
                            key={axis}
                            className={`${styles.axisButton} ${selectedAxes.includes(axis) ? styles.selected : ""}`}
                            onClick={() => toggleAxis(axis)}
                        >
                            {axis}
                        </button>
                    ))}
                    <button className={styles.allButton} onClick={homeAll}>
                        All
                    </button>
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Cancel
                    </button>
                    <button className={styles.okButton} onClick={handleOk} disabled={selectedAxes.length === 0}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
