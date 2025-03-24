import React, { useState } from "react";
import Frame from "../util/Frame";
import KeypadModal from "../util/KeypadModal";
import styles from "./css/ProbeView.module.css";
import { useCNC } from "../context/CNCContext";
import { LogInfo, LogError } from "../../wailsjs/runtime";
import AxisModal from "../util/AxisModal";
import ProbeHistory from "../components/ProbeHistory";
import { useCommandRunner } from '../context/QueueRunner';
import { ClearProbeHistory } from "../../wailsjs/go/app/App";

export default function ProbeView() {
    const { sendCommand, testFunc, status, probeHistory } = useCNC();

    const [showAxisModal, setShowAxisModal] = useState(false);

    // Inputs
    const [feedRate, setFeedRate] = useState("100");
    const [probeDistance, setProbeDistance] = useState("25");
    const [probeMode, setProbeMode] = useState("G38.2");

    // Input modal
    const [showKeypad, setShowKeypad] = useState(false);
    const [currentField, setCurrentField] = useState("");

    // Unified probe target (direction or utility)
    const [activeProbeTarget, setActiveProbeTarget] = useState({ type: "direction", value: "Z-" });
    const { runCommandQueue } = useCommandRunner();

    const handleZeroSelect = (axes) => {
        console.log("User selected axes:", axes);
        // Example: build a command
        const a = `G0 ${axes.map(a => `${a}0`).join(" ")}`;

        const command = `G10 L20 P1 ${axes.map(a => `${a}0`).join(" ")}`;


        LogInfo("Sending command: " + command);
        sendCommand(command);
        setShowAxisModal(false);
    };

    const handleOpenKeypad = (field) => {
        setCurrentField(field);
        setShowKeypad(true);
    };

    const retract = 2;

    const probeInside = () => { // this only works for FluidNC
        // sendCommand(`#<_pdist>=${probeDistance}`)
        // sendCommand(`#<_pfeed>=${feedRate}`)
        // sendCommand(`#<_pretract>=${retract}`)
        // sendCommand(`$SD/Run=Macros/probe_inner.nc`)

        // LogInfo("Executing probe utility: Inside");
        // handleProbeSequence();
        // LogInfo("Probe utility: Done");
        testFunc();

    }

    /*
    store mpos
    `G91 G38.2 X-${probeDistance} F${feedRate}`
    `G90 G53 G0 X${stored_mpos.x}`
    */

    const handleProbeSequence = async () => {
        ClearProbeHistory();
        const stored_mpos = status?.mpos;
        await runCommandQueue([
            () => `G91 G38.2 X-${probeDistance} F${feedRate}`,
            () => `G90 G53 G0 X${stored_mpos.x}`,

            () => `G91 G38.2 X${probeDistance} F${feedRate}`,
            () => `G90 G53 G0 X${stored_mpos.x}`,
            // () => `G91 G38.2 Y-${probeDistance} F${feedRate}`,
            // () => `G90 G53 G0 Y${stored_mpos.y}`,

            // () => `G91 G38.2 Y${probeDistance} F${feedRate}`,
            // () => `G90 G53 G0 Y${stored_mpos.y}`,
        ]);

        // make sure length of probeHistory is 2
        if (probeHistory.length !== 2) {
            LogError("Probe history is not 2, something went wrong.");
            return;
        }
        // subtrace x[1] from x[2]
        const x1 = probeHistory[0].x;
        const x2 = probeHistory[1].x;
        const x = x2 - x1;
        LogInfo("X distance:", x);
    };

    const handleOk = (value) => {
        if (currentField === "feedRate") setFeedRate(value);
        if (currentField === "probeDistance") setProbeDistance(value);
        setShowKeypad(false);
    };

    const toggleDirection = (dir) => {
        setActiveProbeTarget((prev) =>
            prev.type === "direction" && prev.value === dir
                ? { type: null, value: null }
                : { type: "direction", value: dir }
        );
    };

    const toggleUtility = (util) => {
        setActiveProbeTarget((prev) =>
            prev.type === "utility" && prev.value === util
                ? { type: null, value: null }
                : { type: "utility", value: util }
        );
    };

    const executeProbe = () => {
        const { type, value } = activeProbeTarget;
        if (type === "direction") {
            const cleaned = value.replace('+', ''); // ✅ Remove "+"
            const cmd = `G91 ${probeMode} ${cleaned}${probeDistance} F${feedRate}`;
            LogInfo("Executing probe: " + cmd);
            sendCommand(cmd);
            // console.log("🔧 Executing probe:", `${probeMode} ${cleaned}${probeDistance} F${feedRate}`);

        } else if (type === "utility") {
            // Placeholder for utility action logic
            LogInfo("Executing probe utility: " + value);

            if (value === "Inside") {
                probeInside();
            } else {
                alert("Utility actions are not implemented yet.");
            }
        }
    };

    /*
    G91 G38.2 X-50 F100
    #<x_min>=#<_x>
    G91 G0 X2 
    
    G91 G38.2 X50 F100
    #<x_max>=#<_x>
    G91 G0 X-2
    
    #<center>=[[#<x_max>-#<x_min>]/2]
    G91 G0 X[-#<center>+2]
    
    G91 G38.2 Y-50 F100
    #<y_min>=#<_y>
    G91 G0 Y2
    
    G91 G38.2 Y50 F100
    #<y_max>=#<_y>
    G91 G0 Y-2 
    
    #<center>=[[#<y_max>-#<y_min>]/2]
    G91 G0 Y[-#<center>+2]
    */

    return (
        <div className={styles.container}>
            {showAxisModal && <AxisModal axes={["X", "Y", "Z"]} onOk={handleZeroSelect} onCancel={() => setShowAxisModal(false)} />}
            {/* Probe Mode */}
            <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <Frame title="Probe Mode">
                    <div className={styles.modeGroup}>
                        {["G38.2", "G38.3", "G38.4", "G38.5"].map((mode) => (
                            <button
                                key={mode}
                                className={`${styles.toggleButton} ${probeMode === mode ? styles.active : ""}`}
                                onClick={() => setProbeMode(mode)}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </Frame>
            </div>

            {/* Directional Pad */}
            <div style={{ position: 'absolute', top: '120px', left: '10px' }}>
                <Frame title="Direction">
                    <div className={styles.directionPad}>
                        <div></div>
                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "Y+" ? styles.active : ""}`}
                            onClick={() => toggleDirection("Y+")}
                        >
                            Y+
                        </button>
                        <div></div>
                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "Z+" ? styles.active : ""}`}
                            onClick={() => toggleDirection("Z+")}
                        >
                            Z+
                        </button>

                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "X-" ? styles.active : ""}`}
                            onClick={() => toggleDirection("X-")}
                        >
                            X-
                        </button>

                        <div></div>

                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "X+" ? styles.active : ""}`}
                            onClick={() => toggleDirection("X+")}
                        >
                            X+
                        </button>

                        <div></div>
                        <div></div>

                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "Y-" ? styles.active : ""}`}
                            onClick={() => toggleDirection("Y-")}
                        >
                            Y-
                        </button>

                        <div></div>

                        <button
                            className={`${styles.toggleButton} ${activeProbeTarget.type === "direction" && activeProbeTarget.value === "Z-" ? styles.active : ""}`}
                            onClick={() => toggleDirection("Z-")}
                        >
                            Z-
                        </button>
                    </div>
                </Frame>
            </div>

            {/* Probe Parameters */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                <Frame title="Parameters">
                    <div className={styles.paramGroup}>
                        <label>Feedrate:</label>
                        <button className={styles.inputButton} onClick={() => handleOpenKeypad("feedRate")}>
                            {feedRate} mm/min
                        </button>
                        <label>Max Distance:</label>
                        <button className={styles.inputButton} onClick={() => handleOpenKeypad("probeDistance")}>
                            {probeDistance} mm
                        </button>
                    </div>
                </Frame>
            </div>

            {/* Utilities */}
            <div style={{ position: 'absolute', top: '120px', left: '310px' }}>
                <Frame title="Utility">
                    <div className={styles.utilGroup}>
                        {["Inside", "Outside", "Find Center"].map((utility) => (
                            <button
                                key={utility}
                                className={`${styles.utilToggleButton} ${activeProbeTarget.type === "utility" && activeProbeTarget.value === utility ? styles.active : ""}`}
                                onClick={() => toggleUtility(utility)}
                            >
                                {utility}
                            </button>
                        ))}
                    </div>
                </Frame>
            </div>

            {/* Actions */}
            <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                <Frame title="Actions">
                    <div className={styles.actionGroup}>
                        <button className={styles.actionButton} onClick={executeProbe}>
                            Execute Probe
                        </button>
                        <button className={styles.actionButton} onClick={() => setShowAxisModal(true)}>
                            Set Zero
                        </button>
                    </div>
                </Frame>
            </div>

            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                <Frame title="Probe Map">
                    <ProbeHistory />
                </Frame>
            </div>

            {/* Keypad */}
            {showKeypad && (
                <KeypadModal
                    promptText={`Enter ${currentField}`}
                    onOk={handleOk}
                    onCancel={() => setShowKeypad(false)}
                />
            )}
        </div>
    );
}
