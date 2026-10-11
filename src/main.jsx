import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Automatically reload the page if a new deployment rendered old code chunks obsolete
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = parseInt(sessionStorage.getItem('worklog_chunk_reload') || '0', 10);
  if (Date.now() - lastReload > 15000) {
    sessionStorage.setItem('worklog_chunk_reload', Date.now().toString());
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary level="root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

