import styles from './css/MachineGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faLockOpen, faRotateBack } from '@fortawesome/free-solid-svg-icons';
import { useCNC } from '../context/CNCContext';
import AxisModal from "../util/AxisModal";
import { useState } from 'react';
import { LogInfo } from "../../wailsjs/runtime";

export default function MachineGroup() {
    const [showModal, setShowModal] = useState(false);
    const { sendAsync, sendAsyncRaw } = useCNC();



    const handleOk = (axis) => {
        if (axis.length === 0) {
            return;
        }
        if (axis.includes("Z") && axis.includes("X") && axis.includes("Y")) {
            console.log("All axis");
            sendAsync(`$H`);
        }
        if (axis.includes("Z")) {
            sendAsync(`$HZ`);
        }
        if (axis.includes("X")) {
            console.log("X axis");
            sendAsync(`$HX`);
        }

        if (axis.includes("Y")) {
            sendAsync(`$HY`);
        }


        setShowModal(false);
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
