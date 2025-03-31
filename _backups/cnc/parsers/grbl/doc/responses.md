
## Interacting with Grbl's Systems

Along with streaming a G-code program, there a few more things to consider when writing a GUI for Grbl, such as how to use status reporting, real-time control commands, dealing with EEPROM, and general message handling.

#### Status Reporting
When a `?` character is sent to Grbl (no additional line feed or carriage return character required), it will immediately respond with something like `<Idle|MPos:0.000,0.000,0.000|FS:0.0,0>` to report its state and current position. The `?` is always picked-off and removed from the serial receive buffer whenever Grbl detects one. So, these can be sent at any time. Also, to make it a little easier for GUIs to pick up on status reports, they are always encased by `<>` chevrons.

Developers can use this data to provide an on-screen position digital-read-out (DRO) for the user and/or to show the user a 3D position in a virtual workspace. We recommend querying Grbl for a `?` real-time status report at no more than 5Hz. 10Hz may be possible, but at some point, there are diminishing returns and you are taxing Grbl's CPU more by asking it to generate and send a lot of position data.

Grbl's status report is fairly simply in organization. It always starts with a word describing the machine state like `IDLE` (descriptions of these are available elsewhere in the Wiki). The following data values are usually in the order listed below and separated by `|` pipe characters, but may not be in the exact order or printed at all. For a complete description of status report formatting, read the _Real-time Status Reports_ section below.

#### Real-Time Control Commands
The real-time control commands, `~` cycle start/resume, `!` feed hold,  `^X` soft-reset, and all of the override commands, all immediately signal Grbl to change its running state. Just like `?` status reports, these control characters are picked-off and removed from the serial buffer when they are detected and do not require an additional line-feed or carriage-return character to operate.

One important note are the override command characters. These are defined in the extended-ASCII character space and are generally not type-able on a keyboard. A GUI must be able to send these 8-bit values to support overrides. 

#### EEPROM Issues
EEPROM access on the Arduino AVR CPUs turns off all of the interrupts while the CPU _writes_ to EEPROM. This poses a problem for certain features in Grbl, particularly if a user is streaming and running a g-code program, since it can pause the main step generator interrupt from executing on time. Most of the EEPROM access is restricted by Grbl when it's in certain states, but there are some things that developers need to know.

* Settings should not be streamed with the character-counting streaming protocols. Only the simple send-response protocol works. This is because during the EEPROM write, the AVR CPU also shuts-down the serial RX interrupt, which means data can get corrupted or lost. This is safe with the send-response protocol, because it's not sending data after commanding Grbl to save data.

For reference:
* Grbl's EEPROM write commands: `G10 L2`, `G10 L20`, `G28.1`, `G30.1`, `$x=`, `$I=`, `$Nx=`, `$RST=`
* Grbl's EEPROM read commands: `G54-G59`, `G28`, `G30`, `$$`, `$I`, `$N`, `$#`

#### G-code Error Handling

Grbl's g-code parser is fully standards-compilant with complete error-checking. When a G-code parser detects an error in a G-code block/line, the parser will dump everything in the block from memory and report an `error:` back to the user or GUI. This dump is absolutely the right thing to do, because a g-code line with an error can be interpreted in multiple ways. However, this dump can be problematic, because the bad G-code block may have contained some valuable positioning commands or feed rate settings that the following g-code depends on.

It's highly recommended to do what all professional CNC controllers do when they detect an error in the G-code program, _**halt**_. Don't do anything further until the user has modified the G-code and fixed the error in their program. Otherwise, bad things could happen.

As a service to GUIs, Grbl has a "check G-code" mode, enabled by the `$C` system command. GUIs can stream a G-code program to Grbl, where it will parse it, error-check it, and report `ok`'s and `errors:`'s without powering on anything or moving. So GUIs can pre-check the programs before streaming them for real. To disable the "check G-code" mode, send another `$C` system command and Grbl will automatically soft-reset to flush and re-initialize the G-code parser and the rest of the system. This perhaps should be run in the background when a user first loads a program, before a user sets up his machine. This flushing and re-initialization clears `G92`'s by G-code standard, which some users still incorrectly use to set their part zero.

