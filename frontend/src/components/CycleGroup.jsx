import styles from './css/CycleGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { useCNC } from '../context/CNCContext';

export default function CycleGroup() {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();
    return (

        <div className={styles.cycleContainer}>
            <button onClick={() => sendCommand(`~`)}><FontAwesomeIcon icon={faPlay} /></button>
            <button onClick={() => sendCommand(`!`)}><FontAwesomeIcon icon={faPause} /></button>
            <button onClick={() => sendCommand(0x84)}><FontAwesomeIcon icon={faStop} /></button>
        </div>

    );
}
