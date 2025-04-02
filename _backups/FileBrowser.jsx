import React, { useEffect, useState } from "react";
import styles from "./css/FileBrowser.module.css";
import { ListFiles, DelFile, ListDrives } from "../../wailsjs/go/app/App";
import YesNoDialog from "../util/YesNoDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { LogError, LogDebug, LogTrace } from '../util/logger';

export default function FileBrowser({ onFileSelect, onPathChange, selectedFile, forceDrive = "", refreshTrigger = 0 }) {
    const [drive, setDrive] = useState(forceDrive || "");
    const [drives, setDrives] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [currentPath, setCurrentPath] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const loadDrives = async () => {
            try {
                const availableDrives = await ListDrives();
                LogTrace("Available drives:", availableDrives);
                setDrives(availableDrives);
                if (!forceDrive && availableDrives.length > 0) {
                    setDrive(availableDrives[0]);
                }
            } catch (err) {
                LogError("Failed to load drives:", err);
            }
        };
        loadDrives();
    }, [forceDrive]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await ListFiles(drive, currentPath);
                LogDebug("ListFiles response:", response);

                // response is already a FileList object
                const files = response.files || [];
                const path = response.path || "";

                // Prepend ".." if not root
                const finalFiles = path !== "" ? [{ name: "..", size: "-1" }, ...files] : files;

                setFileList(finalFiles);
                setCurrentPath(path);
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
            const newPath = parts.join("/");
            setCurrentPath(newPath);
            onPathChange(newPath, null);
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
        if (!selectedFile || selectedFile.name === ".." || selectedFile.size === "-1") return;

        const filepath = currentPath ? `${currentPath}/${selectedFile.name}` : `/${selectedFile.name}`;
        try {
            await DelFile(`${drive},${filepath}`);
            setFileList((prev) => prev.filter(f => f.name !== selectedFile.name));
            onFileSelect(null);
            setShowDeleteDialog(false);
        } catch (err) {
            LogError("Failed to delete file:", err);
            alert("Failed to delete file.");
        }
    };

    const handleToggleDrive = () => {
        if (drives.length < 2) return;
        const currentIndex = drives.indexOf(drive);
        const nextDrive = drives[(currentIndex + 1) % drives.length];
        setDrive(nextDrive);
        setCurrentPath("");
        onFileSelect(null);
        onPathChange("", null);
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
                    <button className={styles.toggleButton} onClick={handleToggleDrive}>
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
