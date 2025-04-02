import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { SendWait, SendAsync, SendAsyncRaw, ClearProbeHistory, GetLastProbe, TestIngest, TestSender, ListFiles, GetFile, Config as FetchConfig } from "../../wailsjs/go/app/App";
import { EventsOn } from "../../wailsjs/runtime/runtime"
import { LogError, LogInfo, LogDebug, LogTrace } from '../util/logger';

// Create CNC Context
const CNCContext = createContext();

export let AppConfig = {};

// CNCProvider Component
export const CNCProvider = ({ children }) => {
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [status, setStatus] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [probeHistory, setProbeHistory] = useState([]);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        FetchConfig()
            .then((cfg) => {
                AppConfig = cfg;
                LogDebug("Loaded app config:", cfg);
                setConfigLoaded(true);
            })
            .catch((err) => {
                LogError("Failed to load config:", err);
            });
    }, []);

    const consoleMessagesRef = useRef([]);

    useEffect(() => {
        consoleMessagesRef.current = consoleMessages; // Keep in sync
    }, [consoleMessages]);

    useEffect(() => {
        LogDebug("CNCProvider mounted, setting up event listeners...");

        // Listen for Console Messages
        const unsubscribeConsole = EventsOn("consoleEvent", (message) => {
            LogDebug("Console Event:", message);
            setConsoleMessages((prev) => [...prev, message]);
        });

        // Listen for Status Updates
        const unsubscribeStatus = EventsOn("statusEvent", (newStatus) => {
            setStatus(newStatus);
            LogTrace("Status Event:", newStatus);
        });

        // Listen for Connection Status Updates
        const unsubscribeConnection = EventsOn("connectionEvent", (connected) => {
            setIsConnected(connected);
        });

        const unsubscribeProbe = EventsOn("probeEvent", (probeHist) => {
            setProbeHistory(probeHist);
        });


        // Listen for Connection Status Updates
        const unsubscribeGeneric = EventsOn("genericEvent", (connected) => {
            LogDebug("Connection Event:", connected);
            setIsConnected(connected);
        });


        // Cleanup listeners on unmount
        return () => {
            // LogDebug("CNCProvider unmounting, cleaning up event listeners...");
            unsubscribeConsole();
            unsubscribeStatus();
            unsubscribeConnection();
        };
    }, []);


    const testIngest = async () => {
        LogDebug("Testing function...");
        try {
            const response = await TestIngest();
            LogDebug("Test function response:", response);
            return response;
        } catch (error) {
            LogError("Test function failed:", error);
            return null;
        }
    }

    const testSender = async () => {
        LogDebug("Testing function...");
        try {
            const response = await TestSender();
            LogDebug("Test function response:", response);
            return response;
        } catch (error) {
            LogError("Test function failed:", error);
            return null;
        }
    }


    const clearProbeHistory = async () => {
        LogDebug("Clearing probe history...");
        try {
            const response = await ClearProbeHistory();
            LogDebug("Clear probe history response:", response);
            setProbeHistory([]);
            return response;
        } catch (error) {
            LogError("Clear probe history failed:", error);
            return null;
        }
    }

    //////////////////////////////////// senders ////////////////////////////////
    // Expose Send function from Go backend
    const sendAsync = async (command) => {
        LogDebug("Sending command:", command);
        try {
            const response = await SendAsync(command);
            LogDebug("Command response:", response);
            return response;
        } catch (error) {
            LogError("Send command failed:", error);
            return null;
        }
    };

    const sendAsyncRaw = async (command) => {
        LogDebug("Sending command:", command);
        try {
            const response = await SendAsyncRaw(command);
            LogDebug("Command response:", response);
            return response;
        } catch (error) {
            LogError("Send command failed:", error);
            return null;
        }
    };


    const sendWait = async (command) => {
        LogDebug("Sending (wait) command:", command);
        try {
            const response = await SendWait(command);
            LogDebug("SendWait response:", response);
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


