import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingState } from './components/ui/Feedback';

const AdminEventsPage = lazy(() => import('./pages/AdminEventsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/AdminRegistrationsPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PaymentReturnPage = lazy(() => import('./pages/PaymentReturnPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserEventsPage = lazy(() => import('./pages/UserEventsPage'));
const UserRegistrationsPage = lazy(() => import('./pages/UserRegistrationsPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-3xl pt-20">
        <LoadingState label="Loading page..." />
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user/dashboard" element={<ProtectedRoute roles={['user']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/user/events" element={<ProtectedRoute roles={['user']}><UserEventsPage /></ProtectedRoute>} />
        <Route path="/user/registrations" element={<ProtectedRoute roles={['user']}><UserRegistrationsPage /></ProtectedRoute>} />
        <Route path="/payment/return" element={<ProtectedRoute roles={['user']}><PaymentReturnPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><DashboardPage admin /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute roles={['admin']}><AdminEventsPage /></ProtectedRoute>} />
        <Route path="/admin/registrations" element={<ProtectedRoute roles={['admin']}><AdminRegistrationsPage /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><AdminPaymentsPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
