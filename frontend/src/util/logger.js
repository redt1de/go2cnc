import {
    LogError as WailsLogError,
    LogInfo as WailsLogInfo,
    LogDebug as WailsLogDebug,
    LogTrace as WailsLogTrace,
} from '../../wailsjs/runtime';
import { AppConfig } from "../context/CNCContext";

function parseStack(stack) {
    const ll = AppConfig?.logLevel || 3;
    if (ll <4) {
        return "";
    }
    const lines = stack.split("\n");
    const target = lines[1] || "";
    const match = target.match(/@(.+):(\d+):(\d+)/);
    if (match) {
        const [_, file, line, col] = match;
        const shortFile = file.split("/").slice(-2).join("/");
        return `${shortFile}:${line}:${col}`;
    }
    return "unknown";
}

function formatArgs(args) {
    return args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
}

export function LogError(...args) {
    const stack = new Error().stack;
    const location = parseStack(stack);
    const message = formatArgs(args);
    WailsLogError(`${message} (${location})`);
}

export function LogInfo(...args) {
    const stack = new Error().stack;
    const location = parseStack(stack);
    const message = formatArgs(args);
    WailsLogInfo(`${message} (${location})`);
}

export function LogDebug(...args) {
    const stack = new Error().stack;
    const location = parseStack(stack);
    const message = formatArgs(args);
    WailsLogDebug(`${message} (${location})`);
}

export function LogTrace(...args) {
    const stack = new Error().stack;
    const location = parseStack(stack);
    const message = formatArgs(args);
    WailsLogTrace(`${message} (${location})`);
}

// import { LogError as WailsLogError, LogInfo as WailsLogInfo, LogDebug as WailsLogDebug } from '../../wailsjs/runtime/runtime';

// export function LogError(message) {
//     const stack = new Error().stack;
//     const lineInfo = parseStack(stack);
//     WailsLogError(`${message} (${lineInfo})`);
// }

// export function LogInfo(message) {
//     const stack = new Error().stack;
//     const lineInfo = parseStack(stack);
//     WailsLogInfo(`${message} (${lineInfo})`);
// }

// export function LogDebug(message) {
//     const stack = new Error().stack;
//     const lineInfo = parseStack(stack);
//     WailsLogDebug(`${message} (${lineInfo})`);
// }


// function parseStack(stack) {
//     const lines = stack.split("\n");

//     // Use the *second* line (index 1) — the line after LogError
//     const target = lines[1] || "";

//     const match = target.match(/@(.+):(\d+):(\d+)/);
//     if (match) {
//         const [_, file, line, col] = match;
//         const shortFile = file.split("/").slice(-2).join("/"); // e.g. views/RunView.jsx
//         return `${shortFile}:${line}:${col}`;
//     }

//     return "unknown";
// }