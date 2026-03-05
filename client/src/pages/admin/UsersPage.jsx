import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'Worker', assignedAreas: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/admin/users');
            setUsers(data.data || []);
        } catch (err) {
            console.error('[users]', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            const payload = {
                ...form,
                assignedAreas: form.assignedAreas.split(',').map((a) => a.trim()).filter(Boolean),
            };
            const { data } = await api.post('/api/auth/register', payload);
            setSuccess(`Created: ${data.user.employeeCode} — ${data.user.name}`);
            setForm({ name: '', phone: '', email: '', password: '', role: 'Worker', assignedAreas: '' });
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const toggleActive = async (user) => {
        try {
            await api.patch(`/api/admin/users/${user.employeeCode}`, { isActive: !user.isActive });
            load();
        } catch (err) {
            console.error('[toggle]', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    + Register Worker
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="bg-slate-900/60 border border-blue-500/30 rounded-2xl p-4 md:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" required className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone *" className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password *" type="password" required className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={form.assignedAreas} onChange={(e) => setForm({ ...form, assignedAreas: e.target.value })} placeholder="Areas (comma-separated)" className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Worker">Worker</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-emerald-400 text-sm">{success}</p>}
                    <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">Create Account</button>
                </form>
            )}

            {/* User Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-5 py-3">Code</th>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Phone</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Areas</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3.5 text-blue-400 text-sm font-mono font-medium">{u.employeeCode}</td>
                                        <td className="px-5 py-3.5 text-white text-sm">{u.name}</td>
                                        <td className="px-5 py-3.5 text-slate-400 text-sm">{u.phone || u.email || '—'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'
                                                }`}>{u.role}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {u.assignedAreas?.map((a) => (
                                                    <span key={a} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-md">{a}</span>
                                                )) || '—'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                                }`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button
                                                onClick={() => toggleActive(u)}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                    }`}
                                            >{u.isActive ? 'Deactivate' : 'Activate'}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
