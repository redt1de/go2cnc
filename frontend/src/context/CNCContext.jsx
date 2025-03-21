import React, { createContext, useContext, useState, useEffect } from "react";
import { Send, SendRaw, ClearProbeHistory } from "../../wailsjs/go/app/App";
import { EventsOn } from "../../wailsjs/runtime/runtime"

// Create CNC Context
const CNCContext = createContext();

// CNCProvider Component
export const CNCProvider = ({ children }) => {
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [status, setStatus] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [probeHistory, setProbeHistory] = useState([]);

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
            setStatus(newStatus[0]);
        });

        // Listen for Connection Status Updates
        const unsubscribeConnection = EventsOn("connectionEvent", (connected) => {
            console.log("Connection Event:", connected);
            setIsConnected(connected);
        });

        // Listen for Probe Results
        const unsubscribeProbe = EventsOn("probeEvent", (probeHist) => {
            console.log("Probe Event:", probeHist);
            // setProbeHistory((prev) => [...prev, probeResult]);
            setProbeHistory(probeHist[0]);
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

    // Expose Send function from Go backend
    const sendCommand = async (command) => {
        console.log("Sending command:", command);
        try {
            const response = await Send(command);
            console.log("Command response:", response);
            return response;
        } catch (error) {
            console.error("Send command failed:", error);
            return null;
        }
    };

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

    const sendRaw = async (command) => {
        console.log("Sending command:", command);
        try {
            const response = await SendRaw(command);
            console.log("Command response:", response);
            return response;
        } catch (error) {
            console.error("Send command failed:", error);
            return null;
        }
    };

    // function handleTest() {
    //     Test().then((result) => {
    //         alert(`Test() returned: ${result}`); // Show the result in an alert
    //     }).catch((error) => {
    //         console.error("Error calling Test():", error);
    //     });



    return (
        <CNCContext.Provider value={{ consoleMessages, probeHistory, status, isConnected, sendCommand, sendRaw, clearProbeHistory }}>
            {children}
        </CNCContext.Provider>
    );
};

// Custom hook to use CNCContext
export const useCNC = () => useContext(CNCContext);
