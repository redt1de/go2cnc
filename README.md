# V2 Revamp
- changed the main CNC interface to a more generic design. The previous implementation is too complicated to debug and change. The downside of the new model is that each controller type needs a full implementation of websocket,serial etc. I may move this to a modular design in the future but all i really need right now is FluidNC.

## Notes
- current focus is fluidnc + websocket, plain Grbl needs auto polling to be useful
- serial provider is functional, needs testing



## TODO
- [ ] include some UI options in config.yaml, pass to frontend
- [ ] need to organize controllers differently:
    - instead of having fluidnc wrap grbl, have a seperate grbl interface what wraps a generic GrblController.  currently its very messy and confusing.
- [ ] add socket.io provider 
- [ ] add telnet provider
- [ ] add UART provider (raw PI pins)
- [ ] add cncjs controller, needs socket.io provider




