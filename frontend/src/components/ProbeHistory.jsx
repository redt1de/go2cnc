import React, { useState } from "react";
import { useCNC } from "../context/CNCContext";
import styles from "./css/ProbeHistory.module.css"; // Import the CSS file for styling
import YesNoDialog from "../util/YesNoDialog";
const PAGE_SIZE = 5; // Number of rows per page

export default function ProbeHistory() {
    const { probeHistory, clearProbeHistory } = useCNC();
    const [currentPage, setCurrentPage] = useState(0);
    const [showDialog, setShowDialog] = useState(false);

    // Calculate total pages
    // console.log('>>>>> probeHistory:', probeHistory);
    const totalPages = Math.ceil(probeHistory.length / PAGE_SIZE);

    // Slice the probe history for the current page
    const paginatedHistory = probeHistory.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE
    );

    const handleConfirm = () => {

        console.log('clearing...');
        clearProbeHistory();
        setShowDialog(false);

    };

    return (
        <div className={styles.probeContainer}>
            {showDialog && <YesNoDialog message="Clear probe history?" onConfirm={handleConfirm} onCancel={() => setShowDialog(true)} />}
            <table className={styles.probeTable}>
                <thead>
                    <tr>
                        <th className={styles.probeLabel}>X</th>
                        <th className={styles.probeLabel}>Y</th>
                        <th className={styles.probeLabel}>Z</th>
                        <th className={styles.probeLabel}>Success</th>
                    </tr>
                </thead>

                <tbody>
                    {paginatedHistory.map((probe, index) => {
                        // Ensure probe exists and has valid X, Y, Z values
                        const x = probe?.x ?? -0; // Default to 0 if undefined
                        const y = probe?.y ?? -0;
                        const z = probe?.z ?? -0;
                        const success = probe?.success ?? false;

                        return (
                            <tr key={index}>
                                <td className={styles.probeTd}>{x.toFixed(3)}</td>
                                <td className={styles.probeTd}>{y.toFixed(3)}</td>
                                <td className={styles.probeTd}>{z.toFixed(3)}</td>
                                <td className={`${styles.probeTd} ${success ? styles.success : styles.fail}`}>{success ? "✔" : "✖"}</td>
                            </tr>
                        );
                    })}
                    {/* Add empty rows if fewer than PAGE_SIZE */}
                    {Array.from({ length: PAGE_SIZE - paginatedHistory.length }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                            <td className={styles.probeTd}> </td>
                            <td className={styles.probeTd}> </td>
                            <td className={styles.probeTd}> </td>
                            <td className={styles.probeTd}> </td>
                        </tr>
                    ))}

                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className={styles.pagination}>
                <button

                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    ◀ Prev
                </button>
                <span className={styles.pageIndicator}>
                    Page {currentPage + 1} of {totalPages}
                </span>
                <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next ▶
                </button>
            </div>

            {/* Clear Probe History Button */}
            <div className={styles.clearContainer}>
                <button className={styles.clearBtn} onClick={() => setShowDialog(true)}>
                    Clear
                </button>
            </div>
        </div>
    );
}
