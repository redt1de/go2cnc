

## V3 rev
- [x] move connections to a provider interface.
- [x] revamp all controller (fluidnc) file functionality

## TODO
- [ ] fluidnc initial report request happens before full connection is ready
- [ ] fluidnc connection status is not quite right
- [ ] clean up CNCContext, most of the funcs can be removed and called directly via the go exports
- [x] I do not like the current file functionality/code layout
- [ ] probing page needs to decide G90 vs G91
- [ ] add probe grid to probe utils, needs a seperate modal and use keypad??
- [ ] add import/export to probe history

- [x] Break up run explorer group. make seperate components for file browser, file viewer.
- [x] allow editing Gcode files
- [x] change the zerobutton group. make this a util group. zero button shows axis select. then we can add overides
- [x] need a way to display file progress

- [ ] add socket.io provider 
- [ ] add telnet provider
- [ ] add web provider
- [ ] add UART provider (raw PI pins)
- [ ] add cncjs controller, needs socket.io provider




