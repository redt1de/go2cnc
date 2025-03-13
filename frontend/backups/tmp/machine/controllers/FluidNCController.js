import GrblController from "./GrblController";
/*
FluidNC specific controller
*/


export default class FluidNCController extends GrblController {
    constructor() {
        super();
        this.fluidncState = {
            wifi: "",
            hostname: "",
            ip: "",
            mode: "Normal"
        };
    }

    parseData(line) {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("WIFI:")) {
            this.parseWiFiInfo(line);  // ✅ Handle FluidNC-specific messages
        } else if (line.startsWith("MODE:")) {
            this.parseMode(line);
        } else {
            super.parseData(line);  // ✅ Let GrblController handle normal parsing
        }
    }

    parseWiFiInfo(line) {
        const match = line.match(/WIFI: SSID=([^ ]+) IP=([^ ]+)/);
        if (match) {
            this.fluidncState.wifi = match[1];
            this.fluidncState.ip = match[2];
            console.log("📶 FluidNC WiFi:", this.fluidncState);
        }
    }

    parseMode(line) {
        const match = line.match(/MODE: (\w+)/);
        if (match) {
            this.fluidncState.mode = match[1];
            console.log("🛠️ FluidNC Mode:", this.fluidncState.mode);
        }
    }

    listFiles() {
        // this.send(`$Files/ListGcode`);
        this.send(`$Files/ListGcode`);
        // console.log("📁 Listing files...");
    }
}
