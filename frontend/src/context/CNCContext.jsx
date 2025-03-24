import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { SendWait, SendAsync, SendAsyncRaw, ClearProbeHistory, GetLastProbe, TestIngest, TestSender } from "../../wailsjs/go/app/App";
import { EventsOn, LogError } from "../../wailsjs/runtime/runtime"

// Create CNC Context
const CNCContext = createContext();

// CNCProvider Component
export const CNCProvider = ({ children }) => {
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [status, setStatus] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [probeHistory, setProbeHistory] = useState([]);

    const consoleMessagesRef = useRef([]);

    useEffect(() => {
        consoleMessagesRef.current = consoleMessages; // Keep in sync
    }, [consoleMessages]);

    useEffect(() => {
        console.log("CNCProvider mounted, setting up event listeners...");

        // Listen for Console Messages
        const unsubscribeConsole = EventsOn("consoleEvent", (message) => {
            console.log("Console Event:", message);
            setConsoleMessages((prev) => [...prev, message]);
        });

        // Listen for Status Updates
        const unsubscribeStatus = EventsOn("statusEvent", (newStatus) => {
            console.log("Status Event:", newStatus);
            // setStatus(newStatus[0]);
            setStatus(newStatus);
            // setProbeHistory(status.probeHistory[0]);
        });

        // Listen for Connection Status Updates
        const unsubscribeConnection = EventsOn("connectionEvent", (connected) => {
            // console.log(">>>>>>>>>>>>>>>>>>>> Connection Event:", connected);
            // LogDebug("React hook Connection Event:<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            setIsConnected(connected);
        });

        // TODO: figure out probe udpates since they are passed as status now 
        const unsubscribeProbe = EventsOn("probeEvent", (probeHist) => {
            // console.log("Probe Event:", probeHist);
            // setProbeHistory((prev) => [...prev, probeResult]);
            console.log("Probe Event:", probeHist);
            setProbeHistory(probeHist);
        });


        // Listen for Connection Status Updates
        const unsubscribeGeneric = EventsOn("genericEvent", (connected) => {
            console.log("Connection Event:", connected);
            setIsConnected(connected);
        });


        // Cleanup listeners on unmount
        return () => {
            // console.log("CNCProvider unmounting, cleaning up event listeners...");
            unsubscribeConsole();
            unsubscribeStatus();
            unsubscribeConnection();
        };
    }, []);


    const testIngest = async () => {
        console.log("Testing function...");
        try {
            const response = await TestIngest();
            console.log("Test function response:", response);
            return response;
        } catch (error) {
            console.error("Test function failed:", error);
            return null;
        }
    }

    const testSender = async () => {
        console.log("Testing function...");
        try {
            const response = await TestSender();
            console.log("Test function response:", response);
            return response;
        } catch (error) {
            console.error("Test function failed:", error);
            return null;
        }
    }


    const clearProbeHistory = async () => {
        console.log("Clearing probe history...");
        try {
            const response = await ClearProbeHistory();
            console.log("Clear probe history response:", response);
            setProbeHistory([]);
            return response;
        } catch (error) {
            console.error("Clear probe history failed:", error);
            return null;
        }
    }

    //////////////////////////////////// senders ////////////////////////////////
    // Expose Send function from Go backend
    const sendAsync = async (command) => {
        console.log("Sending command:", command);
        try {
            const response = await SendAsync(command);
            console.log("Command response:", response);
            return response;
        } catch (error) {
            console.error("Send command failed:", error);
            return null;
        }
    };

    const sendAsyncRaw = async (command) => {
        console.log("Sending command:", command);
        try {
            const response = await SendAsyncRaw(command);
            console.log("Command response:", response);
            return response;
        } catch (error) {
            console.error("Send command failed:", error);
            return null;
        }
    };


    // const sendWait = async (command) => {
    //     console.log("Sending (wait) command:", command);
    //     try {
    //         const response = await SendWait(command);
    //         console.log("SendWait response:", response);
    //         return response; // an array of response lines
    //     } catch (error) {
    //         console.error("SendWait command failed:", error);
    //         return null;
    //     }
    // };
    const sendWait = async (command) => {
        console.log("Sending (wait) command:", command);
        try {
            const response = await SendWait(command);
            console.log("SendWait response:", response);
            return { success: true, data: response };
        } catch (error) {
            LogError("SendWait command failed:", error);
            return { success: false, error };
        }
    };

    const getLastProbe = async () => {
        try {
            const response = await GetLastProbe();
            return { success: true, data: response };
        } catch (error) {
            LogError("GetLastProbe command failed:", error);
            return { success: false, error };
        }
    };



    return (
        <CNCContext.Provider value={{ consoleMessages, consoleMessagesRef, probeHistory, status, isConnected, getLastProbe, testSender, testIngest, sendAsync, sendAsyncRaw, sendWait, clearProbeHistory }}>
            {children}
        </CNCContext.Provider>
    );
};

// Custom hook to use CNCContext
export const useCNC = () => useContext(CNCContext);


