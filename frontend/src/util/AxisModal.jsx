import React, { useState } from "react";
import styles from "./css/AxisModal.module.css"; // ✅ Reuse existing CSS

/**
 * AxisModal Props:
 * - axes: string[] — which axes to show (e.g. ['X', 'Y', 'Z', 'A'])
 * - onOk(selectedAxes: string[]): returns an array of selected axis letters
 * - onCancel(): cancel callback
 */
export default function AxisModal({ axes = ["X", "Y", "Z"], onOk, onCancel }) {
    const [selectedAxes, setSelectedAxes] = useState([]);

    const toggleAxis = (axis) => {
        setSelectedAxes((prev) =>
            prev.includes(axis)
                ? prev.filter((a) => a !== axis)
                : [...prev, axis]
        );
    };

    const handleOk = () => {
        onOk(selectedAxes);
    };

    const handleAll = () => {
        onOk([...axes]); // ✅ Return all provided axes
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalBox}>
                <div className={styles.title}>Select Axes</div>

                <div className={styles.buttonGroup}>
                    {axes.map((axis) => (
                        <button
                            key={axis}
                            className={`${styles.axisButton} ${selectedAxes.includes(axis) ? styles.selected : ""}`}
                            onClick={() => toggleAxis(axis)}
                        >
                            {axis}
                        </button>
                    ))}
                    <button className={styles.allButton} onClick={handleAll}>
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
