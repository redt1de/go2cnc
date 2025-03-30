import React, { useEffect, useState } from "react";
import styles from "./css/FileBrowser.module.css";
import { ListFiles, DelFile } from "../../wailsjs/go/app/App";
import YesNoDialog from "../util/YesNoDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { LogError, LogInfo, LogDebug } from '../util/logger';

export default function FileBrowser({ onFileSelect, onPathChange, selectedFile, forceDrive = "", refreshTrigger = 0 }) {
    const [drive, setDrive] = useState(forceDrive || "SD");
    const [fileList, setFileList] = useState([]);
    const [currentPath, setCurrentPath] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (forceDrive) {
            setDrive(forceDrive);
        }
    }, [forceDrive]);

    useEffect(() => {


        const fetchFiles = async () => {
            try {
                const response = await ListFiles(drive, currentPath);
                LogDebug("ListFiles response:", response);
                const parsed = JSON.parse(response);
                setFileList(currentPath ? [{ name: "..", size: "-1" }, ...parsed.files] : parsed.files || []);
            } catch (err) {
                LogError("Failed to fetch file list:", err);
                setFileList([]);
            }
        };
        fetchFiles();
    }, [drive, currentPath, refreshTrigger]);


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

    const handleDelete = async () => {
        if (!selectedFile || selectedFile.name === ".." || selectedFile.size === "-1") {
            return;
        }

        const filepath = currentPath ? `${currentPath}/${selectedFile.name}` : `/${selectedFile.name}`;

        // const cleanPath = currentPath || ""; // default to "/" if root


        try {
            await DelFile(`${drive},${filepath}`);
            // await DelFile(`${drive},${cleanPath}/${selectedFile.name}`);
            setFileList((prev) => prev.filter(f => f.name !== selectedFile.name));
            onFileSelect(null);
            setShowDeleteDialog(false);
        } catch (err) {
            LogError("Failed to delete file:", err);
            alert("Failed to delete file.");
        }
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

                {!forceDrive && (
                    <button className={styles.toggleButton} onClick={() => {
                        setDrive((prev) => (prev === "SD" ? "USB" : "SD"));
                        setCurrentPath("");
                        onFileSelect(null);
                        onPathChange("", null);
                    }}>
                        Drive: {drive}
                    </button>
                )}

                <button
                    className={styles.trashButton}
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={!selectedFile || selectedFile.size === "-1"}
                    title="Delete selected file"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>

            </div>
            {showDeleteDialog && (
                <YesNoDialog
                    message={`Delete "${selectedFile?.name}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    );
}
