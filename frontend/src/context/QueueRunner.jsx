import { useCNC } from '../context/CNCContext';
import { useEffect, useRef } from 'react';
import { LogError, LogInfo } from "../../wailsjs/runtime";


export function useCommandRunner() {
    const { sendAsync, status, consoleMessages, consoleMessagesRef } = useCNC();

    const waitForIdle = (startIndex) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(interval);
                reject(new Error("Timeout waiting for idle"));
            }, 60000);

            const interval = setInterval(() => {
                const messages = consoleMessagesRef.current;
                const newMessages = messages.slice(startIndex);
                const hasOK = newMessages.some(msg => String(msg).trim().toLowerCase() === "ok");
                const hasError = newMessages.some(msg => String(msg).trim().toLowerCase().includes("error"));

                if (hasError) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    reject(new Error("CNC returned an error"));
                }

                if (status?.activeState === "Idle" && hasOK) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    resolve("ok");
                }
            }, 100);
        });
    };




    const runCommandQueue = async (queue) => {
        for (const commandFn of queue) {
            const cmd = typeof commandFn === 'function' ? commandFn() : commandFn;

            const startIndex = consoleMessagesRef.current.length;

            await sendAsync(cmd);
            try {
                const result = await waitForIdle(startIndex);
                LogInfo(`✅ Command "${cmd}" completed:`, result);
            } catch (err) {
                LogError(`❌ Command "${cmd}" failed:`, err.message);
                break;
            }
        }
    };

    return { runCommandQueue };
}
