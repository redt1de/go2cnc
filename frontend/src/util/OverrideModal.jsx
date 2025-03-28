import React from "react";
import styles from "./css/OverrideModal.module.css"; // Reuse existing styling
import { useCNC } from "../context/CNCContext";

export default function OverridesModal({ onClose }) {
    const { status, sendAsync, sendAsyncRaw } = useCNC();

    const spindle = status?.ov?.[1] ?? 100;
    const feed = status?.ov?.[0] ?? 100;

    const sendOverride = (type, amount) => {
        let byte = null;
        console.log("Sending override command:", type, amount);
        if (type === "spindle") {
            if (amount === 100) byte = 0x99; // Reset
            else if (amount === 10) byte = 0x9A; // Coarse +
            else if (amount === -10) byte = 0x9B; // Coarse -
            else if (amount === 1) byte = 0x9C; // Fine +
            else if (amount === -1) byte = 0x9D; // Fine -
        } else if (type === "feed") {
            if (amount === 100) byte = 0x90; // Reset
            else if (amount === 10) byte = 0x91; // Coarse +
            else if (amount === -10) byte = 0x92; // Coarse -
            else if (amount === 1) byte = 0x93; // Fine +
            else if (amount === -1) byte = 0x94; // Fine -
        }

        if (byte !== null) {
            console.log("Sending override command:", byte);
            sendAsyncRaw(byte);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h3>Overrides</h3>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ color: "#fff" }}>
                        Spindle: <strong>{spindle}%</strong>
                    </label>
                    <div className={styles.buttons}>
                        <button className={styles.btn} onClick={() => sendOverride("spindle", -10)}>-10%</button>
                        <button className={styles.btn} onClick={() => sendOverride("spindle", -1)}>-1%</button>
                        <button className={styles.btn} onClick={() => sendOverride("spindle", 100)}>100%</button>
                        <button className={styles.btn} onClick={() => sendOverride("spindle", 1)}>+1%</button>
                        <button className={styles.btn} onClick={() => sendOverride("spindle", 10)}>+10%</button>
                    </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ color: "#fff" }}>
                        Feed: <strong>{feed}%</strong>
                    </label>
                    <div className={styles.buttons}>
                        <button className={styles.btn} onClick={() => sendOverride("feed", -10)}>-10%</button>
                        <button className={styles.btn} onClick={() => sendOverride("feed", -1)}>-1%</button>
                        <button className={styles.btn} onClick={() => sendOverride("feed", 100)}>100%</button>
                        <button className={styles.btn} onClick={() => sendOverride("feed", 1)}>+1%</button>
                        <button className={styles.btn} onClick={() => sendOverride("feed", 10)}>+10%</button>
                    </div>
                </div>

                <button className={styles.done} onClick={onClose}>Done</button>
            </div>
        </div>
    );
}

//     FeedOvrReset = 0x90,  // Restores feed override value to 100%.
//     FeedOvrCoarsePlus = 0x91,
//     FeedOvrCoarseMinus = 0x92,
//     FeedOvrFinePlus = 0x93,
//     FeedOvrFineMinus = 0x94,
//     RapidOvrReset = 0x95,  // Restores rapid override value to 100%.
//     RapidOvrMedium = 0x96,
//     RapidOvrLow = 0x97,
//     RapidOvrExtraLow = 0x98,  // *NOT SUPPORTED*
//     SpindleOvrReset = 0x99,  // Restores spindle override value to 100%.
//     SpindleOvrCoarsePlus = 0x9A,  //
//     SpindleOvrCoarseMinus = 0x9B,
//     SpindleOvrFinePlus = 0x9C,
//     SpindleOvrFineMinus = 0x9D,
//     SpindleOvrStop = 0x9E,
//     CoolantFloodOvrToggle = 0xA0,
//     CoolantMistOvrToggle = 0xA1


//     // Configure rapid, feed, and spindle override settings. These values define the max and min
// // allowable override values and the coarse and fine increments per command received. Please
// // note the allowable values in the descriptions following each define.
// namespace FeedOverride {
//     const int Default         = 100;  // 100%. Don't change this value.
//     const int Max             = 200;  // Percent of programmed feed rate (100-255). Usually 120% or 200%
//     const int Min             = 10;   // Percent of programmed feed rate (1-100). Usually 50% or 1%
//     const int CoarseIncrement = 10;   // (1-99). Usually 10%.
//     const int FineIncrement   = 1;    // (1-99). Usually 1%.
// };
// namespace RapidOverride {
//     const int Default  = 100;  // 100%. Don't change this value.
//     const int Medium   = 50;   // Percent of rapid (1-99). Usually 50%.
//     const int Low      = 25;   // Percent of rapid (1-99). Usually 25%.
//     const int ExtraLow = 5;    // Percent of rapid (1-99). Usually 5%.  Not Supported
// };

// namespace SpindleSpeedOverride {
//     const int Default         = 100;  // 100%. Don't change this value.
//     const int Max             = 200;  // Percent of programmed spindle speed (100-255). Usually 200%.
//     const int Min             = 10;   // Percent of programmed spindle speed (1-100). Usually 10%.
//     const int CoarseIncrement = 10;   // (1-99). Usually 10%.
//     const int FineIncrement   = 1;    // (1-99). Usually 1%.
// };
