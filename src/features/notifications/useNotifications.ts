import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    platform?: string;
    timestamp: string;
    read: boolean;
}

export const useNotifications = () => {
    const { session } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!session?.user?.id) return;

        // Load from localStorage for persistence within the browser
        const stored = localStorage.getItem(`notifications_${session.user.id}`);
        if (stored) {
            setNotifications(JSON.parse(stored));
        }

        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_id=eq.${session.user.id}`
                },
                (payload: any) => {
                    const oldStatus = payload.old?.status;
                    const newStatus = payload.new?.status;
                    const newPost = payload.new;

                    // Detect status changes
                    if (oldStatus !== newStatus) {
                        let notification: Notification | null = null;

                        if (newStatus === 'Published') {
                            notification = {
                                id: Date.now().toString(),
                                type: 'success',
                                message: `Successfully published "${newPost.title || 'Untitled Post'}".`,
                                platform: Array.isArray(newPost.platforms) ? newPost.platforms[0] : undefined,
                                timestamp: new Date().toISOString(),
                                read: false
                            };
                        } else if (newStatus === 'Failed') {
                            notification = {
                                id: Date.now().toString(),
                                type: 'error',
                                message: `Failed to publish "${newPost.title || 'Untitled Post'}".`,
                                platform: Array.isArray(newPost.platforms) ? newPost.platforms[0] : undefined,
                                timestamp: new Date().toISOString(),
                                read: false
                            };
                        }

                        if (notification) {
                            setNotifications(prev => {
                                const updated = [notification!, ...prev].slice(0, 50);
                                localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(updated));
                                return updated;
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

    const markAllAsRead = () => {
        if (!session?.user?.id) return;
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(updated));
            return updated;
        });
    };

    const clearHistory = () => {
        if (!session?.user?.id) return;
        setNotifications([]);
        localStorage.removeItem(`notifications_${session.user.id}`);
    };

    return {
        notifications,
        markAllAsRead,
        clearHistory,
        hasUnread: notifications.some(n => !n.read)
    };
};
