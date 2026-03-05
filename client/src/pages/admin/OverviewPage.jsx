import { useState, useEffect } from 'react';
import api from '../../utils/api';

function todayStr() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function OverviewPage() {
    const [stats, setStats] = useState({ users: 0, todayAttendance: 0, todayTasks: 0, flagged: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [usersRes, rosterRes, tasksRes, flaggedRes] = await Promise.all([
                    api.get('/api/admin/users'),
                    api.get(`/api/admin/roster?date=${todayStr()}`),
                    api.get(`/api/admin/tasks?date=${todayStr()}`),
                    api.get('/api/admin/flagged'),
                ]);
                setStats({
                    users: usersRes.data.data?.length || 0,
                    todayAttendance: rosterRes.data.data?.length || 0,
                    todayTasks: tasksRes.data.data?.length || 0,
                    flagged:
                        (flaggedRes.data.data?.attendance?.length || 0) +
                        (flaggedRes.data.data?.tasks?.length || 0) +
                        (flaggedRes.data.data?.inventory?.length || 0),
                });
            } catch (err) {
                console.error('[overview]', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const cards = [
        { label: 'Total Users', value: stats.users, icon: '👥', color: 'from-blue-500 to-blue-600' },
        { label: 'Today Check-ins', value: stats.todayAttendance, icon: '📍', color: 'from-emerald-500 to-emerald-600' },
        { label: 'Today Tasks', value: stats.todayTasks, icon: '📋', color: 'from-purple-500 to-purple-600' },
        { label: 'Flagged Records', value: stats.flagged, icon: '⚠️', color: 'from-amber-500 to-amber-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{card.icon}</span>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                        </div>
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                        <p className="text-slate-500 text-sm mt-1">{card.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
