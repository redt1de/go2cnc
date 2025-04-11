import React, { useState } from "react";
import Frame from "../util/Frame";
import KeypadModal from "../util/KeypadModal";
import styles from "./css/ProbeView.module.css";
import { useCNC } from "../context/CNCContext";
import { LogError, LogInfo, LogDebug } from '../util/logger';
import AxisModal from "../util/AxisModal";
import ProbeHistory from "../components/ProbeHistory";
import { ClearProbeHistory, Config } from "../../wailsjs/go/app/App";
import { AppConfig } from "../context/CNCContext";
import { LogWarning } from "../../wailsjs/runtime/runtime";
import MiniMDI from "../components/MiniMDI";
import { toast } from 'react-toastify';

export default function ProbeView() {
    const { sendAsync, sendWait, getLastProbe, testIngest, testSender, status, probeHistory } = useCNC();

    const [showAxisModal, setShowAxisModal] = useState(false);

    // Inputs
    const [feedRate, setFeedRate] = useState("100");
    const [probeDistance, setProbeDistance] = useState("25");
    const [probeMode, setProbeMode] = useState("G38.2");
    const [zparams, setZparams] = useState(false);
    const [kpAdv, setKpAdv] = useState(false);
    const [zMin, setZmin] = useState("0");
    const [zMax, setZmax] = useState("15");

    // Input modal
    const [showKeypad, setShowKeypad] = useState(false);
    const [currentField, setCurrentField] = useState("");

    // Unified probe target (direction or utility)
    const [activeProbeTarget, setActiveProbeTarget] = useState({ type: "direction", value: "Z-" });

    const handleZeroSelect = (axis) => {
        if (!axis || axis.length === 0) return;

        // Extract numeric part from status.wcs string (e.g., "G54" → 54)
        const wcsString = status?.wcs ?? "G54";
        const wcsNumber = parseInt(wcsString.replace("G", ""), 10);
        const pValue = isNaN(wcsNumber) ? 1 : wcsNumber - 53; // G54 = P1

        let cmd = `G10 L20 P${pValue}`;

        if (axis.includes("X")) {
            cmd += " X0";
        }
        if (axis.includes("Y")) {
            cmd += " Y0";
        }
        if (axis.includes("Z")) {
            cmd += " Z0";
        }

        LogDebug("Command:", cmd);
        sendAsync(cmd);
        setShowAxisModal(false);
    };




    const handleOpenKeypad = (field) => {
        if (field === "zmin" || field === "zmax") {
            setKpAdv(true);
        } else {
            setKpAdv(false);
        }
        setCurrentField(field);
        setShowKeypad(true);

    };

    // const retract = 2;

    const probeHole = async () => {
        ClearProbeHistory();
        const stored_mpos = status?.mpos;

        // PROBE X-
        let result = await sendWait(`G91 G38.2 X-${probeDistance} F${feedRate}`);
        if (!result.success) {
            LogError("Probe failed: " + result.error.message);
            return;
        }
        let pr = await getLastProbe();
        const xmin = pr.data.x;

        // // RETURN TO START
        await sendWait(`G90 G53 G0 X${stored_mpos.x}`);

        // PROBE X+
        result = await sendWait(`G91 G38.2 X${probeDistance} F${feedRate}`);
        if (!result.success) {
            LogError("Probe failed: " + result.error.message);
            return;
        }
        pr = await getLastProbe();
        const xmax = pr.data.x;

        let cx = (xmax - xmin) / 2;
        // LogWarning(`storedmpos:${stored_mpos.x}, xmin: ${xmin}, xmax: ${xmax}, cx: ${cx}`);

        // MOVE TO CENTER
        await sendWait(`G90 G53 G0 X${xmax - cx}`);

        ////////////////////////////////
        // PROBE Y-
        result = await sendWait(`G91 G38.2 Y-${probeDistance} F${feedRate}`);
        if (!result.success) {
            LogError("Probe failed: " + result.error.message);
            return;
        }
        pr = await getLastProbe();
        const ymin = pr.data.y;

        // // RETURN TO START
        await sendWait(`G90 G53 G0 Y${stored_mpos.y}`);

        // PROBE Y+
        result = await sendWait(`G91 G38.2 Y${probeDistance} F${feedRate}`);
        if (!result.success) {
            LogError("Probe failed: " + result.error.message);
            return;
        }
        pr = await getLastProbe();
        const ymax = pr.data.y;

        let cy = (ymax - ymin) / 2;

        // MOVE TO CENTER
        await sendWait(`G90 G53 G0 Y${ymax - cy}`);





    }



    // ------------------------------------------------------------------------
    const handleOk = (value) => {
        if (currentField === "feedRate") setFeedRate(value);
        if (currentField === "probeDistance") setProbeDistance(value);
        if (currentField === "zmin") setZmin(value);
        if (currentField === "zmax") setZmax(value);
        setCurrentField("");
        setShowKeypad(false);
    };

    const toggleDirection = (dir) => {
        setActiveProbeTarget((prev) =>
            prev.type === "direction" && prev.value === dir
                ? { type: null, value: null }
                : { type: "direction", value: dir }
        );
        setZparams(false);
    };

    // const toggleUtility = (util) => {
    //     setActiveProbeTarget((prev) =>
    //         prev.type === "utility" && prev.value === util
    //             ? { type: null, value: null }
    //             : { type: "utility", value: util }
    //     );
    // };

    const toggleUtility = (util) => {
        const isSame = activeProbeTarget.type === "utility" && activeProbeTarget.value === util;

        if (isSame) {
            setActiveProbeTarget({ type: null, value: null });
            setZparams(false); // deselecting the utility disables Z params
        } else {
            setActiveProbeTarget({ type: "utility", value: util });
            setZparams(util === "Outside"); // enable Z params only for "Outside"
        }
    };

    const executeProbe = () => {
        const { type, value } = activeProbeTarget;
        if (type === "direction") {
            const cleaned = value.replace('+', ''); // ✅ Remove "+"
            const cmd = `G91 ${probeMode} ${cleaned}${probeDistance} F${feedRate}`;
            LogInfo("Executing probe: " + cmd);
            sendAsync(cmd);
            // LogDebug("🔧 Executing probe:", `${probeMode} ${cleaned}${probeDistance} F${feedRate}`);

        } else if (type === "utility") {
            // Placeholder for utility action logic
            LogInfo("Executing probe utility: " + value);

            if (value === "Hole") {
                probeHole();
            } else {
                toast.error("Not implemented yet.");
            }
        }
    };


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

            <div style={{ position: 'absolute', top: '10px', left: '310px' }}>
                <Frame title="DRO">
                    <MiniMDI workpos={false} />
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

            {/* z Parameters */}
            <div
                style={{ position: 'absolute', bottom: '10px', left: '310px' }}
                className={!zparams ? "disabledGroup" : ""}
            >
                <Frame disabled={!zparams} title="Z height">
                    <div className={zparams ? styles.paramGroup : styles.disabledGroup} >
                        <label >Z Probe:</label>
                        <button
                            className={styles.inputButton}
                            onClick={() => handleOpenKeypad("zmin")}
                            disabled={!zparams}
                        >
                            {zMin} mm
                        </button>

                        <label>Z Safe:</label>
                        <button
                            className={styles.inputButton}
                            onClick={() => handleOpenKeypad("zmax")}
                            disabled={!zparams}
                        >
                            {zMax} mm
                        </button>
                    </div>
                </Frame>
            </div>

            {/* Utilities */}
            <div style={{ position: 'absolute', top: '120px', left: '310px' }}>
                <Frame title="Utility">
                    <div className={styles.utilGroup}>
                        {/* {["Inside", "Outside", "Find Center"].map((utility) => ( */}
                        {["Hole", "Outside"].map((utility) => (
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
                    advanced={kpAdv}
                    promptText={`Enter ${currentField}`}
                    onOk={handleOk}
                    onCancel={() => setShowKeypad(false)}
                />
            )}
        </div>
    );
}
