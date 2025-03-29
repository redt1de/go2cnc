import React, { useState } from "react";
import styles from "./css/InputModal.module.css";

export default function InputModal({ promptText, onOk, onCancel, defaultValue = "" }) {
    const [value, setValue] = useState(defaultValue);

    const handleSubmit = () => {
        onOk(value);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <p className={styles.prompt}>{promptText}</p>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={styles.input}
                    autoFocus
                />
                <div className={styles.buttons}>
                    <button className={styles.ok} onClick={handleSubmit}>OK</button>
                    <button className={styles.cancel} onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
