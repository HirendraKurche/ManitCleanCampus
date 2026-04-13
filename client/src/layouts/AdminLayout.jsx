// layouts/AdminLayout.jsx — UPDATED
// Changes:
//   1. Added Buildings nav item linking to /admin/buildings
//   2. Added NotificationBell component — polls /api/notifications every 30s
//      and shows unread badge in the header & sidebar

import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { playNotificationSound } from '../utils/notificationSound';

const navItems = [
    { to: '/admin',            label: 'Overview',    icon: '📊', end: true },
    { to: '/admin/complaints', label: 'Complaints',  icon: '📋' },
    { to: '/admin/buildings',  label: 'Buildings',   icon: '🏢' }, // ← NEW
    { to: '/admin/attendance', label: 'Attendance', icon: '📍' },
    { to: '/admin/tasks',      label: 'Task Audit',  icon: '🖼️' },
    { to: '/admin/inventory',  label: 'Inventory',   icon: '📦' },
    { to: '/admin/users',      label: 'Users',       icon: '👥' },
    { to: '/admin/flagged',    label: 'Flagged',     icon: '⚠️' },
];

function NotificationBell() {
    const [unread, setUnread]   = useState(0);
    const [open, setOpen]       = useState(false);
    const [notices, setNotices] = useState([]);
    const ref = useRef(null);
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/api/notifications');
            if (data.success) {
                setUnread(data.unreadCount || 0);
                setNotices(data.data || []);
            }
        } catch (_) {}
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNewNotification = (notif) => {
            playNotificationSound();
            setUnread(prev => prev + 1);
            setNotices(prev => [notif, ...prev].slice(0, 30));
        };
        socket.on('new_notification', handleNewNotification);
        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        try {
            await api.patch('/api/notifications/read');
            setUnread(0);
            setNotices((n) => n.map((x) => ({ ...x, read: true })));
        } catch (_) {}
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => { setOpen((o) => !o); if (!open && unread > 0) markAllRead(); }}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <p className="text-white text-sm font-semibold">Notifications</p>
                        {notices.some((n) => !n.read) && (
                            <button onClick={markAllRead} className="text-blue-400 text-xs hover:text-blue-300">Mark all read</button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                        {notices.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No notifications yet</p>
                        ) : notices.map((n) => (
                            <div key={n._id} className={`px-4 py-3 ${n.read ? 'opacity-60' : 'bg-blue-500/5'}`}>
                                <div className="flex items-start gap-2">
                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium">{n.title}</p>
                                        <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                                        <p className="text-slate-600 text-[10px] mt-1">
                                            {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu  = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-lg">FM</div>
                    <p className="text-white text-sm font-bold">Facility Mgmt</p>
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell />
                    <button onClick={toggleMenu} className="p-2 text-slate-400 hover:text-white focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>
            </header>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeMenu} />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-900/95 md:bg-slate-900/80 backdrop-blur-md border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Desktop */}
                <div className="hidden md:flex items-center justify-between px-5 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">FM</div>
                        <div>
                            <p className="text-white text-sm font-bold">Facility Mgmt</p>
                            <p className="text-slate-500 text-[10px]">Admin Dashboard</p>
                        </div>
                    </div>
                    <NotificationBell />
                </div>

                {/* Mobile menu header */}
                <div className="h-16 border-b border-slate-800 md:hidden flex items-center px-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Menu</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-600/15 text-blue-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`
                            }
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div className="px-4 py-4 border-t border-slate-800 bg-slate-900 md:bg-transparent">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-slate-500 text-[10px] truncate">{user?.employeeCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2 bg-slate-800/80 hover:bg-red-600/20 hover:text-red-400 text-slate-400 text-xs font-medium rounded-lg transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full md:pl-64 flex flex-col min-h-[calc(100vh-64px)] md:min-h-screen">
                <div className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden w-full max-w-[100vw]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
