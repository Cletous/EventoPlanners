import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminEventsPage from './pages/AdminEventsPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserEventsPage from './pages/UserEventsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/user/dashboard"
        element={(
          <ProtectedRoute roles={['user']}>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/user/events"
        element={(
          <ProtectedRoute roles={['user']}>
            <UserEventsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/dashboard"
        element={(
          <ProtectedRoute roles={['admin']}>
            <DashboardPage admin />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/events"
        element={(
          <ProtectedRoute roles={['admin']}>
            <AdminEventsPage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
