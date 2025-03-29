import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/FileViewer.module.css";
import EditFileModal from "../util/EditFileModal";
import { useState } from "react";

export default function FileViewer({ selectedFile, fileContent, loading, path }) {
    const [showEditModal, setShowEditModal] = useState(false);

    return (

        <div className={styles.fileViewer}>
            {showEditModal && (
                <EditFileModal
                    initialContent={fileContent}
                    onSave={(newText) => setFileContent(newText)}
                    onClose={() => setShowEditModal(false)}
                />
            )}
            <div className={styles.pathDisplay}>Current Path: /{path}</div>

            {loading ? (
                <div className={styles.spinner}></div>
            ) : selectedFile ? (
                <>
                    <div className={styles.editorWrapper}>
                        <AceEditor
                            mode="gcode"
                            theme="monokai"
                            name="gcode-editor"
                            value={fileContent}
                            readOnly={true}
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
                        <div className={styles.floatingControls}>
                            <button className={styles.smallBtn} onClick={() => { setShowEditModal(true) }}>Edit</button>
                            <button className={styles.smallBtn}>Save</button>
                        </div>
                    </div>
                </>
            ) : (
                <p>Select a file to preview it here.</p>
            )
            }
        </div >
    );
}
