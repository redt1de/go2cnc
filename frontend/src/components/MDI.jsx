import React, { useContext } from "react"; import styles from './css/MDI.module.css';
import { useWebSocket } from "../websocket/WebSocketProvider";

export default function MDI({ positions = {} }) {
    const { consoleMessages, status, sendCommand } = useWebSocket();

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

                        <td className={styles.wposTd}>{(status && status.wpos?.x) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.x) ?? -199.999}</td>
                    </tr>
                    <tr>
                        <td className={styles.axisLabel}>Y</td>
                        <td className={styles.wposTd}>{(status && status.wpos?.y) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.y) ?? -199.999}</td>
                    </tr>
                    <tr>
                        <td className={styles.axisLabel}>Z</td>
                        <td className={styles.wposTd}>{(status && status.wpos?.z) ?? -199.999}</td>
                        <td className={styles.mposTd}>{(status && status.mpos?.z) ?? -199.999}</td>
                    </tr>
                </tbody>
            </table>
        </div>

    );
}
