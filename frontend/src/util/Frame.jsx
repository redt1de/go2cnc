// FieldsetBox.jsx
import React from 'react';
import styles from './css/Frame.module.css';

export default function Frame({ title, children }) {
    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{title}</legend>
            {children}
        </fieldset>
    );
}