// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './App.module.css';
// import { CNCProvider } from "../backups/machine/providers/CNCProvider";
import ControlView from './views/ControlView';
import ConsoleView from './views/ConsoleView';
import RunView from './views/RunView';
import TestView from './views/TestView';
import AutolevelView from './views/AutolevelView';
import DisconnectedOverlay from './util/DisconnectedOverlay';
import { NavLink } from "react-router-dom"; // ✅ Use NavLink for active styling
import WebcamView from './views/WebcamView';
import loadConfig from "./util/Config";
import { useState, useEffect } from 'react';
import { CNCProvider } from './context/CNCContext';
/*
// import { Greet, EmitEvent } from "../wailsjs/go/main/App";
// import { EventsEmit, EventsOn } from "@wailsapp/runtime";
// import { EventsEmit, EventsOn } from "../wailsjs/runtime";

const [messages, setMessages] = useState([]);
    useEffect(() => {
        console.log("Setting up event listener...");
        EventsOn("timerEvent", (message) => {
            console.log("Received event:", message);
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            console.log("Cleaning up event listener...");
            // unsubscribe();
        };
    }, []);

*/


function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  // if (!config) return <div>Loading...</div>;




  return (

    <CNCProvider>
      <div className={styles.appContainer}>
        <Router>
          <nav className={styles.tabBar}>
            <NavLink to="/control" title="Control" className={({ isActive }) => isActive ? styles.active : ""}>
              Control
            </NavLink>
            <NavLink to="/console" title="Console" className={({ isActive }) => isActive ? styles.active : ""}>
              Console
            </NavLink>
            <NavLink to="/run" title="Run" className={({ isActive }) => isActive ? styles.active : ""}>
              Run
            </NavLink>
            <NavLink to="/test" title="test" className={({ isActive }) => isActive ? styles.active : ""}>
              Test
            </NavLink>
            <NavLink to="/autolevel" title="Autolevel" className={({ isActive }) => isActive ? styles.active : ""}>
              ???
            </NavLink>
            <NavLink to="/webcam" title="Webcam" className={({ isActive }) => isActive ? styles.active : ""}>
              Webcam
            </NavLink>
          </nav>

          <div className={styles.viewContainer}>
            <Routes>
              <Route path="/" element={<Navigate to="/test" replace />} />
              <Route path="/control" element={<ControlView />} />
              <Route path="/console" element={<ConsoleView />} />
              <Route path="/run" element={<RunView />} />
              <Route path="/test" element={<TestView />} />
              <Route path="/autolevel" element={<AutolevelView />} />
              <Route path="/webcam" element={<WebcamView />} />
            </Routes>
          </div>
        </Router>
      </div>
      <DisconnectedOverlay />

    </CNCProvider >
  );
}

export default App;
