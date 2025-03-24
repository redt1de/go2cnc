

; Pendant will set the following global variables (FLUIDNC ONLY):
; #<_pdist>=${probeDistance}
; #<_pfeed>=${feedRate}
; #<_pretract>=${retract}
#<start_x>=#<_x>
#<start_y>=#<_y>
#<start_z>=#<_z>

G91 G38.2 X[-#<_pdist>] F[#<_pfeed>]
#<x_min>=#<_x>
G91 G0 X[#<_pretract>]

G91 G38.2 X[[#<_pdist>]*2] F[#<_pfeed>]
#<x_max>=#<_x>
G91 G0 X[-#<_pretract>]

#<center>=[[#<x_max>-#<x_min>]/2]
G91 G0 X[-#<center>+[#<_pretract>]]

G91 G38.2 Y[-#<_pdist>] F[#<_pfeed>]
#<y_min>=#<_y>
G91 G0 Y[#<_pretract>]

G91 G38.2 Y[[#<_pdist>]*2] F[#<_pfeed>]
#<y_max>=#<_y>
G91 G0 Y[-#<_pretract>]

#<center>=[[#<y_max>-#<y_min>]/2]
G91 G0 Y[-#<center>+[#<_pretract>]]