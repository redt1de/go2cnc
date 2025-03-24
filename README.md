# V2 Revamp
- changed the main CNC interface to a more generic design. The previous implementation is too complicated to debug and change. The downside of the new model is that each controller type needs a full implementation of websocket,serial etc. I may move this to a modular design in the future but all i really need right now is FluidNC.




## TODO
- [ ] include some UI options in config.yaml, pass to frontend
- [x] need to organize controllers differently:
- [ ] add socket.io provider 
- [ ] add telnet provider
- [ ] add web provider
- [ ] add UART provider (raw PI pins)
- [ ] add cncjs controller, needs socket.io provider




