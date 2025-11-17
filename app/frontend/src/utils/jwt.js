export const decodeJwt = (token) => {
    if (!token)
        return null;
    const parts = token.split('.');
    if (parts.length < 2)
        return null;
    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(base64);
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
};
