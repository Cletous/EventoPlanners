import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './ui/Feedback';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6" role="status" aria-live="polite">
        <div className="mx-auto max-w-3xl pt-20">
          <LoadingState label="Restoring your session..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}
