import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authStore } from '../state/auth.store';
export const UnauthRoute = ({ children }) => {
    const status = authStore((state) => state.status);
    const user = authStore((state) => state.user);
    const hydrate = authStore((state) => state.hydrate);
    useEffect(() => {
        if (status === 'idle') {
            void hydrate();
        }
    }, [status, hydrate]);
    if (status === 'loading') {
        return _jsx("div", { className: "loader", children: "Loading\u2026" });
    }
    if (user) {
        return _jsx(Navigate, { to: "/import", replace: true });
    }
    return children;
};
