import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSync from '../hooks/useSync';
import { useEffect } from 'react';

const navItems = [
    {
        to: '/worker/attendance',
        label: 'Attendance',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        to: '/worker/tasks',
        label: 'Tasks',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        to: '/worker/inventory',
        label: 'Inventory',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
];

export default function WorkerLayout() {
    const { user, logout } = useAuth();
    const { syncing, syncNow, isOnline } = useSync();

    // Auto-sync when coming online, on mount, and every 30 seconds
    useEffect(() => {
        if (isOnline) {
            syncNow();
            const interval = setInterval(syncNow, 30000);
            return () => clearInterval(interval);
        }
    }, [isOnline, syncNow]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top Bar */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                        FM
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold leading-tight">{user?.name}</p>
                        <p className="text-slate-500 text-xs">{user?.employeeCode}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {syncing && (
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Syncing
                        </span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <button
                        onClick={logout}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1.5"
                        title="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 pb-24 overflow-y-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${isActive
                                    ? 'text-blue-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
