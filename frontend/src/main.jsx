import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const savedTheme = localStorage.getItem('eventoplanners_theme');
const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

document.documentElement.classList.toggle('dark', initialTheme === 'dark');
document.documentElement.style.colorScheme = initialTheme;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
