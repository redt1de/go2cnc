import EventEmitter from "events";

const excludedPatterns = [
    /^PING:.*/, // Ignore "PING: ..." messages
    /^CURRENT_ID:.*/,
    /^ACTIVE_ID:.*/,
    /^\$G$/     // Ignore "$G" status requests
];

export default class GrblController extends EventEmitter {
    constructor() {
        super();
        this.send = () => console.error("❌ send() is not initialized");
        this.sendRaw = () => console.error("❌ sendRaw() is not initialized");
        this.probeHistory = []; // ✅ Store probe history
        this.statusInterval = null; 
        this.machineState = {
            state: "Unknown",
            mpos: { x: 0.000, y: 0.000, z: 0.000 },
            wpos: { x: 0.000, y: 0.000, z: 0.000 },
            offsets: { // Store offsets for all work coordinate systems
                G54: { x: 0.000, y: 0.000, z: 0.000 },
                G55: { x: 0.000, y: 0.000, z: 0.000 },
                G56: { x: 0.000, y: 0.000, z: 0.000 },
                G57: { x: 0.000, y: 0.000, z: 0.000 },
                G58: { x: 0.000, y: 0.000, z: 0.000 },
                G59: { x: 0.000, y: 0.000, z: 0.000 }
            },
            activeCS: "G54",  // Default to G54
            feed: 0,
            spindle: 0,
            tlo: 0.000, 
            modal: {
                motion: "G0",
                coordinateSystem: "G54",
                units: "G21",
                plane: "G17",
                distanceMode: "G90",
                feedMode: "G94",
                spindle: "M5",
                coolant: "M9",
                tool: "T0",
                feed: 0,
                spindleSpeed: 0
            }
        };
        this.consoleMessages = [];
        this.listeners = []; // ✅ Ensure listeners array is initialized

        this.on("error", (err) => {
            console.error("GrblController Error:", err);
        });
    }

    pollInitialState(){
        this.send("?"); 
        this.send("$G");
        this.send("$#");
    }

    listFiles() {
        console.log("listFiles is not defined in the current controller.");
    }

    /**
     * Initializes periodic status polling (every 5 seconds)
     */
    startStatusPolling() {
        if (this.statusInterval) return; // Prevent multiple intervals

        console.log("⏳ Starting periodic status polling...");
        this.statusInterval = setInterval(() => {
            console.log("📡 Sending status request: ?");
            this.send("?");
        }, 5000);
    }

