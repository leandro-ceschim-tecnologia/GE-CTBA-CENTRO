import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function normalizeUserResponse(data) {
        if (!data) return null;
        return data.user || data;
    }

    async function loadMe() {
        const token = localStorage.getItem("token");

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const me = await apiRequest("/auth/me");
            setUser(normalizeUserResponse(me));
        } catch {
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, senha) {
        const result = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, senha }),
        });

        localStorage.setItem("token", result.token);

        const me = await apiRequest("/auth/me");
        setUser(normalizeUserResponse(me));
    }

    function logout() {
        localStorage.removeItem("token");
        setUser(null);
    }

    function updateUserData(newData) {
        setUser((prev) => {
            if (!prev) return prev;

            const filteredData = Object.fromEntries(
                Object.entries(newData || {}).filter(([, value]) => value !== undefined)
            );

            return {
                ...prev,
                ...filteredData,
            };
        });
    }

    useEffect(() => {
        loadMe();
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout,
            loadMe,
            setUser,
            updateUserData,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}