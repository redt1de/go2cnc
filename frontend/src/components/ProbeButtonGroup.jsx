import React, { useState } from 'react';
import styles from './css/ProbeButtonGroup.module.css';
import { useContext } from 'react';
import { useCNC } from '../context/CNCContext';
import KeypadModal from "../util/KeypadModal";
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function ProbeButtonGroup() {
    const { sendCommand } = useCNC();

    // Probe Settings
    const [feedRate, setFeedRate] = useState("100");
    const [probeDistance, setProbeDistance] = useState("10");
    const [zMin, setZMin] = useState("-5");
    const [zMax, setZMax] = useState("5");
    const [currentField, setCurrentField] = useState("");
    const [showKeypad, setShowKeypad] = useState(false);

    // Open keypad
    const handleOpenKeypad = (field) => {
        setCurrentField(field);
        setShowKeypad(true);
    };

    // Handle keypad result
    const handleOk = (value) => {
        switch (currentField) {
            case "feedRate":
                setFeedRate(value);
                break;
            case "probeDistance":
                setProbeDistance(value);
                break;
            case "zMin":
                setZMin(value);
                break;
            case "zMax":
                setZMax(value);
                break;
            default:
                break;
        }
        setShowKeypad(false);
    };

    // Probing Commands
    const probe = (axis, direction) => {
        LogDebug(`G91 G38.2 ${axis}${direction}${probeDistance} F${feedRate}`); // Probe move
    };

    // Find Center (Inside/Outside)
    const findCenter = (type) => {
        const dir = type === "inside" ? "" : "-";
        LogDebug(`G91 G38.2 X${dir}${probeDistance} F${feedRate}`);
        LogDebug(`G91 G38.2 X-${dir}${probeDistance} F${feedRate}`);
        LogDebug(`G91 G38.2 Y${dir}${probeDistance} F${feedRate}`);
        LogDebug(`G91 G38.2 Y-${dir}${probeDistance} F${feedRate}`);
        LogDebug(`G90 G0 X0 Y0`); // Move to center
    };
    return (
        // <Frame title="Jog">
        <div>
            <div className={styles.groupContainer}>
                <div className={styles.inputsContainer}>
                    <label>Distance:</label>
                    <button className={styles.inputButton} onClick={() => handleOpenKeypad("probeDistance")}>
                        {probeDistance}
                    </button>

                    <label>Feedrate:</label>
                    <button className={styles.inputButton} onClick={() => handleOpenKeypad("feedRate")}>
                        {feedRate}
                    </button>
                    {/* 
                <label>Z-Min:</label>
                <button className={styles.inputButton} onClick={() => handleOpenKeypad("zMin")}>
                    {zMin}
                </button>

                <label>Z-Max:</label>
                <button className={styles.inputButton} onClick={() => handleOpenKeypad("zMax")}>
                    {zMax}
                </button> */}


                </div>

                <div className={styles.jogContainer}>
                    <div></div>
                    <button onClick={() => LogDebug(`G91 G0 Y${stepSize}`)} >▲</button>
                    <div></div>
                    <button onClick={() => LogDebug(`G91 G0 Z${stepSize}`)}>Z+</button>
                    <button onClick={() => LogDebug(`G91 G0 X-${stepSize}`)}>◄</button>
                    <div></div>
                    <button onClick={() => LogDebug(`G91 G0 X${stepSize}`)}>►</button>
                    <div></div>
                    <div></div>
                    <button onClick={() => LogDebug(`G91 G0 Y-${stepSize}`)}>▼</button>
                    <div></div>
                    <button onClick={() => LogDebug(`G91 G0 Z-${stepSize}`)}>Z-</button>

                </div>
            </div>
            {showKeypad && (
                <KeypadModal promptText={`Enter ${currentField}`} onOk={handleOk} onCancel={() => setShowKeypad(false)} />
            )}
        </div>
        // </Frame>
    );
}

