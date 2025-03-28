import React, { useRef, useEffect, useContext, useState } from "react";
import { useCNC } from '../context/CNCContext';
import styles from "./css/ConsoleGroup.module.css";



const syntaxMatchers = {
    "►": styles.sent,                 // Special character highlight
    "ok": styles.success,             // Success messages
    "error|fail|critical": styles.error, // Errors
    "warning|caution|alert": styles.warning, // Warnings
    "\\[MSG:.*\\]": styles.info, // Messages like `[MSG:Check Limits]`
    "\\[DBG:.*\\]": styles.debug // Debug messages
};




export default function ConsoleGroup() {
    const { consoleMessages, sendAsync } = useCNC();

    const scrollRef = useRef(null);

    // useEffect(() => {
    //     EventsOn("consoleEvent", (message) => {
    //         console.log("Received event:", message);
    //         setConsoleMessages((prev) => [...prev, message]);
    //     });

    //     return () => {
    //         // console.log("Cleaning up event listener...");
    //         // unsubscribe();
    //     };
    // }, []);

    // ✅ Auto-scroll when messages update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [consoleMessages]);

    // ✅ Function to apply syntax highlighting



    const getHighlightedMessage = (msg) => {
        for (const [pattern, style] of Object.entries(syntaxMatchers)) {
            if (new RegExp(pattern, "i").test(msg)) {
                return <span className={style}>{msg}</span>;
            }
        }
        return <span className={styles.default}>{msg}</span>; // Default style
    };

    return (
        <div className={styles.consoleContainer} ref={scrollRef}>
            {/* <button onClick={() => sendAsync("?")}>Send Test</button> */}
            {consoleMessages.length > 0 ? (
                consoleMessages.map((msg, i) => (
                    <div key={i} className={styles.consoleLine}>
                        {getHighlightedMessage(msg)}
                    </div>
                ))
            ) : (
                <div className={styles.placeholder}>No console messages yet...</div>
            )}
        </div>
    );
}
