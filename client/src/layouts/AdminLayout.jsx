import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/admin', label: 'Overview', icon: '📊', end: true },
    { to: '/admin/roster', label: 'Roster', icon: '📍' },
    { to: '/admin/tasks', label: 'Task Audit', icon: '🖼️' },
    { to: '/admin/inventory', label: 'Inventory', icon: '📦' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/flagged', label: 'Flagged', icon: '⚠️' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col fixed h-full z-40">
                {/* Brand */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
                            FM
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold">Facility Mgmt</p>
                            <p className="text-slate-500 text-[10px]">Admin Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-600/15 text-blue-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`
                            }
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-slate-500 text-[10px]">{user?.employeeCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 text-xs font-medium rounded-lg transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 ml-64 p-6 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
