// KeypadModal.jsx
import React, { useState } from 'react';
import styles from './css/KeypadModal.module.css';

/**
 * KeypadModal Props:
 *  - onOk(value: string): called when user confirms
 *  - onCancel(): called when user cancels
 *  - initialValue?: string (optional, the starting text in the input)
 */
export default function KeypadModal({ promptText, onOk, onCancel, initialValue = '' }) {
    const [value, setValue] = useState(initialValue);

    const handleDigit = (digit) => {
        setValue((prev) => prev + digit);
    };

    const handleBackspace = () => {
        setValue((prev) => prev.slice(0, -1));
    };

    const handleOk = () => {
        onOk(value);
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalBox}>
                <div className={styles.title}>
                    {promptText}
                </div>
                <div className={styles.display}>
                    {value || '0'}
                </div>

                <div className={styles.keypad}>
                    {/* Numeric buttons */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            className={styles.keyButton}
                            onClick={() => handleDigit(num.toString())}
                        >
                            {num}
                        </button>
                    ))}
                    <button className={styles.keyButton} onClick={handleBackspace}>⌫</button>
                    <button className={styles.keyButton} onClick={() => handleDigit("0")}>0</button>

                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
                    <button className={styles.okButton} onClick={handleOk}>OK</button>
                </div>
            </div>
        </div>
    );
}
