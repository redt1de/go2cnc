// views/ConsoleView.jsx
import React from 'react';
import ConsoleGroup from '../components/ConsoleGroup';
import GPadGroup from '../components/GPadGroup';
import { useEffect, useState } from 'react';
import { useContext } from 'react';
import Frame from '../util/Frame';
import MDI from '../components/MDI';
import SpindleGroup from '../components/SpindleGroup';
import styles from './css/ConsoleView.module.css';
import MachineGroup from '../components/MachineGroup';
import CycleGroup from '../components/CycleGroup';
import StateGroup from '../components/StateGroup';
import { useCNC } from '../context/CNCContext';

export default function ConsoleView() {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();


    return (
        <div className={styles.consoleView}>

            <div style={{ position: 'absolute', top: '0px', left: '10px' }}>
                <Frame title="Machine" >
                    <StateGroup />
                </Frame>
            </div>

            <div style={{ position: 'absolute', bottom: '0px', left: '10px' }}>
                <GPadGroup onEnter={(input) => {
                    console.log('🚀 Sending Gcode:', input);
                    sendCommand(input);

                }} />
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


            <div style={{ position: 'absolute', bottom: '0px', right: '10px' }}>
                <Frame title="Console">
                    <ConsoleGroup />
                </Frame>
            </div>
        </div>
    );
}