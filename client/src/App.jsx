// App.jsx — UPDATED with complaint module routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import UpdateBanner from './components/UpdateBanner';
import OfflineIndicator from './components/OfflineIndicator';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import WorkerLayout from './layouts/WorkerLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Worker pages
import AttendancePage from './pages/worker/AttendancePage';
import TasksPage from './pages/worker/TasksPage';
import InventoryPage from './pages/worker/InventoryPage';

// Admin pages
import OverviewPage from './pages/admin/OverviewPage';
import RosterPage from './pages/admin/RosterPage';
import TaskAuditPage from './pages/admin/TaskAuditPage';
import InventoryAdminPage from './pages/admin/InventoryAdminPage';
import UsersPage from './pages/admin/UsersPage';
import FlaggedPage from './pages/admin/FlaggedPage';

// Complaint module pages
import ComplaintsAdminPage from './pages/admin/ComplaintsAdminPage';
import StudentComplaintsPage from './pages/student/StudentComplaintsPage';
import SubmitComplaintPage from './pages/student/SubmitComplaintPage';
import RegisterStudentPage from './pages/RegisterStudentPage';

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'Admin')   return <Navigate to="/admin" replace />;
    if (user.role === 'Student') return <Navigate to="/student/complaints" replace />;
    return <Navigate to="/worker/attendance" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <UpdateBanner />

                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterStudentPage />} />

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
                        <Route path="complaints" element={<ComplaintsAdminPage />} />
                    </Route>

                    {/* Student Routes */}
                    <Route
                        path="/student"
                        element={
                            <ProtectedRoute roles={['Student']}>
                                <StudentLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="complaints" replace />} />
                        <Route path="complaints" element={<StudentComplaintsPage />} />
                        <Route path="complaints/new" element={<SubmitComplaintPage />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <OfflineIndicator />
            </AuthProvider>
        </BrowserRouter>
    );
}

import LoginPage from './pages/LoginPage';
export default App;
