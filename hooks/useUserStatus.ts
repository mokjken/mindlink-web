import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface UserStatus {
    status_key: string;
    custom_text?: string;
    color_hex: string;
}

export const useUserStatus = () => {
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.status.get();
            setStatus(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching status:", err);
            setError("Failed to load status");
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStatus = async (statusKey: string, customText: string | null, colorHex: string, classId?: string) => {
        // Optimistic update
        const previousStatus = status;
        const newStatus = { status_key: statusKey, custom_text: customText || undefined, color_hex: colorHex };

        setStatus(newStatus as UserStatus);

        try {
            await api.status.set(statusKey, customText || null, colorHex, classId);
            setError(null);
        } catch (err) {
            console.error("Error setting status:", err);
            // Revert on failure
            setStatus(previousStatus);
            throw new Error("Failed to update status");
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return {
        status,
        loading,
        error,
        updateStatus,
        refetch: fetchStatus
    };
};
