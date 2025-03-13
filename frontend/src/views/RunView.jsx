import React from "react";
import Frame from "../util/Frame";
import RunExplorerGroup from "../components/RunExplorerGroup";
import styles from "./css/RunView.module.css";

export default function RunView() {
    const handleRun = (file) => {
        alert(`Running: ${file.name}`);
    };

    const handleDryRun = (file) => {
        alert(`Dry Run: ${file.name}`);
    };

    const handleAutoLevel = (file) => {
        alert(`Auto-Level: ${file.name}`);
    };

    return (
        <div className={styles.runViewContainer}>
            <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                <Frame title="Run Program">
                    <RunExplorerGroup onRun={handleRun} onDryRun={handleDryRun} onAutoLevel={handleAutoLevel} />
                </Frame>
            </div>
        </div>
    );
}

// // views/ConsoleView.jsx
// import React from 'react';
// import Frame from '../util/Frame';
// import ExplorerGroup from '../../backups/ExplorerGroup';
// import { useState } from 'react';
// import RunControlGroup from '../../backups/RunControlGroup';

// export default function ConsoleView() {
//     const [mode, setMode] = useState("files"); // Default to files

//     const handleToggleChange = (newMode) => {
//         setMode(newMode);
//     };

//     const testMacros = [
//         { name: "Macro1", size: "200 B", content: "M3 S1000\nG1 X5 Y5 F500\nM5" },
//         { name: "Macro2", size: "250 B", content: "G90\nG0 X0 Y0 Z10\nM30" },
//     ];
//     const testFiles = [
//         { name: "macro1.gcode", size: "1.2 KB", content: "G21\nG90\nG1 X10 F500\nM30" },
//         { name: "macro2.gcode", size: "2.4 KB", content: "G21\nG91\nG1 Y-5 F600\nM5" },
//         { name: "test.nc", size: "500 B", content: "G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30G21\nG17\nG2 X20 Y10 I5 J5\nM30" }
//     ];

//     return (
//         <div style={{ padding: '10px' }}>
//             <div style={{ position: 'absolute', top: '50px', left: '50px' }}>
//                 <Frame title="Browse">
//                     <ExplorerGroup sourceList={mode === "files" ? testFiles : testMacros} />
//                 </Frame>
//                 <RunControlGroup onToggleChange={handleToggleChange} />
//             </div>
//         </div>
//     );
// }

