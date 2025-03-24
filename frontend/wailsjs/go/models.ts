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

