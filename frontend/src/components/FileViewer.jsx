import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/FileViewer.module.css";
import EditFileModal from "../util/EditFileModal";
import { useState } from "react";
import { PutFile } from "../../wailsjs/go/app/App";
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function FileViewer({ selectedFile, fileContent, loading, path, allowEdit = false }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(fileContent);

    React.useEffect(() => {
        setEditedContent(fileContent);
    }, [fileContent]);

    const handleSave = async () => {
        try {
            if (!selectedFile || !editedContent) return;

            // const fileName = path ? `${path}/${selectedFile.name}` : selectedFile.name;
            const fileName = path ? `${path}/${selectedFile.name}` : `/${selectedFile.name}`;
            // 

            LogDebug("Saving file:", fileName);
            await PutFile(fileName, editedContent);

            alert("File saved successfully!");
            setIsEditing(false);
        } catch (err) {
            LogError("Failed to save file:", err);
            alert("Failed to save file.");
        }
    };

    return (



        <div className={styles.fileViewer}>
            <div className={styles.pathDisplay}>Current Path: {path}/{selectedFile?.name} {isEditing && "(edit)" || ""} </div>

            {loading ? (
                <div className={styles.spinner}></div>
            ) : selectedFile ? (
                <>
                    <div className={styles.editorWrapper}>
                        <AceEditor
                            mode="gcode"
                            theme="monokai"
                            name="gcode-editor"
                            // value={fileContent}
                            value={editedContent}
                            onChange={setEditedContent}
                            readOnly={!allowEdit || !isEditing}
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


                        {allowEdit && (
                            <div className={styles.floatingControls}>

                                {isEditing && (
                                    <button className={styles.smallBtn} onClick={() => { handleSave() }}>Save</button>
                                ) || (
                                        <button className={styles.smallBtn} onClick={() => { setIsEditing(true) }}>Edit</button>
                                    )}


                            </div>
                        )}

                    </div>
                </>
            ) : (
                <p>Select a file to preview it here.</p>
            )
            }
        </div >
    );
}
