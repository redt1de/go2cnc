import styles from './css/MachineGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faLockOpen, faRotateBack } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from "../websocket/WebSocketProvider";
import HomingModal from "../util/HomingModal";
import { useState } from 'react';

export default function MachineGroup() {
    const [showModal, setShowModal] = useState(false);
    const { consoleMessages, status, sendCommand } = useWebSocket();

    const handleHoming = (command) => {
        console.log("Sending:", command);
        sendCommand(command); // ✅ Send homing command
        setShowModal(false);
    };
    return (
        <div>

            {showModal && <HomingModal onOk={handleHoming} onCancel={() => setShowModal(false)} />}

            <div className={styles.machineContainer}>
                <button onClick={() => sendCommand(0x18)}><FontAwesomeIcon icon={faRotateBack} /></button>
                <button onClick={() => sendCommand(`$X`)}><FontAwesomeIcon icon={faLockOpen} /></button>
                <button onClick={() => setShowModal(true)}><FontAwesomeIcon icon={faHouse} /></button>
            </div>
        </div>
    );
}
