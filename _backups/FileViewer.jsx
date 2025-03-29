import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/FileViewer.module.css";

export default function FileViewer({ selectedFile, fileContent, loading, path }) {
    return (
        <div className={styles.fileViewer}>
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
                            <button className={styles.smallBtn}>Edit</button>
                            <button className={styles.smallBtn}>Save</button>
                        </div>
                    </div>
                </>
            ) : (
                <p>Select a file to preview it here.</p>
            )}
        </div>
    );
}
