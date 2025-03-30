import styles from './css/ZeroGroup.module.css';
import { useCNC } from '../context/CNCContext';
import { useState } from 'react';
import AxisModal from "../util/AxisModal";
import KeypadModal from '../util/KeypadModal';
import OverridesModal from '../util/OverrideModal';
import WCSModal from '../util/WCSModal';
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function ZeroGroup() {
    const { sendAsync, status } = useCNC();
    const [showModal, setShowModal] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [showOverrides, setShowOverrides] = useState(false);
    const [showWCSModal, setShowWCSModal] = useState(false);


    // WCS	G-Code	G10 Offset Index
    // G54	G54	P1
    // G55	G55	P2
    // G56	G56	P3
    // G57	G57	P4
    // G58	G58	P5
    // G59	G59	P6

    const handleZero = (axis) => {
        if (!axis || axis.length === 0) return;

        // Extract numeric part from status.wcs string (e.g., "G54" → 54)
        const wcsString = status?.wcs ?? "G54";
        const wcsNumber = parseInt(wcsString.replace("G", ""), 10);
        const pValue = isNaN(wcsNumber) ? 1 : wcsNumber - 53; // G54 = P1

        let cmd = `G10 L20 P${pValue}`;

        if (axis.includes("X")) {
            cmd += " X0";
        }
        if (axis.includes("Y")) {
            cmd += " Y0";
        }
        if (axis.includes("Z")) {
            cmd += " Z0";
        }

        LogDebug("Command:", cmd);
        sendAsync(cmd);
        setShowModal(false);
    };

    const handleTLO = (value) => {
        const cmd = `G43.1 Z${value}`;
        LogDebug(`Set TLO: ${cmd}`);
        // G43.1 Z<value>
        sendAsync(cmd);


        setShowKeypad(false);
    };


    return (
        <div>
            {showKeypad && (<KeypadModal advanced={true} promptText="Enter Tool Length Offset" onOk={handleTLO} onCancel={() => setShowKeypad(false)} />)}
            {showModal && <AxisModal axes={["X", "Y", "Z"]} onOk={handleZero} onCancel={() => setShowModal(false)} />}
            {showOverrides && <OverridesModal onClose={() => setShowOverrides(false)} />}
            {showWCSModal && <WCSModal onClose={() => setShowWCSModal(false)} />}

            <div className={styles.zeroContainer}>
                <button onClick={() => setShowModal(true)}>Zero</button>
                <button onClick={() => setShowOverrides(true)}>Override</button>
                <button onClick={() => setShowKeypad(true)}>TLO</button>
                <button onClick={() => setShowWCSModal(true)}>WCS</button>
            </div>
        </div>
    );
}

// [G54:0.000,0.000,0.000]
// [G55:0.000,0.000,0.000]
// [G56:0.000,0.000,0.000]
// [G57:0.000,0.000,0.000]
// [G58:0.000,0.000,0.000]
// [G59:0.000,0.000,0.000]
// [G28:0.000,0.000,0.000]
// [G30:0.000,0.000,0.000]
// [G92:0.000,0.000,0.000]

