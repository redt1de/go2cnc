import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/RunExplorerGroup.module.css";
import { ListFiles, GetFile, RunFile } from "../../wailsjs/go/app/App"; // Adjust path as needed

export default function RunExplorerGroup({ onRun, onDryRun, onAutoLevel }) {
    const [drive, setDrive] = useState("SD");
    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPath, setCurrentPath] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await ListFiles(drive, currentPath);
                const parsed = JSON.parse(response);
                if (parsed.files) {
                    setFileList(parsed.files);
                } else {
                    setFileList([]);
                }
            } catch (err) {
                LogError("Failed to fetch file list:", err);
                setFileList([]);
            }
        };

        fetchFiles();
    }, [drive, currentPath]);

    const handleToggleDrive = () => {
        setDrive((prev) => (prev === "SD" ? "USB" : "SD"));
        setSelectedFile(null);
        setCurrentPath("");
    };

    const handleRun = async () => {
        if (!selectedFile) {
            alert("No file selected!");
            return;
        }
        let csvstr = `${drive},${currentPath}/${selectedFile.name}`;
        LogDebug("Running file:", csvstr);
        try {
            const response = await RunFile(csvstr);
            LogDebug("RunFile response:", response);
            navigate("/control", { replace: true });
            return response;
        } catch (error) {
            LogError("RunFile failed:", error);
            return null;
        }


    };

    const handleDryRun = () => {
        if (!selectedFile) {
            alert("No file selected!");
            return;
        }
        onDryRun(selectedFile);
    };

    const handleAutoLevel = () => {
        if (!selectedFile) {
            alert("No file selected!");
            return;
        }
        onAutoLevel(selectedFile);
    };
    const displayFiles = currentPath
        ? [{ name: "..", size: "-1" }, ...fileList]
        : fileList;

    return (
        <div className={styles.container}>
            <div className={styles.pathDisplay}>Current Path: /{currentPath}</div>
            {/* File Explorer */}
            <div className={styles.explorerContainer}>


                {/* File List */}
                <div className={styles.fileList}>

                    {/* {fileList.map((file, index) => ( */}
                    {displayFiles.map((file, index) => (
                        <div
                            key={index}
                            className={`${styles.fileItem} ${selectedFile?.name === file.name ? styles.selected : ""}`}
                            onClick={async () => {
                                if (file.name === "..") {
                                    const parts = currentPath.split("/").filter(Boolean);
                                    parts.pop();
                                    setCurrentPath(parts.join("/"));
                                    setSelectedFile(null);
                                    setFileContent("");
                                    return;
                                }

                                if (file.size === "-1") {
                                    const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                                    setCurrentPath(newPath);
                                    setSelectedFile(null);
                                    setFileContent("");
                                    return;
                                }

                                LogDebug("Selected file:", drive, currentPath, file.name);
                                // It's a file — fetch contents
                                setSelectedFile(file);
                                setLoadingFile(true);   // Start loading
                                setFileContent("");

                                try {
                                    const content = await GetFile(drive, currentPath ? `${currentPath}/${file.name}` : file.name);
                                    setFileContent(content);
                                } catch (err) {
                                    LogError("Failed to load file content:", err);
                                    setFileContent("// Error loading file");
                                } finally {
                                    setLoadingFile(false); // Done loading
                                }
                            }}

                        >
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{file.size === "-1" ? "DIR" : `${file.size} B`}</span>
                        </div>
                    ))}
                </div>

                {/* G-Code Editor (placeholder) */}
                <div className={styles.fileViewer}>
                    {loadingFile ? (
                        // <p className={styles.loadingText}>Loading file...</p>
                        <div className={styles.spinner}></div>
                    ) : selectedFile ? (
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
                    ) : (
                        <p>Select a file to preview it here.</p>
                    )}
                </div>
            </div>

            {/* Control Buttons */}
            <div className={styles.controlContainer}>
                <button className={styles.toggleButton} onClick={handleToggleDrive}>
                    Drive: {drive}
                </button>
                <button className={styles.runButton} onClick={handleRun} disabled={!selectedFile} >Run</button>
                <button className={styles.dryRunButton} onClick={handleDryRun} disabled={!selectedFile}>Dry Run</button>
                <button className={styles.autoLevelButton} onClick={handleAutoLevel} disabled={true}>Auto-Level</button>
            </div>
        </div>
    );
}
