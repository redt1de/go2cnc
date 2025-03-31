
#### Real-time Status Reports

- Contains real-time data of Grbl’s state, position, and other data required independently of the stream.

- Categorized as a real-time message, where it is a separate message that should not be counted as part of the streaming protocol. It may appear at any given time.

- A status report is initiated by sending Grbl a '?' character.

  - Like all real-time commands, the '?' character is intercepted and never enters the serial buffer. It's never a part of the stream and can be sent at any time.

  - Grbl will generate and transmit a report within ~5-20 milliseconds.

  - Every ’?’ command sent by a GUI is not guaranteed with a response. The following are the current scenarios when Grbl may not immediately or ignore a status report request. _NOTE: These may change in the future and will be documented here._

    - If two or more '?' queries are sent before the first report is generated, the additional queries are ignored.

    - A soft-reset commanded clears the last status report query.

    - When Grbl throws a critical alarm from a limit violation. A soft-reset is required to resume operation.

    - During a homing cycle.

- **Message Construction:**

  - A message is a single line of ascii text, completed by a carriage return and line feed.

  - `< >` Chevrons uniquely enclose reports to indicate message type.

  - `|` Pipe delimiters separate data fields inside the report.

  - The first data field is an exception to the following data field rules. See 'Machine State' description for details.

  - All remaining data fields consist of a data type followed by a `:` colon delimiter and data values. `type:value(s)`

  - Data values are given either as as one or more pre-defined character codes to indicate certain states/conditions or as numeric values, which are separated by a `,` comma delimiter when more than one is present. Numeric values are also in a pre-defined order and units of measure.

  - The first (Machine State) and second (Current Position) data fields are always included in every report.

  - Assume any following data field may or may not exist and can be in any order. The `$10` status report mask setting can alter what data is present and certain data fields can be reported intermittently (see descriptions for details.)

  - The `$13` report inches settings alters the units of some data values. `$13=0` false indicates mm-mode, while `$13=1` true indicates inch-mode reporting. Keep note of this setting and which report values can be altered.