#### Jogging

As of Grbl v1.1, a new jogging feature is available that accepts incremental, absolute, or absolute override motions, along with a jog cancel real-time command that will automatically feed hold and purge the planner buffer. The most important aspect of the new jogging motion is that it is completely independent from the g-code parser, so GUIs no longer have to ensure the g-code modal states are set back correctly after jogging is complete. See the jogging document for more details on how it works and how you can use it with an analog joystick or rotary dial.

#### Synchronization

For situations when a GUI needs to run a special set of commands for tool changes, auto-leveling, etc, there often needs to be a way to know when Grbl has completed a task and the planner buffer is empty. The absolute simplest way to do this is to insert a `G4 P0.01` dwell command, where P is in seconds and must be greater than 0.0. This acts as a quick force-synchronization and ensures the planner buffer is completely empty before the GUI sends the next task to execute.

-----
# Message Summary

In v1.1, Grbl's interface protocol has been tweaked in the attempt to make GUI development cleaner, clearer, and hopefully easier. All messages are designed to be deterministic without needing to know the context of the message. Each can be inferred to a much greater degree than before just by the message type, which are all listed below.

- **Response Messages:** Normal send command and execution response acknowledgement. Used for streaming.

	- `ok` : Indicates the command line received was parsed and executed (or set to be executed).
	- `error:x` : Indicated the command line received contained an error, with an error code `x`, and was purged. See error code section below for definitions.

- **Push Messages:**
	
	- `< >` : Enclosed chevrons contains status report data.
	- `Grbl X.Xx ['$' for help]` : Welcome message indicates initialization.
	- `ALARM:x` : Indicates an alarm has been thrown. Grbl is now in an alarm state.	
	- `$x=val` and `$Nx=line` indicate a settings printout from a `$` and `$N` user query, respectively.
	- `[MSG:]` : Indicates a non-queried feedback message.
	- `[GC:]` : Indicates a queried `$G` g-code state message.
	- `[HLP:]` : Indicates the help message.
	- `[G54:]`, `[G55:]`, `[G56:]`, `[G57:]`, `[G58:]`, `[G59:]`, `[G28:]`, `[G30:]`, `[G92:]`, `[TLO:]`, and `[PRB:]` messages indicate the parameter data printout from a `$#` user query.
	- `[VER:]` : Indicates build info and string from a `$I` user query.
	- `[echo:]` : Indicates an automated line echo from a pre-parsed string prior to g-code parsing. Enabled by config.h option.
	- `>G54G20:ok` : The open chevron indicates startup line execution. The `:ok` suffix shows it executed correctly without adding an unmatched `ok` response on a new line.

In addition, all `$x=val` settings, `error:`, and `ALARM:` messages no longer contain human-readable strings, but rather codes that are defined in other documents. The `$` help message is also reduced to just showing the available commands. Doing this saves incredible amounts of flash space. Otherwise, the new overrides features would not have fit.

Other minor changes and bug fixes that may effect GUI parsing include:

- Floating point values printed with zero precision do not show a decimal, or look like an integer. This includes spindle speed RPM and feed rate in mm mode.
- `$G` reports fixed a long time bug with program modal state. It always showed `M0` program pause when running. Now during a normal program run, no program modal state is given until an `M0`, `M2`, or `M30` is active and then the appropriate state will be shown.

On a final note, this interface tweak came about out of necessity, as more data is being sent back from Grbl and it is capable of doing many more things. It's not intended to be altered again in the near future, if at all. This is likely the only and last major change to this. If you have any comments or suggestions before Grbl v1.1 goes to master, please do immediately so we can all vet the new alteration before its installed.





---------

# Grbl Response Messages

Every G-code block sent to Grbl and Grbl `$` system command that is terminated with a return will be parsed and processed by Grbl. Grbl will then respond either if it recognized the command with an `ok` line or if there was a problem with an `error` line.

* **`ok`**: All is good! Everything in the last line was understood by Grbl and was successfully processed and executed.

  - If an empty line with only a return is sent to Grbl, it considers it a valid line and will return an `ok` too, except it didn't do anything.


