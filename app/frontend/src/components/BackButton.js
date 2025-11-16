import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
export const BackButton = () => {
    const navigate = useNavigate();
    return (_jsx("button", { type: "button", className: "ghost back-button", onClick: () => navigate(-1), children: "\u2190 Back" }));
};
