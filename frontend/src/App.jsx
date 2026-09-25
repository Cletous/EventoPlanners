
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import RegisterPage from './pages/RegisterPage';
import UserEventsPage from './pages/UserEventsPage';
import UserRegistrationsPage from './pages/UserRegistrationsPage';

function App() {
  return (
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
  );
}

export default App;