* **`error:X`**: Something went wrong! Grbl did not recognize the command and did not execute anything inside that message. The `X` is given as a numeric error code to tell you exactly what happened. The table below decribes every one of them.

	| ID | Error Code Description |
|:-------------:|----|
| **`1`** | G-code words consist of a letter and a value. Letter was not found. |
| **`2`** | Numeric value format is not valid or missing an expected value. |
| **`3`** | Grbl '$' system command was not recognized or supported. |
| **`4`** | Negative value received for an expected positive value. |
| **`5`** | Homing cycle is not enabled via settings. |
| **`6`** | Minimum step pulse time must be greater than 3usec |
| **`7`** | EEPROM read failed. Reset and restored to default values. |
| **`8`** | Grbl '$' command cannot be used unless Grbl is IDLE. Ensures smooth operation during a job. |
| **`9`** | G-code locked out during alarm or jog state |
| **`10`** | Soft limits cannot be enabled without homing also enabled. |
| **`11`** | Max characters per line exceeded. Line was not processed and executed. |
| **`12`** | (Compile Option) Grbl '$' setting value exceeds the maximum step rate supported. |
| **`13`** | Safety door detected as opened and door state initiated. |
| **`14`** | (Grbl-Mega Only) Build info or startup line exceeded EEPROM line length limit. |
| **`15`** | Jog target exceeds machine travel. Command ignored. |
| **`16`** | Jog command with no '=' or contains prohibited g-code. |
| **`17`** | Laser mode disabled. Requires PWM output. |
| **`20`** | Unsupported or invalid g-code command found in block. |
| **`21`** | More than one g-code command from same modal group found in block.|
| **`22`** | Feed rate has not yet been set or is undefined. |
| **`23`** | G-code command in block requires an integer value. |
| **`24`** | Two G-code commands that both require the use of the `XYZ` axis words were detected in the block.|
| **`25`** | A G-code word was repeated in the block.|
| **`26`** | A G-code command implicitly or explicitly requires `XYZ` axis words in the block, but none were detected.|
| **`27`**| `N` line number value is not within the valid range of `1` - `9,999,999`. |
| **`28`** | A G-code command was sent, but is missing some required `P` or `L` value words in the line. |
| **`29`** | Grbl supports six work coordinate systems `G54-G59`. `G59.1`, `G59.2`, and `G59.3` are not supported.|
| **`30`**| The `G53` G-code command requires either a `G0` seek or `G1` feed motion mode to be active. A different motion was active.|
| **`31`** | There are unused axis words in the block and `G80` motion mode cancel is active.|
| **`32`** | A `G2` or `G3` arc was commanded but there are no `XYZ` axis words in the selected plane to trace the arc.|
| **`33`** | The motion command has an invalid target. `G2`, `G3`, and `G38.2` generates this error, if the arc is impossible to generate or if the probe target is the current position.|
| **`34`** | A `G2` or `G3` arc, traced with the radius definition, had a mathematical error when computing the arc geometry. Try either breaking up the arc into semi-circles or quadrants, or redefine them with the arc offset definition.|
| **`35`** | A `G2` or `G3` arc, traced with the offset definition, is missing the `IJK` offset word in the selected plane to trace the arc.|
| **`36`** | There are unused, leftover G-code words that aren't used by any command in the block.|
| **`37`** | The `G43.1` dynamic tool length offset command cannot apply an offset to an axis other than its configured axis. The Grbl default axis is the Z-axis.|
| **`38`** | Tool number greater than max supported value.|


----------------------

# Grbl Push Messages

Along with the response message to indicate successfully executing a line command sent to Grbl, Grbl provides additional push messages for important feedback of its current state or if something went horribly wrong. These messages are "pushed" from Grbl and may appear at anytime. They are usually in response to a user query or some system event that Grbl needs to tell you about immediately. These push messages are organized into six general classes:

- **_Welcome message_** - A unique message to indicate Grbl has initialized.

- **_ALARM messages_** - Means an emergency mode has been enacted and shut down normal use.

