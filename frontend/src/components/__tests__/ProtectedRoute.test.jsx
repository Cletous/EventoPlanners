import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

function renderProtectedRoute({ initialPath = '/admin/secret', roles = ['admin'] } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login destination</div>} />
        <Route path="/admin/dashboard" element={<div>Admin dashboard destination</div>} />
        <Route path="/user/dashboard" element={<div>User dashboard destination</div>} />
        <Route
          path={initialPath}
          element={(
            <ProtectedRoute roles={roles}>
              <div>Protected content</div>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  test('shows a loading state while authentication is being restored', () => {
    useAuth.mockReturnValue({ user: null, isLoading: true });
    const { container } = renderProtectedRoute();

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('redirects an unauthenticated visitor to login', () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });
    renderProtectedRoute();

    expect(screen.getByText('Login destination')).toBeInTheDocument();
  });

  test('redirects a normal user away from an admin-only route', () => {
    useAuth.mockReturnValue({
      user: { id: 5, name: 'Test User', role: 'user' },
      isLoading: false,
    });
    renderProtectedRoute();

    expect(screen.getByText('User dashboard destination')).toBeInTheDocument();
  });

  test('renders protected content for an allowed administrator', () => {
    useAuth.mockReturnValue({
      user: { id: 1, name: 'Administrator', role: 'admin' },
      isLoading: false,
    });
    renderProtectedRoute();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('renders a user-only page for a normal attendee', () => {
    useAuth.mockReturnValue({
      user: { id: 9, name: 'Attendee', role: 'user' },
      isLoading: false,
    });
    renderProtectedRoute({ initialPath: '/user/secret', roles: ['user'] });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
