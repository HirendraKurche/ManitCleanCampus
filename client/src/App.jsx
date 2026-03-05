import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import UpdateBanner from './components/UpdateBanner';
import OfflineIndicator from './components/OfflineIndicator';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import WorkerLayout from './layouts/WorkerLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AttendancePage from './pages/worker/AttendancePage';
import TasksPage from './pages/worker/TasksPage';
import InventoryPage from './pages/worker/InventoryPage';
import OverviewPage from './pages/admin/OverviewPage';
import RosterPage from './pages/admin/RosterPage';
import TaskAuditPage from './pages/admin/TaskAuditPage';
import InventoryAdminPage from './pages/admin/InventoryAdminPage';
import UsersPage from './pages/admin/UsersPage';
import FlaggedPage from './pages/admin/FlaggedPage';

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/worker/attendance'} replace />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <UpdateBanner />

                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Root redirect */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Worker Routes */}
                    <Route
                        path="/worker"
                        element={
                            <ProtectedRoute roles={['Worker']}>
                                <WorkerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="attendance" replace />} />
                        <Route path="attendance" element={<AttendancePage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="inventory" element={<InventoryPage />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={['Admin']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<OverviewPage />} />
                        <Route path="roster" element={<RosterPage />} />
                        <Route path="tasks" element={<TaskAuditPage />} />
                        <Route path="inventory" element={<InventoryAdminPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="flagged" element={<FlaggedPage />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <OfflineIndicator />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