- **_'$' settings messages_** - Contains the type and data value for a Grbl setting.

- **_Feedback messages_** - Contains general feedback and can provide useful data.

- **_Startup line execution_** - Indicates a startup line as executed with the line itself and how it went.

- **_Real-time status reports_** - Contains current run data like state, position, and speed.


------

#### Welcome Message

**`Grbl X.Xx ['$' for help]`**

The start up message always prints upon startup and after a reset. Whenever you see this message, this also means that Grbl has completed re-initializing all its systems, so everything starts out the same every time you use Grbl.

* `X.Xx` indicates the major version number, followed by a minor version letter. The major version number indicates the general release, while the letter simply indicates a feature update or addition from the preceding minor version letter.
* Bug fix revisions are tracked by the build info version number, printed when an `$I` command is sent. These revisions don't update the version number and are given by date revised in year, month, and day, like so `20161014`.

-----

#### Alarm Message

Alarm is an emergency state. Something has gone terribly wrong when these occur. Typically, they are caused by limit error when the machine has moved or wants to move outside the machine travel and crash into the ends. They also report problems if Grbl is lost and can't guarantee positioning or a probe command has failed. Once in alarm-mode, Grbl will lock out all g-code functionality and accept only a small set of commands. It may even stop everything and force you to acknowledge the problem until you issue Grbl a reset. While in alarm-mode, the user can override the alarm manually with a specific command, which then re-enables g-code so you can move the machine again. This ensures the user knows about the problem and has taken steps to fix or account for it.

Similar to error messages, all alarm messages are sent as  **`ALARM:X`**, where `X` is an alarm code to tell you exacly what caused the alarm. The table below describes the meaning of each alarm code.

| ID | Alarm Code Description |
|:-------------:|----|
| **`1`** | Hard limit triggered. Machine position is likely lost due to sudden and immediate halt. Re-homing is highly recommended. |
| **`2`** | G-code motion target exceeds machine travel. Machine position safely retained. Alarm may be unlocked. |
| **`3`** | Reset while in motion. Grbl cannot guarantee position. Lost steps are likely. Re-homing is highly recommended. |
| **`4`** | Probe fail. The probe is not in the expected initial state before starting probe cycle, where G38.2 and G38.3 is not triggered and G38.4 and G38.5 is triggered. |
| **`5`** | Probe fail. Probe did not contact the workpiece within the programmed travel for G38.2 and G38.4. |
| **`6`** | Homing fail. Reset during active homing cycle. |
| **`7`** | Homing fail. Safety door was opened during active homing cycle. |
| **`8`** | Homing fail. Cycle failed to clear limit switch when pulling off. Try increasing pull-off setting or check wiring. |
| **`9`** | Homing fail. Could not find limit switch within search distance. Defined as `1.5 * max_travel` on search and `5 * pulloff` on locate phases. |

-------

#### Grbl `$` Settings Message

When a push message starts with a `$`, this indicates Grbl is sending a setting and its configured value. There are only two types of settings messages: a single setting and value `$x=val` and a startup string setting `$Nx=line`. See [Configuring Grbl v1.x] document if you'd like to learn how to write these values for your machine.

- `$x=val` will only appear when the user queries to print all of Grbl's settings via the `$$` print settings command. It does so sequentially and completes with an `ok`.

  - In prior versions of Grbl, the `$` settings included a short description of the setting immediately after the value. However, due to flash restrictions, most human-readable strings were removed to free up flash for the new override features in Grbl v1.1. In short, it was these strings or overrides, and overrides won. Keep in mind that once these values are set, they usually don't change, and GUIs will likely provide the assistance of translating these codes for users.

  - _**NOTE for GUI developers:**_ _As with the error and alarm codes, settings codes are available in an easy to parse CSV file in the `/doc/csv` folder. These are continually updated._

  - The `$$` settings print out is shown below and the following describes each setting.

    ```
$0=10
$1=25
$2=0
$3=0
$4=0
$5=0
$6=0
$10=255
$11=0.010
$12=0.002
$13=0
$20=0
$21=0
$22=0
$23=0
$24=25.000
$25=500.000
$26=250
$27=1.000
$30=1000
$31=0
$32=0
$100=250.000
$101=250.000
$102=250.000
$110=500.000
$111=500.000
$112=500.000
$120=10.000
$121=10.000
$122=10.000
$130=200.000
$131=200.000
$132=200.000
ok
```

	| `$x` Code | Setting Description, Units |
