import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const OfflineQueuePanel = ({ queuedChunks, onReplay }) => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isReplaying, setIsReplaying] = useState(false);
    useEffect(() => {
        const handle = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handle);
        window.addEventListener('offline', handle);
        return () => {
            window.removeEventListener('online', handle);
            window.removeEventListener('offline', handle);
        };
    }, []);
    useEffect(() => {
        if (!isOnline || queuedChunks.length === 0 || isReplaying) {
            return;
        }
        let cancelled = false;
        const replay = async () => {
            setIsReplaying(true);
            try {
                await onReplay();
            }
            finally {
                if (!cancelled) {
                    setIsReplaying(false);
                }
            }
        };
        void replay();
        return () => {
            cancelled = true;
            setIsReplaying(false);
        };
    }, [isOnline, isReplaying, onReplay, queuedChunks]);
    if (!queuedChunks.length && isOnline) {
        return null;
    }
    return (_jsxs("section", { className: "surface-card", "aria-live": "polite", children: [_jsxs("div", { className: "section-title", children: [_jsxs("div", { children: [_jsx("h2", { children: "Upload queue" }), _jsx("p", { className: "text-muted", children: isOnline ? 'Queued chunks ready to replay.' : 'You are offline; chunks will sync automatically when back online.' })] }), _jsx("span", { className: `badge ${isOnline ? 'primary' : 'danger'}`, children: isOnline ? 'Online' : 'Offline' })] }), queuedChunks.length === 0 ? (_jsx("p", { className: "text-muted", children: "No pending chunks. You\u2019re all caught up." })) : (_jsxs(_Fragment, { children: [_jsx("ul", { className: "queue-list", children: queuedChunks.map((chunk) => (_jsxs("li", { children: ["Import ", _jsx("strong", { children: chunk.importId.slice(0, 8) }), " \u00B7 Chunk #", chunk.payload.chunkIndex + 1, " \u00B7", ' ', chunk.payload.rows.length, " rows"] }, `${chunk.importId}-${chunk.payload.chunkIndex}`))) }), _jsx("button", { type: "button", className: "ghost", disabled: !isOnline || isReplaying, onClick: async () => {
                            setIsReplaying(true);
                            try {
                                await onReplay();
                            }
                            finally {
                                setIsReplaying(false);
                            }
                        }, children: isReplaying ? _jsx("span", { className: "spinner", "aria-hidden": true }) : 'Replay queued chunks' })] }))] }));
};