    /**
     * Stops status polling (call this on disconnect)
     */
    stopStatusPolling() {
        if (this.statusInterval) {
            console.log("🛑 Stopping status polling...");
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    /**
     * Appends a probe point to the probe history
     */
    appendProbeHistory({ x, y, pz }) {
        this.probeHistory.push({ x, y, pz });
        this.notifyListeners();
    }

    /**
     * Clears the probe history
     */
    clearProbeHistory() {
        this.probeHistory = [];
        this.notifyListeners();
    }

    /**
     * Returns the full probe history
     */
    getProbeHistory() {
        return [...this.probeHistory];
    }


    setSendFunctions(send, sendRaw) {
        this.send = send;
        this.sendRaw = sendRaw;
    }

    addListener(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Listener must be a function");
        }
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.machineState, this.consoleMessages));
    }

    shouldConsole(message){
        if (excludedPatterns.some((regex) => regex.test(message))) {
            return;
        }

        this.consoleMessages.push(message);
        if (this.consoleMessages.length > 200) {  // ✅ Keep console buffer limited
            this.consoleMessages.shift();
        }
        this.notifyListeners();
    }

    parseData(line) {
        line = line.trim();
        if (!line) return;


        if (line.startsWith("<")) {
            const statusUpdate = this.parseStatus(line);
            Object.assign(this.machineState, statusUpdate);
            this.updateWorkPosition();
            this.emit("machineState", this.machineState);
        } else if (line.startsWith("[")) {
            if (line.startsWith("[PRB:")) {
                this.parseProbeResult(line); // ✅ Parse probe result
                this.emit("probe", this.probeHistory);
            } else if(line.startsWith("[GC:")) {
                const modalUpdate = this.parseModal(line);
                Object.assign(this.machineState.modal, modalUpdate);
                this.machineState.activeCS = modalUpdate.coordinateSystem || "G54"; // ✅ Store active coordinate system
                this.emit("machineState", this.machineState);
            } else if (line.match(/\[G5[4-9]:/)) {
                this.parseWorkOffsets(line);
                this.updateWorkPosition();
                this.emit("machineState", this.machineState);
            } else if (line.startsWith("[TLO:")) {
                this.parseToolLengthOffset(line); // ✅ Parse Tool Length Offset
                this.emit("machineState", this.machineState);
            }
        } else if (line.startsWith("ALARM")) {
            this.machineState.state = "ALARM";
            this.emit("alarm", { message: line });
        } else if (line.startsWith("error")) {
            this.emit("error", { message: line });
        } else if (line.startsWith("ok")) {
            this.emit("ok");
        } else {
            this.emit("message", { message: line });
        }

        this.shouldConsole(line);

        this.notifyListeners();
    }

    // /**
    //  * Parses Grbl status reports (`?` command)
    //  */
    // parseStatus(line) {
    //     const statusUpdate = {};

    //     const matches = line.match(/<([^|>]+)(.*)>/);
    //     if (!matches) return statusUpdate;

    //     statusUpdate.state = matches[1];
    //     const attributes = matches[2].split("|");

    //     attributes.forEach(attr => {
    //         if (attr.startsWith("MPos:")) {
    //             const [x, y, z] = attr.slice(5).split(",").map(v => Number(v).toFixed(3));
    //             statusUpdate.mpos = { x: Number(x), y: Number(y), z: Number(z) };  // ✅ Convert back to number
    //         } else if (attr.startsWith("FS:")) {
    //             const [feed, spindle] = attr.slice(3).split(",").map(Number);
    //             statusUpdate.feed = feed;
    //             statusUpdate.spindle = spindle;
    //         }
    //     });

    //     return statusUpdate;
    // }

    parseStatus(line) {
        const statusUpdate = {};
    
        const matches = line.match(/<([^|>]+)(.*)>/);
        if (!matches) return statusUpdate;
    
        statusUpdate.state = matches[1];
        const attributes = matches[2].split("|");
    
        attributes.forEach(attr => {
            if (attr.startsWith("MPos:")) {
                const [x, y, z] = attr.slice(5).split(",").map(v => Number(v));
                statusUpdate.mpos = { x, y, z };
            } else if (attr.startsWith("FS:")) {
                const [feed, spindle] = attr.slice(3).split(",").map(Number);
                statusUpdate.feed = feed;
                statusUpdate.spindle = spindle;
            } else if (attr.startsWith("WCO:")) {
                const [x, y, z] = attr.slice(4).split(",").map(v => Number(v));
                statusUpdate.wco = { x, y, z };
            }
        });
    
        // ✅ Apply WCO to recalculate wpos
        if (statusUpdate.mpos && statusUpdate.wco) {
            statusUpdate.wpos = {
                x: statusUpdate.mpos.x - statusUpdate.wco.x,
                y: statusUpdate.mpos.y - statusUpdate.wco.y,
                z: statusUpdate.mpos.z - statusUpdate.wco.z
            };
        }
    
        return statusUpdate;
    }

    /**
     * Parses and stores work coordinate offsets from `$#`
     */
    parseWorkOffsets(line) {
        const match = line.match(/\[(G5[4-9]):(-?\d+\.\d+),(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        if (match) {
            const cs = match[1];  // Work coordinate system (G54-G59)
            this.machineState.offsets[cs] = {
                x: Number(match[2]).toFixed(3),
                y: Number(match[3]).toFixed(3),
                z: Number(match[4]).toFixed(3)
            };
        }
    }

    /**
     * Recalculates `WPos` using `MPos - Offsets`
     */
    updateWorkPosition() {
        const { mpos, offsets, activeCS } = this.machineState;
        const offset = offsets[activeCS] || { x: 0, y: 0, z: 0 };  // ✅ Use the correct G54-G59 offset

        this.machineState.wpos = {
            x: (mpos.x - offset.x).toFixed(3),
            y: (mpos.y - offset.y).toFixed(3),
            z: (mpos.z - offset.z).toFixed(3)
        };
    }

    /**
     * Parses Tool Length Offset (TLO) from `$#` output.
     * Example: `[TLO:0.000]`
     */
    parseToolLengthOffset(line) {
        const match = line.match(/\[TLO:(-?\d+\.\d+)\]/);
        if (match) {
            this.machineState.tlo = Number(match[1]).toFixed(3); // ✅ Store as float with 3 decimal places
        }
    }

    /**
     * Parses modal state (`$G` output)
     */
    parseModal(line) {
        const modalUpdate = {};
        const modalData = line.slice(4, -1).split(" ");

        modalData.forEach(mode => {
            if (mode.startsWith("G")) {
                if (["G0", "G1", "G2", "G3"].includes(mode)) modalUpdate.motion = mode;
                else if (["G54", "G55", "G56", "G57", "G58", "G59"].includes(mode)) modalUpdate.coordinateSystem = mode;
                else if (["G20", "G21"].includes(mode)) modalUpdate.units = mode;
                else if (["G17", "G18", "G19"].includes(mode)) modalUpdate.plane = mode;
                else if (["G90", "G91"].includes(mode)) modalUpdate.distanceMode = mode;
                else if (["G93", "G94"].includes(mode)) modalUpdate.feedMode = mode;
            } else if (mode.startsWith("M")) {
                if (["M3", "M4", "M5"].includes(mode)) modalUpdate.spindle = mode;
                else if (["M7", "M8", "M9"].includes(mode)) modalUpdate.coolant = mode;
            } else if (mode.startsWith("T")) {
                modalUpdate.tool = mode;
            } else if (mode.startsWith("F")) {
                modalUpdate.feed = Number(mode.slice(1));
            } else if (mode.startsWith("S")) {
                modalUpdate.spindleSpeed = Number(mode.slice(1));
            }
        });

        return modalUpdate;
    }

        /**
     * Parses Grbl probe result
     * Example format: `[PRB: -10.000,5.000,-2.500:1]`
     */
        parseProbeResult(line) {
            const match = line.match(/\[PRB:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*(-?\d+\.\d+):(\d)\]/);
            if (match) {
                const x = parseFloat(match[1]).toFixed(3);
                const y = parseFloat(match[2]).toFixed(3);
                const pz = parseFloat(match[3]).toFixed(3);
                const success = match[4] === "1";
    
                if (success) {
                    this.appendProbeHistory({ x, y, pz });
                }
            }
        }
}

/*
let prbm = /\[PRB:([\+\-\.\d]+),([\+\-\.\d]+),([\+\-\.\d]+),?([\+\-\.\d]+)?:(\d)\]/g.exec(data)
    96	        if (prbm) {
    97	          let prb = [parseFloat(prbm[1]), parseFloat(prbm[2]), parseFloat(prbm[3])]
    98	          let pt = {
    99	            x: prb[0] - this.wco.x,
   100	            y: prb[1] - this.wco.y,
   101	            z: prb[2] - this.wco.z
   102	          }
*/