|:-------------:|----|
| **`0`** | Step pulse time, microseconds |
| **`1`** | Step idle delay, milliseconds |
| **`2`** | Step pulse invert, mask |
| **`3`** | Step direction invert, mask |
| **`4`** | Invert step enable pin, boolean |
| **`5`** | Invert limit pins, boolean |
| **`6`** | Invert probe pin, boolean |
| **`10`** | Status report options, mask |
| **`11`** | Junction deviation, millimeters |
| **`12`** | Arc tolerance, millimeters |
| **`13`** | Report in inches, boolean |
| **`20`** | Soft limits enable, boolean |
| **`21`** | Hard limits enable, boolean |
| **`22`** | Homing cycle enable, boolean |
| **`23`** | Homing direction invert, mask |
| **`24`** | Homing locate feed rate, mm/min |
| **`25`** | Homing search seek rate, mm/min  |
| **`26`** | Homing switch debounce delay, milliseconds |
| **`27`** | Homing switch pull-off distance, millimeters |
| **`30`** | Maximum spindle speed, RPM |
| **`31`** | Minimum spindle speed, RPM |
| **`32`** | Laser-mode enable, boolean |
| **`100`** | X-axis steps per millimeter |
| **`101`** | Y-axis steps per millimeter |
| **`102`** | Z-axis steps per millimeter |
| **`110`** | X-axis maximum rate, mm/min |
| **`111`** | Y-axis maximum rate, mm/min |
| **`112`** | Z-axis maximum rate, mm/min |
| **`120`** | X-axis acceleration, mm/sec^2 |
| **`121`** | Y-axis acceleration, mm/sec^2 |
| **`122`** | Z-axis acceleration, mm/sec^2 |
| **`130`** | X-axis maximum travel, millimeters |
| **`131`** | Y-axis maximum travel, millimeters |
| **`132`** | Z-axis maximum travel, millimeters |


- The other `$Nx=line` message is the print-out of a user-defined startup line, where `x` denotes the startup line order and ranges from `0` to `1` by default. The `line` denotes the startup line to be executed by Grbl upon reset or power-up, except during an ALARM.

  - When a user queries for the startup lines via a `$N` command, the following is sent by Grbl and completed by an `ok` response. The first line sets the initial startup work coordinate system to `G54`, while the second line is empty and does not execute.
  ```
  $N0=G54
  $N1=
  ok
  ```


------

#### Feedback Messages

Feedback messages provide non-critical information on what Grbl is doing, what it needs, and/or provide some non-real-time data for the user when queried. Not too complicated. Feedback message are always enclosed in `[]` brackets, except for the startup line execution message which begins with an open chevron character `>`.

