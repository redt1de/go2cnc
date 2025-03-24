import styles from './css/CycleGroup.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { useCNC } from '../context/CNCContext';

export default function CycleGroup() {
    const { sendAsync, sendAsyncRaw } = useCNC();
    return (

        <div className={styles.cycleContainer}>
            <button onClick={() => sendAsync(`~`)}><FontAwesomeIcon icon={faPlay} /></button>
            <button onClick={() => sendAsync(`!`)}><FontAwesomeIcon icon={faPause} /></button>
            <button onClick={() => sendAsyncRaw(0x84)}><FontAwesomeIcon icon={faStop} /></button>
        </div>

    );
}
