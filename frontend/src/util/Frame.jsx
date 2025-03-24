// // FieldsetBox.jsx

import React from 'react';
import styles from './css/Frame.module.css';


export default function Frame({ title, children, disabled = false }) {
    const frameClass = `${styles.fieldset} ${disabled ? styles.disabled : ""}`;
    const legendClass = `${styles.legend} ${disabled ? styles.disabledLegend : ""}`;

    return (
        <fieldset className={frameClass}>
            <legend className={legendClass}>{title}</legend>
            {children}
        </fieldset>
    );
}


// export default function Frame({ title, children }) {
//     return (
//         <fieldset className={styles.fieldset}>
//             <legend className={styles.legend}>{title}</legend>
//             {children}
//         </fieldset>
//     );
// }