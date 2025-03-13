import React from "react";
import styles from "./css/YesNoDialog.module.css";

export default function YesNoDialog({ message, onConfirm, onCancel }) {
    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <p>{message}</p>
                <div className={styles.buttons}>
                    <button onClick={onConfirm} className={styles.yes}>Yes</button>
                    <button onClick={onCancel} className={styles.no}>No</button>
                </div>
            </div>
        </div>
    );
}
