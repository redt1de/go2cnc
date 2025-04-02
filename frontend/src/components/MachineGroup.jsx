import styles from './css/MachineGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faLockOpen, faRotateBack } from '@fortawesome/free-solid-svg-icons';
import { useCNC } from '../context/CNCContext';
import AxisModal from "../util/AxisModal";
import { useState } from 'react';
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function MachineGroup() {
    const [showModal, setShowModal] = useState(false);
    const { sendAsync, sendAsyncRaw } = useCNC();



    const handleOk = (axis) => {
        setShowModal(false);
        if (axis.length === 0) {
            return;
        }
        if (axis.includes("Z") && axis.includes("X") && axis.includes("Y")) {
            LogDebug("All axis");
            sendAsync(`$H`);
            return
        } else {
            if (axis.includes("Z")) { // always z first
                sendAsync(`$HZ`);
            }

            if (axis.includes("X")) {
                LogDebug("X axis");
                sendAsync(`$HX`);
            }

            if (axis.includes("Y")) {
                sendAsync(`$HY`);
            }
        }

    };


    return (
        <div>

            {showModal && <AxisModal axes={["X", "Y", "Z"]} onOk={handleOk} onCancel={() => setShowModal(false)} />}

            <div className={styles.machineContainer}>
                <button onClick={() => sendAsyncRaw(0x18)}><FontAwesomeIcon icon={faRotateBack} /></button>
                <button onClick={() => sendAsync(`$X`)}><FontAwesomeIcon icon={faLockOpen} /></button>
                <button onClick={() => setShowModal(true)}><FontAwesomeIcon icon={faHouse} /></button>
            </div>
        </div>
    );
}
