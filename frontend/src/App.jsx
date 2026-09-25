import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get('/health');

        if (response.data?.database === true) {
          setStatus('Frontend, Backend and Database are connected');
          return;
        }

        setStatus('Backend connected but database health check failed');
      } catch (error) {
        // Axios puts an HTTP response here when Next.js was reached but returned
        // an error status (for example, 503 when MySQL is unavailable).
        if (error.response) {
          if (error.response.data?.database === false) {
            setStatus('Backend connected but database connection failed');
            return;
          }

          setStatus(`Backend returned HTTP ${error.response.status}`);
          return;
        }

        // No HTTP response means the browser could not obtain a response from
        // the backend at all (server stopped, wrong URL/port, blocked request,
        // timeout, etc.).
        setStatus('Unable to connect to backend');
      }
    };

    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-slate-900">EventoPlanners</h1>

        <p className="mt-2 text-slate-500">Discover. Register. Attend.</p>

        <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-indigo-700">
          {status}
        </div>
      </div>
    </div>
  );
}

export default App;
