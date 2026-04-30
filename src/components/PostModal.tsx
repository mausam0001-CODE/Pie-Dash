import React, { useState } from 'react';
import { X, Calendar, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Reel } from '../hooks/useReelsData';

interface PostModalProps {
    reel: Reel;
    onClose: () => void;
}

export const PostModal = ({ reel, onClose }: PostModalProps) => {
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('10:00');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSchedule = async () => {
        setStatus('loading');

        // Simulate API call to our new Node.js backend
        try {
            const response = await fetch('http://localhost:3001/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: reel.id,
                    title: reel.title,
                    scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
                    platforms: ['Instagram', 'TikTok']
                })
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(onClose, 2000);
            }
        } catch (err) {
            console.error('Failed to schedule', err);
            setStatus('idle');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Schedule Reel: {reel.id}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900">Scheduled Successfully!</h4>
                            <p className="text-slate-500 text-sm mt-2 font-medium">Auto-posting set for {scheduledDate} at {scheduledTime}.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select Date</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/10 outline-none font-medium"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select Time</label>
                                <div className="relative">
                                    <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/10 outline-none font-medium"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSchedule}
                                disabled={!scheduledDate || status === 'loading'}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${!scheduledDate || status === 'loading'
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 to-purple-500 text-white hover:shadow-teal-500/20'
                                    }`}
                            >
                                {status === 'loading' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
                                {status === 'loading' ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
