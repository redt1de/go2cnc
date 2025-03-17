import React, { createContext, useContext, useState, useEffect } from "react";
import { Send, SendRaw } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime"

// Create CNC Context
const CNCContext = createContext();

// CNCProvider Component
export const CNCProvider = ({ children }) => {
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [status, setStatus] = useState({});
    const [isConnected, setIsConnected] = useState(false);

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

    return (
        <CNCContext.Provider value={{ consoleMessages, status, isConnected, sendCommand, sendRaw }}>
            {children}
        </CNCContext.Provider>
    );
};

// Custom hook to use CNCContext
export const useCNC = () => useContext(CNCContext);
