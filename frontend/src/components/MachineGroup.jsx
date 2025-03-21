import styles from './css/MachineGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faLockOpen, faRotateBack } from '@fortawesome/free-solid-svg-icons';
import { useCNC } from '../context/CNCContext';
import AxisModal from "../util/AxisModal";
import { useState } from 'react';
import { LogInfo } from "../../wailsjs/runtime";

export default function MachineGroup() {
    const [showModal, setShowModal] = useState(false);
    const { consoleMessages, status, isConnected, sendCommand, sendRaw } = useCNC();


    const handleOk = (axes) => {
        const command = axes.length > 0 ? `$H${axes.join("")}` : "$H";
        sendCommand(command);
        LogInfo("Homing axes: " + command);
        setShowModal(false);
    };


    return (
        <div>

            {showModal && <AxisModal axes={["X", "Y", "Z"]} onOk={handleOk} onCancel={() => setShowModal(false)} />}

            <div className={styles.machineContainer}>
                <button onClick={() => sendRaw(0x18)}><FontAwesomeIcon icon={faRotateBack} /></button>
                <button onClick={() => sendCommand(`$X`)}><FontAwesomeIcon icon={faLockOpen} /></button>
                <button onClick={() => setShowModal(true)}><FontAwesomeIcon icon={faHouse} /></button>
            </div>
        </div>
    );
}
