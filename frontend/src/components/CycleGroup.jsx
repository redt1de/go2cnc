import styles from './css/CycleGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from "../websocket/WebSocketProvider";


export default function CycleGroup() {
    const { consoleMessages, status, sendCommand } = useWebSocket();
    return (

        <div className={styles.cycleContainer}>
            <button onClick={() => sendCommand(`?\n$G\n$#`)}><FontAwesomeIcon icon={faPlay} /></button>
            <button><FontAwesomeIcon icon={faPause} /></button>
            <button><FontAwesomeIcon icon={faStop} /></button>
        </div>

    );
}
