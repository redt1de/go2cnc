import React, { useEffect, useState } from "react";
import styles from "./css/FileBrowser.module.css";
import { ListFiles } from "../../wailsjs/go/app/App";

export default function FileBrowser({ onFileSelect, onPathChange, selectedFile }) {
    const [drive, setDrive] = useState("SD");
    const [fileList, setFileList] = useState([]);
    const [currentPath, setCurrentPath] = useState("");

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await ListFiles(drive, currentPath);
                const parsed = JSON.parse(response);
                setFileList(currentPath ? [{ name: "..", size: "-1" }, ...parsed.files] : parsed.files || []);
            } catch (err) {
                console.error("Failed to fetch file list:", err);
                setFileList([]);
            }
        };
        fetchFiles();
    }, [drive, currentPath]);

    const handleClick = (file) => {
        if (file.name === "..") {
            const parts = currentPath.split("/").filter(Boolean);
            parts.pop();
            setCurrentPath(parts.join("/"));
            onPathChange("", null);
            return;
        }

        if (file.size === "-1") {
            const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            setCurrentPath(newPath);
            onPathChange(newPath, null);
            return;
        }

        onFileSelect(file, drive, currentPath);
    };

    return (
        <div className={styles.fileList}>
            {fileList.map((file, index) => (
                <div
                    key={index}
                    className={`${styles.fileItem} ${selectedFile?.name === file.name ? styles.selected : ""}`}
                    onClick={() => handleClick(file)}
                >
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>{file.size === "-1" ? "DIR" : `${file.size} B`}</span>
                </div>
            ))}
            <div className={styles.controlContainer}>
                <button className={styles.toggleButton} onClick={() => {
                    setDrive((prev) => (prev === "SD" ? "USB" : "SD"));
                    setCurrentPath("");
                    onFileSelect(null);
                    onPathChange("", null);
                }}>
                    Drive: {drive}
                </button>
            </div>
        </div>
    );
}
