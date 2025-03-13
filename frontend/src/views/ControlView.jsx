// views/ControlView.jsx
import React from 'react';
import JogButtonGroup from '../components/JogButtonGroup';
import SpindleGroup from '../components/SpindleGroup';
import ZeroGroup from '../components/ZeroGroup';
import MachineGroup from '../components/MachineGroup';
import CycleGroup from '../components/CycleGroup';
import StateGroup from '../components/StateGroup';
import { useEffect, useState } from 'react';
import Frame from '../util/Frame';

// import SpindleControls from '../components/SpindleControls';
import MDI from '../components/MDI';
import styles from './css/ControlView.module.css';
import ConsoleGroup from '../components/ConsoleGroup';

export default function ControlView() {
    // const [machineMessages, setMachineMessages] = useState([
    //     'Initializing...',
    //     'Waiting for data...'
    // ]);

    // useEffect(() => {
    //     // Example: mock new messages arriving every 2 seconds
    //     const interval = setInterval(() => {
    //         setMachineMessages(prev => [...prev, `New message at ${Date.now()}`]);
    //     }, 2000);
    //     return () => clearInterval(interval);
    // }, []);


    return (
        <div className={styles.controlView}>

            <div style={{ position: 'absolute', top: '0px', left: '10px' }}>
                <Frame title="Machine">
                    <StateGroup />
                    <div className={styles.machineContainer}>
                        <MachineGroup />
                        <CycleGroup />
                    </div>
                </Frame>
            </div>




            <div style={{ position: 'absolute', top: '0px', left: '460px' }}>
                <Frame title="DRO">
                    <MDI />
                </Frame>
            </div>


            <div style={{ position: 'absolute', top: '0px', right: '10px' }}>
                <Frame title="Tool">
                    <SpindleGroup />
                </Frame>
            </div>


            <div style={{ position: 'absolute', bottom: '0px', left: '10px' }}>
                <Frame title="Jog">
                    <JogButtonGroup />
                </Frame>
            </div>

            <div style={{ position: 'absolute', bottom: '0px', left: '310px' }}>
                <Frame title="Zero">
                    <ZeroGroup />
                </Frame>
            </div>

            <div style={{ position: 'absolute', bottom: '0px', right: '10px' }}>
                <Frame title="Console">
                    <ConsoleGroup />
                </Frame>
            </div>

            {/* 

            




            
            */}
        </div>
    );
}
