import React, { useEffect, useState } from "react";
import styles from "./css/FileBrowser.module.css";
import { ListFiles, DelFile, ListDrives } from "../../wailsjs/go/app/App";
import YesNoDialog from "../util/YesNoDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { LogError, LogDebug, LogTrace } from '../util/logger';

export default function FileBrowser({ drive, setDrive, onFileSelect, onPathChange, selectedFile, forceDrive = "", refreshTrigger = 0 }) {
    // const [drive, setDrive] = useState(forceDrive || "");
    const [drives, setDrives] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [currentPath, setCurrentPath] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(null); // store file to delete


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
        if (!showDeleteDialog) return;

        const file = showDeleteDialog;
        const filepath = currentPath ? `${currentPath}/${file.name}` : `/${file.name}`;

        try {
            await DelFile(`${drive}`, `${filepath}`);
            setFileList((prev) => prev.filter(f => f.name !== file.name));
            if (selectedFile?.name === file.name) {
                onFileSelect(null);
            }
        } catch (err) {
            LogError("Failed to delete file:", err);
            // toast.error("Failed to delete file.");
        } finally {
            setShowDeleteDialog(null);
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
            <div className={styles.fileItemsContainer}>
                {fileList.map((file, index) => (
                    <div
                        key={index}
                        className={`${styles.fileItem} ${selectedFile?.name === file.name ? styles.selected : ""}`}
                        onClick={(e) => {
                            if (e.target.closest(`.${styles.trashButton}`)) return;
                            handleClick(file);
                        }}
                    >
                        <div className={styles.fileLabel}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{file.size === "-1" ? "(DIR)" : `(${file.size}B)`}</span>
                        </div>
                        {file.name !== ".." && (
                            <button
                                className={styles.trashButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteDialog(file);
                                }}
                                title={`Delete ${file.name}`}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.controlContainer}>
                {!forceDrive && (
                    <button className={styles.toggleButton} onClick={handleToggleDrive}>
                        Drive: {drive}
                    </button>
                )}
            </div>

            {showDeleteDialog && (
                <YesNoDialog
                    message={`Delete "${showDeleteDialog.name}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteDialog(null)}
                />
            )}
        </div>

    );
}
