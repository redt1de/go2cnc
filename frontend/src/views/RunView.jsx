import React from "react";
import Frame from "../util/Frame";
import RunExplorerGroup from "../components/RunExplorerGroup";
import styles from "./css/RunView.module.css";
import { useCNC } from "../context/CNCContext";
import { ListFiles, GetFile, RunFile } from "../../wailsjs/go/app/App";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import FileBrowser from "../components/FileBrowser";
import FileViewer from "../components/FileViewer";

export default function RunView() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [loadingFile, setLoadingFile] = useState(false);
    const [path, setPath] = useState("");
    const navigate = useNavigate();

    const listFiles = async (drive, path) => {
        try {
            const response = await ListFiles(drive, path);
            console.log("ListFiles response:", response);
            return { success: true, data: response };
        } catch (error) {
            LogError("ListFiles command failed:", error);
            return { success: false, error };
        }
    };

    const handleRun = async () => {
        if (!selectedFile) {
            alert("No file selected!");
            return;
        }
        let csvstr = `${drive},${currentPath}/${selectedFile.name}`;
        console.log("Running file:", csvstr);
        try {
            const response = await RunFile(csvstr);
            console.log("RunFile response:", response);
            navigate("/control", { replace: true });
            return response;
        } catch (error) {
            console.error("RunFile failed:", error);
            return null;
        }


    };


    const handleFileSelect = async (file, drive, currentPath) => {
        setSelectedFile(file);
        setLoadingFile(true);
        setFileContent("");

        try {
            const content = await GetFile(drive, currentPath ? `${currentPath}/${file.name}` : file.name);
            setFileContent(content);
        } catch (err) {
            console.error("Failed to load file:", err);
            setFileContent("// Error loading file");
        } finally {
            setLoadingFile(false);
        }
    };


    return (
        <div className={styles.runViewContainer}>
            <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                <Frame title="Files">
                    <div className={styles.explorerContainer}>
                        <FileBrowser
                            // forceDrive="MACROS"
                            onFileSelect={handleFileSelect}
                            onPathChange={(newPath) => {
                                setPath(newPath);
                                setFileContent("")
                                setSelectedFile(null);
                            }}
                            selectedFile={selectedFile}
                        />
                        <FileViewer
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
                        <button disabled={!selectedFile} >DryRun</button>
                        <button onClick={handleRun} disabled={!selectedFile} >Run</button>
                        <button disabled={!selectedFile} >Autolevel</button>
                        <button disabled={!selectedFile} >Test</button>
                    </div>
                </Frame>

            </div>
        </div>
    );
}
