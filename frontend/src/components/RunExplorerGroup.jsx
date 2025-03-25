import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/RunExplorerGroup.module.css";
import { ListFiles } from "../../wailsjs/go/app/App"; // Adjust path as needed

export default function RunExplorerGroup({ onRun, onDryRun, onAutoLevel }) {
    const [drive, setDrive] = useState("SD");
    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPath, setCurrentPath] = useState("");

    // Fetch file list whenever drive changes
    // useEffect(() => {
    //     const fetchFiles = async () => {
    //         try {
    //             const response = await ListFiles(drive, "");
    //             const parsed = JSON.parse(response);
    //             if (parsed.files) {
    //                 setFileList(parsed.files);
    //             } else {
    //                 setFileList([]);
    //             }
    //         } catch (err) {
    //             console.error("Failed to fetch file list:", err);
    //             setFileList([]);
    //         }
    //     };

    //     fetchFiles();
    // }, [drive]);
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
                console.error("Failed to fetch file list:", err);
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

    const handleRun = () => {
        if (!selectedFile) {
            alert("No file selected!");
            return;
        }
        onRun(selectedFile);
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
                            // onClick={() => setSelectedFile(file)}
                            onClick={() => {
                                if (file.size === "-1") {
                                    // It's a directory
                                    const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                                    setCurrentPath(newPath);
                                    setSelectedFile(null);
                                } else {
                                    setSelectedFile(file);
                                }
                                if (file.name === "..") {
                                    const parts = currentPath.split("/").filter(Boolean);
                                    parts.pop(); // go up one level
                                    setCurrentPath(parts.join("/"));
                                    setSelectedFile(null);
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
                    {selectedFile ? (
                        <p>Selected: <strong>{selectedFile.name}</strong></p>
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
                <button className={styles.runButton} onClick={handleRun}>Run</button>
                <button className={styles.dryRunButton} onClick={handleDryRun}>Dry Run</button>
                <button className={styles.autoLevelButton} onClick={handleAutoLevel}>Auto-Level</button>
            </div>
        </div>
    );
}
