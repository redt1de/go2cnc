import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame from "../util/Frame";
import FileBrowser from "../components/FileBrowser";
import FileViewer from "../components/FileViewer";
import InputModal from "../util/InputModal";
import { ListFiles, GetFile, PutFile, RunFile } from "../../wailsjs/go/app/App";
import { LogError, LogDebug } from '../util/logger';
import styles from "./css/FilesView.module.css";

export default function MacroView() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const [path, setPath] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const navigate = useNavigate();

    const handleFileSelect = async (file, drive, currentPath) => {
        setSelectedFile(file);
        setLoadingFile(true);
        setFileContent("");

        try {
            const content = await GetFile(drive, currentPath ? `${currentPath}/${file.name}` : file.name);
            setFileContent(content);
        } catch (err) {
            LogError("Failed to load file:", err);
            setFileContent("// Error loading file");
        } finally {
            setLoadingFile(false);
        }
    };

    const handleRun = async () => {
        if (!selectedFile) return;

        const filePath = path ? `${path}/${selectedFile.name}` : selectedFile.name;
        try {
            await RunFile(`MACROS,${filePath}`);
            navigate("/control", { replace: true });
        } catch (error) {
            LogError("RunFile failed:", error);
        }
    };

    const handleCreateMacro = async (filename) => {
        // if (!filename.endsWith(".nc")) filename += ".nc";

        const fullPath = path ? `${path}/${filename}` : filename;
        const defaultContent = "; New macro\n";

        // try {
        await PutFile("MACROS", fullPath, defaultContent);
        // Load the new macro into the viewer
        setSelectedFile({ name: filename });
        setFileContent(defaultContent);
        setShowNewModal(false);
        setRefreshCounter(prev => prev + 1);
        // } catch (err) {
        //     LogError("Upload failed:", err);
        //     // alert("Failed to create macro");
        // }
    };

    const setDrive = async (drive) => {
        drive = "MACROS";
    }

    return (
        <div className={styles.FilesViewContainer}>
            <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                <Frame title="Macros">
                    <div className={styles.explorerContainer}>
                        <FileBrowser
                            drive="MACROS"
                            setDrive={setDrive}
                            onFileSelect={handleFileSelect}
                            onPathChange={(newPath) => {
                                setPath(newPath);
                                setSelectedFile(null);
                                setFileContent("");
                            }}
                            selectedFile={selectedFile}
                            refreshTrigger={refreshCounter}
                        />
                        <FileViewer
                            drive="MACROS"
                            selectedFile={selectedFile}
                            fileContent={fileContent}
                            loading={loadingFile}
                            path={path}
                            allowEdit={true}
                        />
                    </div>
                </Frame>
            </div>

            <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
                <Frame title="Actions">
                    <div className={styles.actionContainer}>
                        <button onClick={() => setShowNewModal(true)}>New</button>
                        <button onClick={handleRun} disabled={!selectedFile}>Run</button>
                    </div>
                </Frame>
            </div>

            {showNewModal && (
                <InputModal
                    promptText="Enter macro name:"
                    onOk={handleCreateMacro}
                    onCancel={() => setShowNewModal(false)}
                />
            )}
        </div>
    );
}
