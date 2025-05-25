import { useState, useEffect, useCallback } from "react";
import { authService } from "@/src/services/authService";
import type { User } from "@/src/types";
import { logger } from "@/src/lib/logger";

interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    error: string | null;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch user";
            setError(errorMessage);
            logger.error("Error in useAuth", { error: err });
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Logout failed";
            setError(errorMessage);
            throw err;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return {
        user,
        loading,
        error,
        logout,
        refreshUser,
    };
} 