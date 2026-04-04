import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface UserStatus {
    id?: number;
    class_id?: string | null;
    status_key: string;
    custom_text?: string;
    color_hex: string;
    created_at?: number;
    expires_at?: number;
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
        const newStatus = { ...previousStatus, status_key: statusKey, custom_text: customText || undefined, color_hex: colorHex, class_id: classId || previousStatus?.class_id };

        setStatus(newStatus as UserStatus);

        try {
            const response = await api.status.set(statusKey, customText || null, colorHex, classId);
            if (response?.item) {
                setStatus(response.item as UserStatus);
            }
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
