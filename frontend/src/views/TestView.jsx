import React from 'react';
import Frame from '../util/Frame';
import ConsoleGroup from '../components/ConsoleGroup';
import { useEffect, useState, useRef } from 'react';
import styles from './css/TestView.module.css';
import { useCNC } from '../context/CNCContext';


export default function FilesView() {
    const { consoleMessages, status, isConnected, sendCommand } = useCNC();
    const consoleRef = useRef(null);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleMessages]);

    const tsend = () => {
        // sendCommand("$H\n");
        sendCommand(0x18);
    }



    return (
        <div style={{ padding: '10px' }}>
            <h2>Testing</h2>
            <div className={styles.testContainer}>
                <button onClick={tsend}>?</button>
                {/* <button onClick={getProbeData}>get</button>
                <button onClick={fakeprobe} >fake probe</button> */}

            </div>
            <div style={{ position: 'absolute', bottom: '0px', right: '10px' }}>
                <Frame title="Console">
                    <ConsoleGroup />
                </Frame>
            </div>
        </div>
    );
}

/*
$Files/ListGcode

{"files":[{"name":"Spoilboard","size":"-1"},{"name":"grid.nc","size":"580"},{"name":"drill.nc","size
":"5589"},{"name":"Macros","size":"-1"}],"path":""}

ok
*/