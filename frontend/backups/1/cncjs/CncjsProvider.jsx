import React, { createContext, useEffect, useState } from "react";
import {
    openSocket,
    closeSocket,
    openSerial,
    sendGcode,
    sendCncjsCommand,
    sendRawSerial,
    checkPorts
} from "./cncjsConnection";

export const CncjsContext = createContext(null);

export function CncjsProvider({ options, children }) {
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isControllerConnected, setIsControllerConnected] = useState(false);
    const [grblState, setGrblState] = useState(null);
    const [consoleMessages, setConsoleMessages] = useState([]); // Store console output


    useEffect(() => {
        function handleCncjsEvent(eventData) {
            switch (eventData.event) {
                case "Grbl:state":
                    // console.log("🔵 Grbl State:", eventData.data);
                    setGrblState(eventData.data);
                    break;
                case "serialport:error":
                    console.error(eventData.data);
                    break;
                case "serialport:read" || "serialport:write":
                    const rln = eventData.data.toString().trim();
                    if (rln) {
                        setConsoleMessages((prev) => {
                            const updatedMessages = [...prev, rln];
                            return updatedMessages;
                        });
                    }
                    break;
                case "serialport:write":
                    const wln = eventData.data.toString().trim();
                    if (wln) {
                        setConsoleMessages((prev) => {
                            const updatedMessages = [...prev, '► ' + wln];
                            return updatedMessages;
                        });
                    }
                    break;
                case "serialport:list":
                    for (let port of eventData.data) {
                        // console.log("🔌 Serial Port:", port.inuse);
                        if (port.inuse && !isControllerConnected) {
                            openSerial(options);
                            setIsControllerConnected(true);
                            break;
                        }
                    }
                    setIsControllerConnected(false);
                    break;
                case "connect": // socket.io connected
                    setIsSocketConnected(true);
                    console.log("🔗✅ Socket.IO Connected");
                    checkPorts();
                    break;
                case "disconnect":
                    setIsSocketConnected(false);
                    setIsControllerConnected(false);
                    console.log("🔗❌ Socket.IO Disconnected");
                    break;
                case "serialport:open": // Serial port opened
                    setIsControllerConnected(true);
                    console.log("🔌✅ Serial port opened");
                    break;
                case "serialport:close":
                    setIsControllerConnected(false);
                    console.log("🔌❌ Serial port closed");
                    break;
                // {event: "serialport:change", data:{port: '/dev/ttyUSB0', inuse: false}}
                case "serialport:change":
                    setIsControllerConnected(eventData.data.inuse);
                    if (eventData.data.inuse && !isControllerConnected) {
                        // Serial port is in use but not connected
                        openSerial(options);
                    }
                    console.log("🔌⚠️ Serial port changed:", eventData.data);
                    break;
                default:
                    console.log("Unknown event:", eventData);
                    break;
            }
        }


        openSocket(options, handleCncjsEvent)
            .then(() => setIsSocketConnected(true))
            .catch(() => setIsSocketConnected(false));

        // ✅ Send heartbeat every 5 seconds to ensure CNCjs is still responsive
        const heartbeatInterval = setInterval(() => {
            if (isSocketConnected) {
                // sendCncjsCommand("gcode", "?"); // Sends a status request
            }
        }, 5000);

        return () => {
            clearInterval(heartbeatInterval);
            closeSocket();
            setIsSocketConnected(false);
            setIsControllerConnected(false);
        };
    }, [options]);

    // useEffect(() => {
    //     console.log("🔥 Console Messages Updated:", consoleMessages);
    // }, [consoleMessages]);

    return (
        <CncjsContext.Provider value={{
            isSocketConnected,
            isControllerConnected,
            grblState,
            consoleMessages,
            sendGcode,
            sendCncjsCommand,
            sendRawSerial

        }}>
            {children}
        </CncjsContext.Provider>
    );
}

