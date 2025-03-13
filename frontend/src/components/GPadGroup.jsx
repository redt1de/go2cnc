import React, { useState } from "react";
import styles from "./css/GPadGroup.module.css";
import Frame from "../util/Frame";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDeleteLeft, faArrowRightToBracket, faKeyboard, faArrowUp } from "@fortawesome/free-solid-svg-icons";

export default function GPadGroup({ onEnter, initialValue = "" }) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [gcodeHistory, setGcodeHistory] = useState([]); // ✅ Stores entered commands
    const [historyIndex, setHistoryIndex] = useState(-1); // ✅ Tracks position in history
    const [layoutIndex, setLayoutIndex] = useState(0); // ✅ Tracks which keyboard layout is active
    const [isUppercase, setIsUppercase] = useState(false); // ✅ Shift key toggles uppercase

    // ✅ Layout 1: G-code Optimized
    const gcodeLayout = [
        ["X", "G", "7", "8", "9", "UP"],
        ["Y", "M", "4", "5", "6", "DOWN"],
        ["Z", "S", "1", "2", "3", "DEL"],
        ["-", "F", ".", "0", "SPC", "SWAP"],
    ];

    // ✅ Layout 2: Alphabet Keyboard (Shift toggles case)
    const alphabetLowercase = [
        ["a", "b", "c", "d", "e", "f"],
        ["g", "h", "i", "j", "k", "l"],
        ["m", "n", "o", "p", "q", "r"],
        ["SHIFT", "s", "t", "u", "v", "SWAP"],
    ];

    const alphabetUppercase = alphabetLowercase.map(row => row.map(key =>
        key.length === 1 ? key.toUpperCase() : key
    ));

    // ✅ Layout 3: Special Characters
    const specialCharLayout = [
        ["$", "#", "=", "/", "\\", "+"],
        ["*", "!", "@", "&", "%", "^"],
        ["(", ")", "{", "}", "[", "]"],
        ["<", ">", "?", "|", "_", "SWAP"],
    ];

    // ✅ Helper function to render key labels
    const renderKeyLabel = (key) => {
        switch (key) {
            case "DEL":
                return <FontAwesomeIcon icon={faDeleteLeft} />;
            case "UP":
                return "▲";
            case "DOWN":
                return "▼";
            case "SPC":
                return "_";
            case "ENTER":
                return <FontAwesomeIcon icon={faArrowRightToBracket} />;
            case "SWAP":
                return <FontAwesomeIcon icon={faKeyboard} />;
            case "SHIFT":
                return <FontAwesomeIcon icon={faArrowUp} />;
            default:
                return key;
        }
    };

    // ✅ Handle Key Press
    const handlePress = (key) => {
        switch (key) {
            case "DEL":
                setInputValue((prev) => prev.slice(0, -1));
                break;
            case "SPC":
                setInputValue((prev) => prev + " ");
                break;
            case "ENTER":
                if (inputValue.trim() !== "") {
                    setGcodeHistory((prev) => [...prev, inputValue]); // ✅ Save to history
                    setHistoryIndex(-1); // ✅ Reset history index
                    if (onEnter) onEnter(inputValue);
                    setInputValue(""); // ✅ Clear input
                }
                break;
            case "UP":
                navigateHistory(-1);
                break;
            case "DOWN":
                navigateHistory(1);
                break;
            case "SWAP":
                setLayoutIndex((prev) => (prev + 1) % 3); // ✅ Cycle through layouts
                break;
            case "SHIFT":
                setIsUppercase((prev) => !prev); // ✅ Toggle uppercase/lowercase
                break;
            default:
                setInputValue((prev) => prev + key);
                break;
        }
    };

    // ✅ Navigate history with UP/DOWN
    const navigateHistory = (direction) => {
        if (gcodeHistory.length === 0) return; // No history to navigate

        setHistoryIndex((prevIndex) => {
            let newIndex = prevIndex + direction;

            if (newIndex < 0) newIndex = 0; // Prevent going before first entry
            if (newIndex >= gcodeHistory.length) return -1; // Exit history

            setInputValue(gcodeHistory[newIndex]); // ✅ Load history entry
            return newIndex;
        });
    };

    // ✅ Select layout
    const currentLayout = layoutIndex === 0
        ? gcodeLayout
        : layoutIndex === 1
            ? (isUppercase ? alphabetUppercase : alphabetLowercase)
            : specialCharLayout;

    return (
        <Frame title="Gcode">
            <div className={styles.keypadContainer}>
                <div className={styles.displayContainer}>
                    <div className={styles.display}>{inputValue || "\u00A0"}</div>
                    <button
                        className={styles.enterButton}
                        onClick={() => handlePress("ENTER")}
                    >
                        <FontAwesomeIcon icon={faArrowRightToBracket} />
                    </button>
                </div>

                <div className={styles.gpadContainer}>
                    {currentLayout.map((row, rowIndex) =>
                        row.map((key) => (
                            <button
                                key={`${rowIndex}-${key}`}
                                className={styles.keyButton}
                                onClick={() => handlePress(key)}
                            >
                                {renderKeyLabel(key)}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </Frame>
    );
}


// import React, { useState } from "react";
// import styles from "./css/GPadGroup.module.css";
// import Frame from "../util/Frame";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faDeleteLeft, faArrowRightToBracket, faKeyboard } from "@fortawesome/free-solid-svg-icons";

// export default function GPadGroup({ onEnter, initialValue = "" }) {
//     const [inputValue, setInputValue] = useState(initialValue);
//     const [gcodeHistory, setGcodeHistory] = useState([]); // ✅ Stores entered commands
//     const [historyIndex, setHistoryIndex] = useState(-1); // ✅ Tracks position in history
//     const [altLayout, setAltLayout] = useState(false); // ✅ Tracks which keyboard layout is active

//     // ✅ Default Keyboard Layout
//     const primaryKeypadLayout = [
//         ["X", "G", "7", "8", "9", "UP"],
//         ["Y", "M", "4", "5", "6", "DOWN"],
//         ["Z", "S", "1", "2", "3", "DEL"],
//         ["-", "F", ".", "0", "SPC", "SWAP"],
//     ];

//     // ✅ Alternative Keyboard Layout
//     const altKeypadLayout = [
//         ["A", "B", "C", "D", "E", "G"],
//         ["I", "", "/", "\\", "(", "DEL"],
//         ["$", "#", "=", "!", "*", "DOWN"],
//         [")", "@", "&", "%", "^", "SWAP"],
//     ];


//     // const altKeypadLayout = [
//     //     ["A", "B", "C", "#", "$", "UP"],
//     //     ["D", "E", "P", "+", "*", "DOWN"],
//     //     ["!", "=", "/", "\\", "(", "DEL"],
//     //     [")", "@", "&", "%", "^", "SWAP"],
//     // ];

//     // ✅ Helper function to render key labels
//     const renderKeyLabel = (key) => {
//         switch (key) {
//             case "DEL":
//                 return <FontAwesomeIcon icon={faDeleteLeft} />;
//             case "UP":
//                 return "▲";
//             case "DOWN":
//                 return "▼";
//             case "SPC":
//                 return "_";
//             case "ENTER":
//                 return <FontAwesomeIcon icon={faArrowRightToBracket} />;
//             case "SWAP":
//                 return <FontAwesomeIcon icon={faKeyboard} />;
//             default:
//                 return key;
//         }
//     };

//     // ✅ Handle Key Press
//     const handlePress = (key) => {
//         switch (key) {
//             case "DEL":
//                 setInputValue((prev) => prev.slice(0, -1));
//                 break;
//             case "SPC":
//                 setInputValue((prev) => prev + " ");
//                 break;
//             case "ENTER":
//                 if (inputValue.trim() !== "") {
//                     setGcodeHistory((prev) => [...prev, inputValue]); // ✅ Save to history
//                     setHistoryIndex(-1); // ✅ Reset history index
//                     if (onEnter) onEnter(inputValue);
//                     setInputValue(""); // ✅ Clear input
//                 }
//                 break;
//             case "UP":
//                 navigateHistory(-1);
//                 break;
//             case "DOWN":
//                 navigateHistory(1);
//                 break;
//             case "SWAP":
//                 setAltLayout((prev) => !prev); // ✅ Toggle between layouts
//                 break;
//             default:
//                 setInputValue((prev) => prev + key);
//                 break;
//         }
//     };

//     // ✅ Navigate history with UP/DOWN
//     const navigateHistory = (direction) => {
//         if (gcodeHistory.length === 0) return; // No history to navigate

//         setHistoryIndex((prevIndex) => {
//             let newIndex = prevIndex + direction;

//             if (newIndex < 0) newIndex = 0; // Prevent going before first entry
//             if (newIndex >= gcodeHistory.length) return -1; // Exit history

//             setInputValue(gcodeHistory[newIndex]); // ✅ Load history entry
//             return newIndex;
//         });
//     };

//     return (
//         <Frame title="Gcode">
//             <div className={styles.keypadContainer}>
//                 <div className={styles.displayContainer}>
//                     <div className={styles.display}>{inputValue || "\u00A0"}</div>
//                     <button
//                         className={styles.enterButton}
//                         onClick={() => handlePress("ENTER")}
//                     >
//                         <FontAwesomeIcon icon={faArrowRightToBracket} />
//                     </button>
//                 </div>

//                 <div className={styles.gpadContainer}>
//                     {(altLayout ? altKeypadLayout : primaryKeypadLayout).map((row, rowIndex) =>
//                         row.map((key) => (
//                             <button
//                                 key={`${rowIndex}-${key}`}
//                                 className={styles.keyButton}
//                                 onClick={() => handlePress(key)}
//                             >
//                                 {renderKeyLabel(key)}
//                             </button>
//                         ))
//                     )}
//                 </div>
//             </div>
//         </Frame>
//     );
// }
