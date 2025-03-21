## Notes
- current focus is fluidnc + websocket, plain Grbl needs auto polling to be useful
- serial provider is functional, needs testing



## TODO
- [ ] need to organize controllers differently:
    - instead of having fluidnc wrap grbl, have a seperate grbl interface what wraps a generic GrblController.  currently its very messy and confusing.
- [ ] add socket.io provider 
- [ ] add telnet provider
- [ ] add UART provider (raw PI pins)
- [ ] add cncjs controller, needs socket.io provider
- [ ] forceupdate only needs status, and a periodic check of $G and $#




