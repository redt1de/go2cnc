import React from "react";
import Frame from "../util/Frame";
import RunExplorerGroup from "../components/RunExplorerGroup";
import styles from "./css/FilesView.module.css";
import { useCNC } from "../context/CNCContext";
import { GetFile, RunFile } from "../../wailsjs/go/app/App";
import { LogError, LogInfo, LogDebug } from '../util/logger';
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import FileBrowser from "../components/FileBrowser";
import FileViewer from "../components/FileViewer";

export default function FilesView() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const [path, setPath] = useState("");
    const [drive, setDrive] = useState("LOCAL");
    const navigate = useNavigate();



    const handleRun = async () => {

        if (!selectedFile) return;

        const filePath = path ? `${path}/${selectedFile.name}` : selectedFile.name;
        try {
            await RunFile(`${drive}`, filePath);
            navigate("/control", { replace: true });
        } catch (error) {
            LogError("RunFile failed:", error);
        }


    };

    const NaFunc = () => {
        LogError("Not implemented yet");
    }

    const handleFileSelect = async (file, drive, currentPath) => {
        if (!file) {
            setLoadingFile(false);
            setFileContent("");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setLoadingFile(true);
        setFileContent("");


        try {
            const content = await GetFile(drive, currentPath ? `${currentPath} / ${file.name}` : file.name);
            setFileContent(content);
        } catch (err) {
            LogError("Failed to load file:", err);
            setFileContent("// Error loading file");
        } finally {
            setLoadingFile(false);
        }

    };


    return (
        <div className={styles.FilesViewContainer}>
            <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                <Frame title="Files">
                    <div className={styles.explorerContainer}>
                        <FileBrowser
                            drive={drive}
                            setDrive={setDrive}
                            onFileSelect={handleFileSelect}
                            onPathChange={(newPath) => {
                                setPath(newPath);
                                setFileContent("")
                                setSelectedFile(null);
                            }}
                            selectedFile={selectedFile}
                        />
                        <FileViewer
                            drive={drive}
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
                        <button onClick={NaFunc} disabled={!selectedFile} >DryRun</button>
                        <button onClick={handleRun} disabled={!selectedFile} >Run</button>
                        <button onClick={NaFunc} disabled={!selectedFile} >Autolevel</button>
                        <button onClick={NaFunc} disabled={!selectedFile} >Test</button>
                    </div>
                </Frame>

            </div>
        </div>
    );
}
