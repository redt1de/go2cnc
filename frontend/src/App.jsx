// App.jsx
// import React from 'react';
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './App.module.css';
import { NavLink } from "react-router-dom"; // ✅ Use NavLink for active styling
import { useState, useEffect } from 'react';
//
import { CNCProvider } from './context/CNCContext';

import AlarmWatcher from './util/AlarmWatcher';
import DisconnectedOverlay from './util/DisconnectedOverlay';
import { ToastContainer } from 'react-toastify';

// import ControlView from './views/ControlView';
// import ConsoleView from './views/ConsoleView';
// import FilesView from './views/FilesView';
// import ProbeView from './views/ProbeView';
// import MacroView from './views/MacroView';
// import WebcamView from './views/WebcamView';

// TODO this App.jsx uses lazy loading, remove if no gains

const ControlView = React.lazy(() => import('./views/ControlView'));
const ConsoleView = React.lazy(() => import('./views/ConsoleView'));
const FilesView = React.lazy(() => import('./views/FilesView'));
const ProbeView = React.lazy(() => import('./views/ProbeView'));
const MacroView = React.lazy(() => import('./views/MacroView'));
const WebcamView = React.lazy(() => import('./views/WebcamView'));




function App() {

  return (

    <CNCProvider>
      <div className={styles.appContainer}>
        <ToastContainer
          theme="colored"
          hideProgressBar={true}
          autoClose={3000}
          closeOnClick={true}
        />
        <Router>
          <nav className={styles.tabBar}>
            <NavLink to="/control" title="Control" className={({ isActive }) => isActive ? styles.active : ""}>
              Control
            </NavLink>

            <NavLink to="/console" title="Console" className={({ isActive }) => isActive ? styles.active : ""}>
              Console
            </NavLink>

            <NavLink to="/macros" title="Macros" className={({ isActive }) => isActive ? styles.active : ""}>
              Macros
            </NavLink>

            <NavLink to="/files" title="Files" className={({ isActive }) => isActive ? styles.active : ""}>
              Files
            </NavLink>
            <NavLink to="/probe" title="Probe" className={({ isActive }) => isActive ? styles.active : ""}>
              Probe
            </NavLink>

            <NavLink to="/webcam" title="Webcam" className={({ isActive }) => isActive ? styles.active : ""}>
              Webcam
            </NavLink>
          </nav>

          <div className={styles.viewContainer}>
            <Routes>
              <Route path="/" element={<Navigate to="/control" replace />} />
              {/* <Route path="/control" element={<ControlView />} />
              <Route path="/console" element={<ConsoleView />} />
              <Route path="/Files" element={<FilesView />} />
              <Route path="/probe" element={<ProbeView />} />
              <Route path="/macros" element={<MacroView />} />
              <Route path="/webcam" element={<WebcamView />} /> */}
              <Route path="/control" element={<Suspense fallback={<div>Loading...</div>}><ControlView /></Suspense>} />
              <Route path="/console" element={<Suspense fallback={<div>Loading...</div>}><ConsoleView /></Suspense>} />
              <Route path="/Files" element={<Suspense fallback={<div>Loading...</div>}><FilesView /></Suspense>} />
              <Route path="/probe" element={<Suspense fallback={<div>Loading...</div>}><ProbeView /></Suspense>} />
              <Route path="/macros" element={<Suspense fallback={<div>Loading...</div>}><MacroView /></Suspense>} />
              <Route path="/webcam" element={<Suspense fallback={<div>Loading...</div>}><WebcamView /></Suspense>} />
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
