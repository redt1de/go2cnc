export namespace config {
	
	export class Config {
	    macroPath: string;
	    localFsPath: string;
	    logLevel: number;
	    logFile: string;
	    fluidnc: fluidnc.FluidNCConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.macroPath = source["macroPath"];
	        this.localFsPath = source["localFsPath"];
	        this.logLevel = source["logLevel"];
	        this.logFile = source["logFile"];
	        this.fluidnc = this.convertValues(source["fluidnc"], fluidnc.FluidNCConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace fileman {
	
	export class FileInfo {
	    name: string;
	    path: string;
	    size: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	    }
	}
	export class FileList {
	    files: FileInfo[];
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new FileList(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.files = this.convertValues(source["files"], FileInfo);
	        this.path = source["path"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace fluidnc {
	
	export class StreamConfig {
	    simple: boolean;
	    rx_buffer: number;
	    line_buffer: number;
	
	    static createFrom(source: any = {}) {
	        return new StreamConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.simple = source["simple"];
	        this.rx_buffer = source["rx_buffer"];
	        this.line_buffer = source["line_buffer"];
	    }
	}
	export class FluidNCConfig {
	    websocket?: websocket.WebSocketConfig;
	    api_url: string;
	    devProxy: string;
	    stream?: StreamConfig;
	
	    static createFrom(source: any = {}) {
	        return new FluidNCConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.websocket = this.convertValues(source["websocket"], websocket.WebSocketConfig);
	        this.api_url = source["api_url"];
	        this.devProxy = source["devProxy"];
	        this.stream = this.convertValues(source["stream"], StreamConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace state {
	
	export class ProbeResult {
	    x: number;
	    y: number;
	    z: number;
	    success: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProbeResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	        this.z = source["z"];
	        this.success = source["success"];
	    }
	}

}

export namespace websocket {
	
	export class WebSocketConfig {
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new WebSocketConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	    }
	}

}

