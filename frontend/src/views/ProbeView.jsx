import React, { useState } from "react";
import Frame from "../util/Frame";
import KeypadModal from "../util/KeypadModal";
import styles from "./css/ProbeView.module.css";
import { useCNC } from "../context/CNCContext";
import { LogInfo } from "../../wailsjs/runtime";
import AxisModal from "../util/AxisModal";
import ProbeHistory from "../components/ProbeHistory";

export default function ProbeView() {
    const { sendCommand } = useCNC();

    const [showAxisModal, setShowAxisModal] = useState(false);

    // Inputs
    const [feedRate, setFeedRate] = useState("100");
    const [probeDistance, setProbeDistance] = useState("10");
    const [probeMode, setProbeMode] = useState("G38.2");

    // Input modal
    const [showKeypad, setShowKeypad] = useState(false);
    const [currentField, setCurrentField] = useState("");

    // Unified probe target (direction or utility)
    const [activeProbeTarget, setActiveProbeTarget] = useState({ type: "direction", value: "Z-" });

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
        sendCommand(`G91 G38.2 X-${probeDistance} F${feedRate}`)
        sendCommand(`#<x_min>=#<_x>`)
        sendCommand(`G91 G0 X${retract}`)
        sendCommand(`G91 G38.2 X${probeDistance * 2} F${feedRate}`)
        sendCommand(`#<x_max>=#<_x>`)
        sendCommand(`G91 G0 X-${retract}`)
        sendCommand(`#<center>=[[#<x_max>-#<x_min>]/2]`)
        sendCommand(`G91 G0 X[-#<center>+${retract}]`)
        sendCommand(`G91 G38.2 Y-${probeDistance} F${feedRate}`)
        sendCommand(`#<y_min>=#<_y>`)
        sendCommand(`G91 G0 Y${retract}`)
        sendCommand(`G91 G38.2 Y${probeDistance * 2} F${feedRate}`)
        sendCommand(`#<y_max>=#<_y>`)
        sendCommand(`G91 G0 Y-${retract}`)
        sendCommand(`#<center>=[[#<y_max>-#<y_min>]/2]`)
        sendCommand(`G91 G0 Y[-#<center>+${retract}]`)
    }

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
