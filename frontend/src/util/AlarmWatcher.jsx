// src/util/AlarmRedirectWatcher.jsx
import { useEffect } from "react";
import { useCNC } from "../context/CNCContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function AlarmtWatcher() {
    const { status } = useCNC();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (status?.activeState === "Alarm" && location.pathname !== "/control") {
            navigate("/control", { replace: true });
        }
    }, [status?.activeState, location, navigate]);

    return null;
}
