// layouts/StudentLayout.jsx
// Mirrors WorkerLayout.jsx design exactly — same dark slate theme, bottom nav.
// No sync logic needed (students don't have offline data).

import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    {
        to: '/student/complaints',
        label: 'My Complaints',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
    {
        to: '/student/complaints/new',
        label: 'Report Issue',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
            </svg>
        ),
    },
];

export default function StudentLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top Bar — same style as WorkerLayout */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                        CC
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold leading-tight">{user?.name}</p>
                        <p className="text-slate-500 text-xs">Student</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1.5"
                    title="Logout"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

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
                            end
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${isActive
                                    ? 'text-purple-400'
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
