import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useNotification, NotificationType } from '../context/NotificationContext';

const icons: Record<NotificationType, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors: Record<NotificationType, string> = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    error: 'bg-rose-50 text-rose-600 border-rose-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
};

export const NotificationContainer: React.FC = () => {
    const { notifications, remove } = useNotification();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => {
                    const Icon = icons[notification.type];
                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg shadow-slate-200/50 min-w-[300px] max-w-md ${colors[notification.type]}`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-semibold flex-1 leading-tight">{notification.message}</p>
                            <button
                                onClick={() => remove(notification.id)}
                                className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
