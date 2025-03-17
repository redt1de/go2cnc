import React, { useState } from 'react';
import styles from './css/JogButtonGroup.module.css';
import { useContext } from 'react';
import { useCNC } from '../context/CNCContext';
import YesNoDialog from "../util/YesNoDialog";

export default function JogButtonGroup() {
    const [stepSize, setStepSize] = useState('10.0');
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();

    const [showDialog, setShowDialog] = useState(false);

    const handleConfirm = () => {
        setShowDialog(false);
        console.log('sendCommanding G0 Z0');
        sendCommand(`G90 G0 Z0`);
    };

    const handleCancel = () => {
        setShowDialog(false);
    };

    // Example handler, replace with your real logic
    const handleStepChange = (event) => {
        setStepSize(event.target.value);
        console.log('New step size:', event.target.value);
    };
    return (
        // <Frame title="Jog">
        <div>
            {showDialog && <YesNoDialog message="G0 Z0, are you sure?" onConfirm={handleConfirm} onCancel={handleCancel} />}
            <div className={styles.stepSizeContainer}>
                <label className={styles.stepSizeLabel} htmlFor="stepSizeSelect">
                    Step Size:
                </label>
                <select
                    id="stepSizeSelect"
                    className={styles.stepSizeSelect}
                    value={stepSize}
                    onChange={handleStepChange}
                >
                    <option value="0.1">0.1 mm</option>
                    <option value="1.0">1.0 mm</option>
                    <option value="5.0">5.0 mm</option>
                    <option value="10.0">10.0 mm</option>
                    <option value="50.0">50.0 mm</option>
                    <option value="100.0">100.0 mm</option>
                </select>
            </div>

            <div className={styles.jogContainer}>
                <button onClick={() => sendCommand(`G91 G0 X-${stepSize} Y${stepSize}`)}>↖</button>
                <button onClick={() => sendCommand(`G91 G0 Y${stepSize}`)} >▲</button>
                <button onClick={() => sendCommand(`G91 G0 X${stepSize} Y${stepSize}`)}>↗</button>
                <button onClick={() => sendCommand(`G91 G0 Z${stepSize}`)}>Z+</button>
                <button onClick={() => sendCommand(`G91 G0 X-${stepSize}`)}>◄</button>
                <button onClick={() => sendCommand(`G90 G0 X0 Y0`)}>O</button>
                <button onClick={() => sendCommand(`G91 G0 X${stepSize}`)}>►</button>
                <button onClick={() => setShowDialog(true)}>O</button>
                <button onClick={() => sendCommand(`G91 G0 X-${stepSize} Y-${stepSize}`)}>↙</button>
                <button onClick={() => sendCommand(`G91 G0 Y-${stepSize}`)}>▼</button>
                <button onClick={() => sendCommand(`G91 G0 X${stepSize} Y-${stepSize}`)}>↘</button>
                <button onClick={() => sendCommand(`G91 G0 Z-${stepSize}`)}>Z-</button>

            </div>
        </div>
        // </Frame>
    );
}

