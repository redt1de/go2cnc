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
        if ("Z" in axes && "X" in axes && "Y" in axes) {
            sendCommand(`$H`);
        }
        if ("Z" in axes) {
            sendCommand(`$HZ`);
        }
        if ("X" in axes) {
            sendCommand(`$HX`);
        }
        if ("Y" in axes) {
            sendCommand(`$HY`);
        }


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
