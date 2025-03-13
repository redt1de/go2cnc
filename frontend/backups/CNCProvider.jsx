import React, { useRef, createContext, useContext, useState, useEffect } from "react";

import { WebSocketProvider } from "./WebSocketProvider";
import GrblController from "../controllers/GrblController";
import FluidNCController from "../controllers/FluidNCController";

const CNCContext = createContext();

export function CNCProvider({ options, children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [machineState, setMachineState] = useState({});
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [probeHistory, setProbeHistory] = useState([]);

    const controllerRef = useRef(null);
    const providerRef = useRef(null);

    useEffect(() => {
        if (!providerRef.current) {
            console.log("🔄 Initializing CNC Provider...");
            switch (options.controllerType) {
                case "fluidnc":
                    console.log("🔧 Using FluidNC Controller...");
                    controllerRef.current = new FluidNCController();
                    break;
                default:
                    console.log("🔧 Using Grbl Controller...");
                    controllerRef.current = new GrblController();
                    break;
            }

            let selectedProvider;
            switch (options.socketProvider) {
                case "websocket":
                    console.log("🔧 Using WebSocket Provider...");
                    selectedProvider = new WebSocketProvider(options, () => {
                        setIsConnected(selectedProvider.isConnected);
                    }, (data) => controllerRef.current.parseData(data));
                    break;
                default:
                    console.error("❌ No valid provider selected!");
                    return;
            }
            providerRef.current = selectedProvider;
        }

        controllerRef.current.addListener((state, messages, history) => {
            setMachineState({ ...state });
            setConsoleMessages([...messages]);

            if (history) {
                setProbeHistory([...history]); // ✅ Update probe history state
            }

            controllerRef.current.setSendFunctions(providerRef.current.send, providerRef.current.sendRaw);
        });



        return () => {
            console.log("🛑 CNCProvider is being unmounted...");
            providerRef.current?.disconnect();
        };
    }, [options]);


    if (!providerRef.current) return <div>Loading CNC Provider...</div>;

    return (
        <CNCContext.Provider value={{
            controller: controllerRef.current,
            isConnected,
            machineState,
            probeHistory,
            consoleMessages,
            sendRaw: providerRef.current.sendRaw,
            send: providerRef.current.send,

        }}>
            {children}
        </CNCContext.Provider>
    );
}

export const useCNC = () => useContext(CNCContext);
