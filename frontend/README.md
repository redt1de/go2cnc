# Work in progress
!! Use at your own risk !!

# TODO
 - [ ] File interaction (controller specific)
    - [ ] FluidNCController handles files,macros vis $Cmds
    - [ ] CNCJsController handles files,macros via gcode:load type commands
    - [ ] any way to upload/load from usb, pi local disk?????
 
 - [ ] figure out tool and spindle updates, spindle speed doesnt update  
 - [ ] status messages not working right, displaying next to last message
 - [ ] cycle group buttons, disable as needed process various states
 - [ ] connect/disconnect still a little funky. initial socket failure, then connect.


## autolevel
### class
depends on:
 - [X] GrblController.exportHeightMap() -> [{x,y,pz}] 
 - [X] GrblController.clearHeightMap()
 - [X] GrblController.appendHeightMap({x,y,pz})

 autolevel module:
 - [ ] extracts boundaries from a gcode file
 - [ ] probes a grid within the boundaries
 - [ ] generates a heightmap
 - [ ] heightmap can be downloaded??
 - [ ] can be applied to current gcode file

autolevel methods:
 - [ ] Autolevel.getBoundaries(gcode) -> {xmin, xmax, ymin, ymax}
 - [ ] Autolevel.generateProbeGridGcode(min, max, gridsize, depth, feed) -> gcode
 - [ ] Autolevel.applyHeightMap(gcode, HeightMap) -> gcode

### autolevel overlay/workflow
1.  user selects a file in browser and clicks autolevel
2. a popup overlay shows with some options, displays probe boundaries from autolevel module, has options for grid size, probed depth, feed etc, import or probe option
3. user clicks start
4. autolevel module clears probeHistory, send gcode to probe grid, GrblController catches the probe results and updates the probe history
5. when done, autolevel module generates a HeightMap, and gives option to download or apply
6. apply will modify the current gcode file with the heightmap
7. run will execute the adjusted gcode file.


# refs
[autolevel extension](https://github.com/kreso-t/cncjs-kt-ext)  
[autolevel cncjs fork](https://github.com/atmelino/cncjs/tree/autolevelwidget)  
[grbl parsing code](https://github.com/Crazyglue/grbl-parser)  
[pendant example](https://github.com/cncjs/cncjs-pendant-ps3/blob/master/index.js)  
[cncjs API](https://github.com/cncjs/cncjs/wiki/Controller-API)  





# Events CNCJs Emits
```
startup	                 {loadedControllers, baudrates, ports}
config:change	         config
task:start	             taskId
task:finish	             (taskId, code)
task:error	             (taskId, err)

serialport:list	         ports
serialport:change	     {port, inuse=true}
serialport:open	         {port, baudrate, controllerType, inuse=true}
serialport:close	     {port, inuse=false}
serialport:error	     {err, port}
serialport:read	         serial output
serialport:write	     (data, {...context, source})

gcode:load	             (name, gcode, context)
gcode:unload	         none

feeder:status	         {hold, holdReason, queue, pending, changed}
sender:status	         {sp, hold, holdReason, name, context, size, total, sent, received, startTime, finishTime, elapsedTime, remaniningTime}
workflow:state	         workflow.state
controller:settings	     ('Grbl', {version, parameters, settings)
controller:state	     'Grbl', {state, parserstate}
message	


# Events CNCJs Listens
open	   openPort(port, options, callback)
close	   closePort(port, callback)
list	   listPorts(callback)
command	   command(cmd, port, ...args)
write	   write(port, data, context)
writeln	   writeln(port data, context)
```




## GrblState from CNCjs
```json
{
    "status": {
        "activeState": "Alarm",
        "mpos": {
            "x": "0.000",
            "y": "0.000",
            "z": "0.000"
        },
        "wpos": {
            "x": "-2.000",
            "y": "-2.000",
            "z": "2.000"
        },
        "ov": [
            100,
            100,
            100
        ],
        "subState": 0,
        "wco": {
            "x": "2.000",
            "y": "2.000",
            "z": "-2.000"
        },
        "buf": {
            "planner": 15,
            "rx": 128
        },
        "feedrate": 0,
        "spindle": 0
    },
    "parserstate": {
        "modal": {
            "motion": "G0",
            "wcs": "G54",
            "plane": "G17",
            "units": "G21",
            "distance": "G90",
            "feedrate": "G94",
            "spindle": "M5",
            "coolant": "M9"
        },
        "tool": "0",
        "feedrate": "0",
        "spindle": "0"
    }
}
```