- **Data Field Descriptions:**

    - **Machine State:**

      - Valid states types:  `Idle, Run, Hold, Jog, Alarm, Door, Check, Home, Sleep`

      - Sub-states may be included via `:` a colon delimiter and numeric code.

      - Current sub-states are:

        	- `Hold:0` Hold complete. Ready to resume.
	     	- `Hold:1` Hold in-progress. Reset will throw an alarm.
        	- `Door:0` Door closed. Ready to resume.
        	- `Door:1` Machine stopped. Door still ajar. Can't resume until closed.
        	- `Door:2` Door opened. Hold (or parking retract) in-progress. Reset will throw an alarm.
			- `Door:3` Door closed and resuming. Restoring from park, if applicable. Reset will throw an alarm.

      - This data field is always present as the first field.

    - **Current Position:**

        - Depending on `$10` status report mask settings, position may be sent as either:

          - `MPos:0.000,-10.000,5.000` machine position or
          - `WPos:-2.500,0.000,11.000` work position

        - **NOTE: Grbl v1.1 sends only one position vector because a GUI can easily compute the other position vector with the work coordinate offset `WCO:` data. See WCO description for details.**

        - Three position values are given in the order of X, Y, and Z. A fourth position value may exist in later versions for the A-axis.

        - `$13` report inches user setting effects these values and is given as either mm or inches.

        - This data field is always present as the second field.

    - **Work Coordinate Offset:**

        - `WCO:0.000,1.551,5.664` is the current work coordinate offset of the g-code parser, which is the sum of the current work coordinate system, G92 offsets, and G43.1 tool length offset.

        - Machine position and work position are related by this simple equation per axis: `WPos = MPos - WCO`
        
        	- **GUI Developers:** Simply track and retain the last `WCO:` vector and use the above equation to compute the other position vector for your position readouts. If Grbl's status reports show either `WPos` or `MPos`, just follow the equations below. It's as easy as that!
        		- If `WPos:` is given, use `MPos = WPos + WCO`.
        		- If `MPos:` is given, use `WPos = MPos - WCO`.

        - Values are given in the order of the X,Y, and Z axes offsets. A fourth offset value may exist in later versions for the A-axis.
        - `$13` report inches user setting effects these values and is given as either mm or inches.

        - `WCO:` values don't change often during a job once set and only requires intermittent refreshing.

        - This data field appears:

          - In every 10 or 30 (configurable 1-255) status reports, depending on if Grbl is in a motion state or not.
          - Immediately in the next report, if an offset value has changed.
          - In the first report after a reset/power-cycle.

        - This data field will not appear if:

          - It is disabled in the config.h file. No `$` mask setting available.
          - The refresh counter is in-between intermittent reports.       

    - **Buffer State:**

        - `Bf:15,128`. The first value is the number of available blocks in the planner buffer and the second is number of available bytes in the serial RX buffer.
        
        - The usage of this data is generally for debugging an interface, but is known to be used to control some GUI-specific tasks. While this is disabled by default, GUIs should expect this data field to appear, but they may ignore it, if desired.
        
        	- IMPORTANT: Do not use this buffer data to control streaming. During a stream, the reported buffer will often be out-dated and may be incorrect by the time it has been received by the GUI. Instead, please use the streaming protocols outlined. They use Grbl's responses as a direct way to accurately determine the buffer state.
        	        
        - NOTE: The buffer state values changed from showing "in-use" blocks or bytes to "available". This change does not require the GUI knowing how many block/bytes Grbl has been compiled with.

        - This data field appears:
        
          - In every status report when enabled. It is disabled in the settings mask by default.
        
        - This data field will not appear if:

          - It is disabled by the `$` status report mask setting or disabled in the config.h file.

    - **Line Number:**

        - `Ln:99999` indicates line 99999 is currently being executed. This differs from the `$G` line `N` value since the parser is usually queued few blocks behind execution.

        - Compile-time option only because of memory requirements. However, if a GUI passes indicator line numbers onto Grbl, it's very useful to determine when Grbl is executing them.

        - This data field will not appear if:

          - It is disabled in the config.h file. No `$` mask setting available.
          - The line number reporting not enabled in config.h. Different option to reporting data field.
          - No line number or `N0` is passed with the g-code block.
          - Grbl is homing, jogging, parking, or performing a system task/motion.
          - There is no motion in the g-code block like a `G4P1` dwell. (May be fixed in later versions.)

    - **Current Feed and Speed:**

        - There are two versions of this data field that Grbl may respond with. 
        
        	- `F:500` contains real-time feed rate data as the value. This appears only when VARIABLE_SPINDLE is disabled in config.h, because spindle speed is not tracked in this mode.
        	- `FS:500,8000` contains real-time feed rate, followed by spindle speed, data as the values. Note the `FS:`, rather than `F:`, data type name indicates spindle speed data is included.
                
        - The current feed rate value is in mm/min or inches/min, depending on the `$` report inches user setting. 
        - The second value is the current spindle speed in RPM
        
        - These values will often not be the programmed feed rate or spindle speed, because several situations can alter or limit them. For example, overrides directly scale the programmed values to a different running value, while machine settings, acceleration profiles, and even the direction traveled can also limit rates to maximum values allowable.

        - As a operational note, reported rate is typically 30-50 msec behind actual position reported.

        - This data field will always appear, unless it was explicitly disabled in the config.h file.

    - **Input Pin State:**

        - `Pn:XYZPDHRS` indicates which input pins Grbl has detected as 'triggered'.

        - Pin state is evaluated every time a status report is generated. All input pin inversions are appropriately applied to determine 'triggered' states.

        - Each letter of `XYZPDHRS` denotes a particular 'triggered' input pin.

          - `X Y Z` XYZ limit pins, respectively
          - `P` the probe pin.
          - `D H R S` the door, hold, soft-reset, and cycle-start pins, respectively.
          - Example: `Pn:PZ` indicates the probe and z-limit pins are 'triggered'.
          - Note: `A` may be added in later versions for an A-axis limit pin.

        - Assume input pin letters are presented in no particular order.

        - One or more 'triggered' pin letter(s) will always be present with a `Pn:` data field.

        - This data field will not appear if:

          - It is disabled in the config.h file. No `$` mask setting available.
          - No input pins are detected as triggered.

    - **Override Values:**

        - `Ov:100,100,100` indicates current override values in percent of programmed values for feed, rapids, and spindle speed, respectively.

        - Override maximum, minimum, and increment sizes are all configurable within config.h. Assume that a user or OEM will alter these based on customized use-cases. Recommend not hard-coding these values into a GUI, but rather just show the actual override values and generic increment buttons.

        - Override values don't change often during a job once set and only requires intermittent refreshing. This data field appears:

          - After 10 or 20 (configurable 1-255) status reports, depending on is in a motion state or not.
          - If an override value has changed, this data field will appear immediately in the next report. However, if `WCO:` is present, this data field will be delayed one report.
          - In the second report after a reset/power-cycle.

        - This data field will not appear if:

          - It is disabled in the config.h file. No `$` mask setting available.
          - The override refresh counter is in-between intermittent reports.
          - `WCO:` exists in current report during refresh. Automatically set to try again on next report.

	- **Accessory State:**

		- `A:SFM` indicates the current state of accessory machine components, such as the spindle and coolant.

		- Due to the new toggle overrides, these machine components may not be running according to the g-code program. This data is provided to ensure the user knows exactly what Grbl is doing at any given time.
		
		- Each letter after `A:` denotes a particular state. When it appears, the state is enabled. When it does not appear, the state is disabled.

			- `S` indicates spindle is enabled in the CW direction. This does not appear with `C`.
			- `C` indicates spindle is enabled in the CCW direction. This does not appear with `S`.
        	- `F` indicates flood coolant is enabled.
        	- `M` indicates mist coolant is enabled.
		
	   - Assume accessory state letters are presented in no particular order.
      
      - This data field appears:

			- When any accessory state is enabled.
        	- Only with the override values field in the same message. Any accessory state change will trigger the accessory state and override values fields to be shown on the next report.

      - This data field will not appear if:

        	- No accessory state is active.
        	- It is disabled in the config.h file. No `$` mask setting available.
        	- If override refresh counter is in-between intermittent reports.
        	- `WCO:` exists in current report during refresh. Automatically set to try again on next report.