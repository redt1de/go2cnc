import styles from './css/ZeroGroup.module.css';
import { useCNC } from '../context/CNCContext';

export default function ZeroGroup() {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();
    return (
        // <Frame title="Zero">
        <div className={styles.zeroContainer}>
            <button onClick={() => sendCommand("G10 L20 P1 X0 Y0 Z0")}>Zero All</button>
            <button onClick={() => sendCommand("G10 L20 P1 X0")}>Zero X</button>
            <button onClick={() => sendCommand("G10 L20 P1 Y0")}>Zero Y</button>
            <button onClick={() => sendCommand("G10 L20 P1 Z0")}>Zero Z</button>
        </div>
        // </Frame>
    );
}


