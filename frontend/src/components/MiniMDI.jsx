import React, { useContext } from "react"; import styles from './css/MDI.module.css';
import { useCNC } from '../context/CNCContext';

export default function MiniMDI({ positions = {}, workpos = true }) {
    const { status } = useCNC();

    return (
        <div className={styles.miniMdiContainer}>

            <table className={styles.miniMdiTable}>
                <thead>
                    <tr>
                        {workpos &&
                            <th className={styles.axisLabel}>WX</th> ||
                            <th className={styles.axisLabel}>MX</th>}
                        {workpos &&
                            <th className={styles.axisLabel}>WY</th> ||
                            <th className={styles.axisLabel}>MY</th>}
                        {workpos &&
                            <th className={styles.axisLabel}>WZ</th> ||
                            <th className={styles.axisLabel}>MZ</th>}

                    </tr>
                </thead>
                <tbody>
                    <tr>


                        {workpos &&
                            <td className={styles.wposTd}>{(status && status.wpos?.x.toFixed(3)) ?? -199.999}</td> ||
                            <td className={styles.mposTd}>{(status && status.mpos?.x.toFixed(3)) ?? -199.999}</td>}

                        {workpos &&
                            <td className={styles.wposTd}>{(status && status.wpos?.y.toFixed(3)) ?? -199.999}</td> ||
                            <td className={styles.mposTd}>{(status && status.mpos?.y.toFixed(3)) ?? -199.999}</td>}

                        {workpos &&
                            <td className={styles.wposTd}>{(status && status.wpos?.z.toFixed(3)) ?? -199.999}</td> ||
                            <td className={styles.mposTd}>{(status && status.mpos?.z.toFixed(3)) ?? -199.999}</td>}

                    </tr>
                </tbody>
            </table>
        </div>

    );
}
