import React, { useContext } from "react"; import styles from './css/MDI.module.css';
import { useCNC } from '../context/CNCContext';

export default function MDI({ positions = {} }) {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();

    return (
        <div className={styles.mdiContainer}>

            <table className={styles.mdiTable}>
                <thead>
                    <tr>
                        <th></th>
                        <th>Work</th>
                        <th>Machine</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={styles.axisLabel}>X</td>

                        <td className={styles.wposTd}>{(status && status.wpos?.x.toFixed(3)) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.x.toFixed(3)) ?? -199.999}</td>
                    </tr>
                    <tr>
                        <td className={styles.axisLabel}>Y</td>
                        <td className={styles.wposTd}>{(status && status.wpos?.y.toFixed(3)) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.y.toFixed(3)) ?? -199.999}</td>
                    </tr>
                    <tr>
                        <td className={styles.axisLabel}>Z</td>
                        <td className={styles.wposTd}>{(status && status.wpos?.z.toFixed(3)) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.z.toFixed(3)) ?? -199.999}</td>
                    </tr>
                </tbody>
            </table>
        </div>

    );
}
