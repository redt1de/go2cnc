import React, { useState } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-gcode";
import "ace-builds/src-noconflict/theme-monokai";
import styles from "./css/RunExplorerGroup.module.css";

export default function RunExplorerGroup({ onRun, onDryRun, onAutoLevel }) {
    const [isMacroMode, setIsMacroMode] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const testFiles = [
        { name: "file1.gcode", size: "1.2 KB", content: "G21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 F500\nM30\nG90\nG1 X10 F500\nM3aaaaaaa0\nG21\nG90\nG1 X10 F500\nM30\nG21\nG90\nG1 X10 Fsssssss500\nM30zzzzzzzzzzzz" },
        { name: "file2.gcode", size: "2.4 KB", content: "G21\nG91\nG1 Y-5 F600\nM5" }
    ];

    const testMacros = [
        { name: "Macro1", size: "200 B", content: "M3 S1000\nG1 X5 Y5 F500\nM5" },
        { name: "Macro2", size: "250 B", content: "G90\nG0 X0 Y0 Z10\nM30" }
    ];

    const sourceList = isMacroMode ? testMacros : testFiles;

    const handleToggle = () => {
        setIsMacroMode((prev) => !prev);
        setSelectedFile(null);
    };

    const handleRun = () => {
        if (!selectedFile) {
            alert("No file or macro selected!");
            return;
        }
        onRun(selectedFile);
    };

    const handleDryRun = () => {
        if (!selectedFile) {
            alert("No file or macro selected!");
            return;
        }
        onDryRun(selectedFile);
    };

    const handleAutoLevel = () => {
        if (!selectedFile) {
            alert("No file or macro selected!");
            return;
        }
        onAutoLevel(selectedFile);
    };

    return (
        <div className={styles.container}>
            {/* File Explorer */}
            <div className={styles.explorerContainer}>
                {/* File List */}
                <div className={styles.fileList}>
                    {sourceList.map((file, index) => (
                        <div
                            key={index}
                            className={`${styles.fileItem} ${selectedFile?.name === file.name ? styles.selected : ""}`}
                            onClick={() => setSelectedFile(file)}
                        >
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{file.size}</span>
                        </div>
                    ))}
                </div>

                {/* G-Code Editor */}
                <div className={styles.fileViewer}>
                    {selectedFile ? (
                        <AceEditor
                            mode="gcode"
                            theme="monokai"
                            name="gcode-editor"
                            value={selectedFile.content}
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
                        <p>Select a file or macro to view its contents.</p>
                    )}
                </div>
            </div>

            {/* Control Buttons */}
            <div className={styles.controlContainer}>
                <button className={styles.toggleButton} onClick={handleToggle}>
                    {isMacroMode ? "Macros" : "Files"}
                </button>
                <button className={styles.runButton} onClick={handleRun}>Run</button>
                <button className={styles.dryRunButton} onClick={handleDryRun}>Dry Run</button>
                <button className={styles.autoLevelButton} onClick={handleAutoLevel}>Auto-Level</button>
            </div>
        </div>
    );
}