- **Non-Queried Feedback Messages:** These feedback messages that may appear at any time and is not part of a query are listed and described below. They are usually sent as an additional helpful acknowledgement of some event or command executed. These always start with a `[MSG:` to denote their type.

  - `[MSG:Reset to continue]` - Critical event message. Reset is required before Grbl accepts any other commands. This prevents ongoing command streaming and risking a motion before the alarm is acknowledged. Only hard or soft limit errors send this message immediately after the ALARM:x code.

  - `[MSG:‘$H’|’$X’ to unlock]`- Alarm state is active at initialization. This message serves as a reminder note on how to cancel the alarm state. All g-code commands and some ‘$’ are blocked until the alarm state is cancelled via homing `$H` or unlocking `$X`. Only appears immediately after the `Grbl` welcome message when initialized with an alarm. Startup lines are not executed at initialization if this message is present and the alarm is active.

  - `[MSG:Caution: Unlocked]` - Appears as an alarm unlock `$X` acknowledgement. An 'ok' still appears immediately after to denote the `$X` was parsed and executed. This message reminds the user that Grbl is operating under an unlock state, where startup lines have still not be executed and should be cautious and mindful of what they do. Grbl may not have retained machine position due to an alarm suddenly halting the machine.  A reset or re-homing Grbl is highly recommended as soon as possible, where any startup lines will be properly executed.

  - `[MSG:Enabled]` - Appears as a check-mode `$C` enabled acknowledgement. An 'ok' still appears immediately after to denote the `$C` was parsed and executed.

  - `[MSG:Disabled]` - Appears as a check-mode `$C` disabled acknowledgement. An 'ok' still appears immediately after to denote the `$C` was parsed and executed. Grbl is automatically reset afterwards to restore all default g-code parser states changed by the check-mode.

  - `[MSG:Check Door]` - This message appears whenever the safety door detected as open. This includes immediately upon a safety door switch detects a pin change or appearing after the welcome message, if the safety door is ajar when Grbl initializes after a power-up/reset.

    - If in motion and the safety door switch is triggered, Grbl will immediately send this message, start a feed hold, and place Grbl into a suspend with the DOOR state.
    - If not in motion and not at startup, the same process occurs without the feed hold.
    - If Grbl is in a DOOR state and already suspended, any detected door switch pin detected will generate this message, including a door close.
    - If this message appears at startup, Grbl will suspended into immediately into the DOOR state. The startup lines are executed immediately after the DOOR state is exited by closing the door and sending Grbl a resume command.

  - `[MSG:Check Limits]` - If Grbl detects a limit switch as triggered after a power-up/reset and hard limits are enabled, this will appear as a courtesy message immediately after the Grbl welcome message.

  - `[MSG:Pgm End]` - M2/30 program end message to denote g-code modes have been restored to defaults according to the M2/30 g-code description.

  - `[MSG:Restoring defaults]` - Appears as an acknowledgement message when restoring EEPROM defaults via a `$RST=` command. An 'ok' still appears immediately after to denote the `$RST=` was parsed and executed.
  
  - `[MSG:Sleeping]` - Appears as an acknowledgement message when Grbl's sleep mode is invoked by issuing a `$SLP` command when in IDLE or ALARM states. Note that Grbl-Mega may invoke this at any time when the sleep timer option has been enabled and the timeout has been exceeded. Grbl may only be exited by a reset in the sleep state and will automatically enter an alarm state since the steppers were disabled.
	  - NOTE: Sleep will also invoke the parking motion, if it's enabled. However, if sleep is commanded during an ALARM, Grbl will not park and will simply de-energize everything and go to sleep.

