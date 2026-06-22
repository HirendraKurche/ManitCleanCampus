// App.jsx — UPDATED
// Change: added /admin/buildings route → BuildingManagement component
// Everything else identical to the continue-update.zip version

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import UpdateBanner from './components/UpdateBanner';
import OfflineIndicator from './components/OfflineIndicator';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import PushNotificationManager from './components/PushNotificationManager';
import WorkerLayout from './layouts/WorkerLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterStudentPage = lazy(() => import('./pages/RegisterStudentPage'));
const PublicDashboard = lazy(() => import('./pages/PublicDashboard'));

const WorkerAttendancePage = lazy(() => import('./pages/worker/AttendancePage'));
const TasksPage = lazy(() => import('./pages/worker/TasksPage'));
const InventoryPage = lazy(() => import('./pages/worker/InventoryPage'));

const OverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const AdminAttendancePage = lazy(() => import('./pages/admin/AttendancePage'));
const TaskAuditPage = lazy(() => import('./pages/admin/TaskAuditPage'));
const InventoryAdminPage = lazy(() => import('./pages/admin/InventoryAdminPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const FlaggedPage = lazy(() => import('./pages/admin/FlaggedPage'));
const ComplaintsAdminPage = lazy(() => import('./pages/admin/ComplaintsAdminPage'));
const BuildingManagement = lazy(() => import('./pages/admin/BuildingManagement'));

const StudentComplaintsPage = lazy(() => import('./pages/student/StudentComplaintsPage'));
const SubmitComplaintPage = lazy(() => import('./pages/student/SubmitComplaintPage'));

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
                <SocketProvider>
                    <PushNotificationManager />
                    <UpdateBanner />

                    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
                        <Routes>
                            {/* Public */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterStudentPage />} />
                            <Route path="/board" element={<PublicDashboard />} />

                            <Route path="/" element={<RootRedirect />} />

                            {/* Worker */}
                            <Route path="/worker" element={<ProtectedRoute roles={['Worker']}><WorkerLayout /></ProtectedRoute>}>
                                <Route index element={<Navigate to="attendance" replace />} />
                                <Route path="attendance" element={<WorkerAttendancePage />} />
                                <Route path="tasks" element={<TasksPage />} />
                                <Route path="inventory" element={<InventoryPage />} />
                            </Route>

                            {/* Admin */}
                            <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminLayout /></ProtectedRoute>}>
                                <Route index element={<OverviewPage />} />
                                <Route path="complaints" element={<ComplaintsAdminPage />} />
                                <Route path="buildings" element={<BuildingManagement />} />
                                <Route path="attendance" element={<AdminAttendancePage />} />
                                <Route path="tasks" element={<TaskAuditPage />} />
                                <Route path="inventory" element={<InventoryAdminPage />} />
                                <Route path="users" element={<UsersPage />} />
                                <Route path="flagged" element={<FlaggedPage />} />
                            </Route>

                            {/* Student */}
                            <Route path="/student" element={<ProtectedRoute roles={['Student']}><StudentLayout /></ProtectedRoute>}>
                                <Route index element={<Navigate to="complaints" replace />} />
                                <Route path="complaints" element={<StudentComplaintsPage />} />
                                <Route path="complaints/new" element={<SubmitComplaintPage />} />
                                <Route path="board" element={<PublicDashboard />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>

                    <OfflineIndicator />
                    <InstallPrompt />
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
