import styles from './css/ZeroGroup.module.css';
import { useCNC } from '../context/CNCContext';
import { useState } from 'react';
import AxisModal from "../util/AxisModal";
import KeypadModal from '../util/KeypadModal';
import OverridesModal from '../util/OverrideModal';

export default function ZeroGroup() {
    const { sendAsync } = useCNC();
    const [showModal, setShowModal] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [showOverrides, setShowOverrides] = useState(false);

    const handleZero = (axis) => {
        let cmd = `G10 L20 P1`;
        if (axis.length === 0) {
            return;
        }

        if (axis.includes("X")) {
            console.log("X axis");
            cmd = `${cmd} X0`;
        }

        if (axis.includes("Y")) {
            cmd = `${cmd} Y0`;
        }
        if (axis.includes("Z")) {
            cmd = `${cmd} Z0`;
        }

        console.log("Command:", cmd);
        sendAsync(cmd)


        setShowModal(false);
    };

    const handleTLO = (value) => {
        const cmd = `G43.1 Z${value}`;
        console.log(`Set TLO: ${cmd}`);
        // G43.1 Z<value>
        sendAsync(cmd);


        setShowKeypad(false);
    };


    return (
        <div>
            {showKeypad && (<KeypadModal promptText="Enter Tool Length Offset" onOk={handleTLO} onCancel={() => setShowKeypad(false)} />)}
            {showModal && <AxisModal axes={["X", "Y", "Z"]} onOk={handleZero} onCancel={() => setShowModal(false)} />}
            {showOverrides && <OverridesModal onClose={() => setShowOverrides(false)} />}

            <div className={styles.zeroContainer}>
                <button onClick={() => setShowModal(true)}>Set Zero</button>
                <button onClick={() => setShowOverrides(true)}>Override</button>
                <button onClick={() => setShowKeypad(true)}>TLO</button>
                <button onClick={() => alert("TODO")}>????</button>
            </div>
        </div>
    );
}


