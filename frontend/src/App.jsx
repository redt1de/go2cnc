// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './App.module.css';
import { NavLink } from "react-router-dom"; // ✅ Use NavLink for active styling
import loadConfig from "./util/Config";
import { useState, useEffect } from 'react';
//
import { CNCProvider } from './context/CNCContext';
import ControlView from './views/ControlView';
import ConsoleView from './views/ConsoleView';
import RunView from './views/RunView';
import ProbeView from './views/ProbeView';
import MacroView from './views/MacroView';
import WebcamView from './views/WebcamView';
import AlarmWatcher from './util/AlarmWatcher';
import DisconnectedOverlay from './util/DisconnectedOverlay';


function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

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
            <NavLink to="/probe" title="Probe" className={({ isActive }) => isActive ? styles.active : ""}>
              Probe
            </NavLink>
            <NavLink to="/macros" title="Macros" className={({ isActive }) => isActive ? styles.active : ""}>
              Macros
            </NavLink>
            <NavLink to="/webcam" title="Webcam" className={({ isActive }) => isActive ? styles.active : ""}>
              Webcam
            </NavLink>
          </nav>

          <div className={styles.viewContainer}>
            <Routes>
              <Route path="/" element={<Navigate to="/control" replace />} />
              <Route path="/control" element={<ControlView />} />
              <Route path="/console" element={<ConsoleView />} />
              <Route path="/run" element={<RunView />} />
              <Route path="/probe" element={<ProbeView />} />
              <Route path="/macros" element={<MacroView />} />
              <Route path="/webcam" element={<WebcamView />} />
            </Routes>
            <AlarmWatcher />
          </div>
        </Router>
      </div>
      <DisconnectedOverlay />

    </CNCProvider >
  );
}

export default App;
