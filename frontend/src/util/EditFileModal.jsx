import React, { useEffect, useState } from "react";
import styles from "./css/EditFileModal.module.css";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";

export default function EditFileModal({ initialContent, onClose, onSave }) {
    const [text, setText] = useState(initialContent || "");

    useEffect(() => {
        setText(initialContent || "");
    }, [initialContent]);

    const handleChange = (val) => setText(val);

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.editorContainer}>
                    <AceEditor
                        mode="gcode"
                        theme="monokai"
                        name="edit-ace"
                        value={text}
                        onChange={handleChange}
                        fontSize={14}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                            showLineNumbers: true,
                            tabSize: 4,
                            useWorker: false
                        }}
                        className={styles.aceEditor}
                    />
                </div>


                <div className={styles.buttonBar}>
                    <button className={styles.btn} onClick={handleSave}>Save</button>
                    <button className={styles.btn} onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