- **Queried Feedback Messages:**

	- `[GC:]` G-code Parser State Message 

		```
		[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0.0 S0]
		ok
		```
		
   		- Initiated by the user via a `$G` command. Grbl replies as follows, where the `[GC:` denotes the message type and is followed by a separate `ok` to confirm the `$G` was executed.
     	
     	- The shown g-code are the current modal states of Grbl's g-code parser. This may not correlate to what is executing since there are usually several motions queued in the planner buffer.
     	
     	- NOTE: Program modal state has been fixed and will show `M0`, `M2`, or `M30` when they are active. During a run state, nothing will appear for program modal state.
     	 


  - `[HLP:]` : Initiated by the user via a `$` print help command. The help message is shown below with a separate `ok` to confirm the `$` was executed.
    ```
    [HLP:$$ $# $G $I $N $x=val $Nx=line $J=line $C $X $H ~ ! ? ctrl-x]
    ok
    ```
		- _**NOTE:** Grbl v1.1's new override real-time commands are not included in the help message. They use the extended-ASCII character set, which are not easily type-able, and require a GUI that supports them. This is for two reasons: Establish enough characters for all of the overrides with extra for later growth, and prevent accidental keystrokes or characters in a g-code file from enacting an override inadvertently._


  - The `$#` print parameter data query produces a large set of data which shown below and completed by an `ok` response message.

    	- Each line of the printout is starts with the data type, a `:`, and followed by the data values. If there is more than one, the order is XYZ axes, separated by commas.

      		```
      [G54:0.000,0.000,0.000]
      [G55:0.000,0.000,0.000]
      [G56:0.000,0.000,0.000]
      [G57:0.000,0.000,0.000]
      [G58:0.000,0.000,0.000]
      [G59:0.000,0.000,0.000]
      [G28:0.000,0.000,0.000]
      [G30:0.000,0.000,0.000]
      [G92:0.000,0.000,0.000]
      [TLO:0.000]
      [PRB:0.000,0.000,0.000:0]
      ok
      ```

    	- The `PRB:` probe parameter message includes an additional `:` and suffix value is a boolean. It denotes whether the last probe cycle was successful or not.

  - `[VER:]` and `[OPT:]`: Indicates build info data from a `$I` user query. These build info messages are followed by an `ok` to confirm the `$I` was executed, like so:
 
      ```
      [VER:v1.1f.20170131:Some string]
      [OPT:VL,16,128]
      ok
      ```
      
  		- The first line `[VER:]` contains the build version and date.
      - A string may appear after the second `:` colon. It is a stored EEPROM string a user via a `$I=line` command or OEM can place there for personal use or tracking purposes.
  		- The `[OPT:]` line follows immediately after and contains character codes for compile-time options that were either enabled or disabled and two values separated by commas, which indicates the total usable planner blocks and serial RX buffer bytes, respectively. The codes are defined below and a CSV file is also provided for quick parsing. This is generally only used for quickly diagnosing firmware bugs or compatibility issues. 

			| `OPT` Code | Setting Description, Units |
|:-------------:|----|
| **`V`** | Variable spindle enabled |
| **`N`** | Line numbers enabled |
| **`M`** | Mist coolant enabled |
| **`C`** | CoreXY enabled |
| **`P`** | Parking motion enabled |
| **`Z`** | Homing force origin enabled |
| **`H`** | Homing single axis enabled |
| **`T`** | Two limit switches on axis enabled |
| **`D`** | Spindle direction pin used as enable pin |
| **`0`** | Spindle enable off when speed is zero enabled |
| **`S`** | Software limit pin debouncing enabled |
| **`R`** | Parking override control enabled |
| **`A`** | Allow feed rate overrides in probe cycles |
| **`+`** | Safety door input pin enabled |
| **`*`** | Restore all EEPROM disabled |
| **`$`** | Restore EEPROM `$` settings disabled |
| **`#`** | Restore EEPROM parameter data disabled |
| **`I`** | Build info write user string disabled |
| **`E`** | Force sync upon EEPROM write disabled |
| **`W`** | Force sync upon work coordinate offset change disabled |
| **`L`** | Homing initialization auto-lock disabled |
    
  - `[echo:]` : Indicates an automated line echo from a command just prior to being parsed and executed. May be enabled only by a config.h option. Often used for debugging communication issues. A typical line echo message is shown below. A separate `ok` will eventually appear to confirm the line has been parsed and executed, but may not be immediate as with any line command containing motions.
      ```
      [echo:G1X0.540Y10.4F100]
      ```
      - NOTE: The echoed line will have been pre-parsed a bit by Grbl. No spaces or comments will appear and all letters will be capitalized.

------

#### Startup Line Execution

  - `>G54G20:ok` : The open chevron indicates a startup line has just executed. The startup line `G54G20` immediately follows the `>` character and is followed by an `:ok` response to indicate it executed successfully.

    - A startup line will execute upon initialization only if a line is present and if Grbl is not in an alarm state.

    - The `:ok` on the same line is intentional. It prevents this `ok` response from being counted as part of a stream, because it is not tied to a sent command, but an internally-generated one.

    - There should always be an appended `:ok` because the startup line is checked for validity before it is stored in EEPROM. In the event that it's not, Grbl will print `>G54G20:error:X`, where `X` is the error code explaining why the startup line failed to execute.

    - In the rare chance that there is an EEPROM read error, the startup line execution will print `>:error:7` with no startup line and a error code `7` for a read fail. Grbl will also automatically wipe and try to restore the problematic EEPROM.


------
