import React, { useRef, useEffect } from "react";
import styles from "./css/WebcamView.module.css";
import { useCNC, AppConfig } from '../context/CNCContext';

export default function WebcamView() {
    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const { status } = useCNC();
    const camPort = AppConfig?.webCam?.port

    useEffect(() => {
        function drawOverlay() {
            const canvas = canvasRef.current;
            const img = imgRef.current;
            if (!canvas || !img) return;

            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw crosshair
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Draw coordinates
            ctx.fillStyle = "yellow";
            ctx.font = "16px Arial";
            const x = (status && status.wpos?.x) ?? -199.999;
            const y = (status && status.wpos?.y) ?? -199.999;
            const z = (status && status.wpos?.z) ?? -199.999;
            ctx.fillText(`X: ${x.toFixed(3)}`, 10, 20);
            ctx.fillText(`Y: ${y.toFixed(3)}`, 10, 40);
            ctx.fillText(`Z: ${z.toFixed(3)}`, 10, 60);
        }

        const interval = setInterval(drawOverlay, 100);
        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className={styles.webcamContainer}>
            <img
                ref={imgRef}
                // src="http://localhost:8984"
                src={`http://localhost:${camPort}`}
                alt="Webcam Stream"
                className={styles.videoFeed}
            />
            <canvas ref={canvasRef} className={styles.overlayCanvas} />
        </div>
    );
}


// import React, { useRef, useEffect, useState, useContext } from "react";
// import styles from "./css/WebcamView.module.css";
// import { useCNC } from '../context/CNCContext';
// import { LogError, LogInfo, LogDebug, LogTrace, LogWarning } from '../util/logger';

// export default function WebcamView() {
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);
//     const [error, setError] = useState(null);
//     const { consoleMessages, status, isConnected, sendAsync } = useCNC();

//     useEffect(() => {
//         async function startWebcam() {
//             try {
//                 const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = stream;
//                 }
//             } catch (err) {
//                 setError("Failed to access webcam. Please check permissions.");
//                 LogError("Webcam error:", err);
//             }
//         }

//         startWebcam();

//         return () => {
//             if (videoRef.current && videoRef.current.srcObject) {
//                 videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//             }
//         };
//     }, []);


//     useEffect(() => {
//         function drawOverlay() {
//             const canvas = canvasRef.current;
//             if (!canvas) return;
//             const ctx = canvas.getContext("2d");

//             // Set canvas size to match video
//             canvas.width = videoRef.current?.videoWidth || 640;
//             canvas.height = videoRef.current?.videoHeight || 480;

//             // Clear previous drawings
//             ctx.clearRect(0, 0, canvas.width, canvas.height);

//             // Draw crosshair
//             ctx.strokeStyle = "yellow";
//             ctx.lineWidth = 1;

//             // Center lines
//             ctx.beginPath();
//             ctx.moveTo(canvas.width / 2, 0);
//             ctx.lineTo(canvas.width / 2, canvas.height);
//             ctx.moveTo(0, canvas.height / 2);
//             ctx.lineTo(canvas.width, canvas.height / 2);
//             ctx.stroke();

//             // Draw coordinate text in the top-left corner
//             ctx.fillStyle = "yellow";
//             ctx.font = "16px Arial";
//             const x = (status && status.wpos?.x) ?? -199.999;
//             const y = (status && status.wpos?.y) ?? -199.999;
//             const z = (status && status.wpos?.z) ?? -199.999;


//             ctx.fillText(`X: ${x}`, 10, 20);
//             ctx.fillText(`Y: ${y}`, 10, 40);
//             ctx.fillText(`Z: ${z}`, 10, 60);

//         }

//         const interval = setInterval(drawOverlay, 100); // Refresh overlay every 100ms
//         return () => clearInterval(interval);
//     }, [status]); // Redraw when coordinates update

//     return (
//         <div className={styles.webcamContainer}>
//             {error ? (
//                 <div className={styles.error}>{error}</div>
//             ) : (
//                 <>
//                     {/* <video ref={videoRef} autoPlay playsInline className={styles.videoFeed} /> */}
//                     <video ref={videoRef} autoPlay playsInline muted className={styles.videoFeed} />
//                     <canvas ref={canvasRef} className={styles.overlayCanvas} />
//                 </>
//             )}
//         </div>
//     );
// }
