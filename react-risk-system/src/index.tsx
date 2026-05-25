import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

// Global fetch interceptor to automatically swap and retry between HTTP and HTTPS on port 7002.
// This resolves protocol mismatches depending on how developers run the frontend and backend 
// (e.g. running frontend locally on port 3000 but C# backend in Docker on HTTP port 7002).
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  if (typeof input === 'string') {
    if (input.startsWith('https://localhost:7002')) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        const httpUrl = input.replace('https://localhost:7002', 'http://localhost:7002');
        console.warn(`HTTPS fetch failed to localhost:7002, retrying on HTTP: ${httpUrl}`, error);
        return await originalFetch(httpUrl, init);
      }
    } else if (input.startsWith('http://localhost:7002')) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        const httpsUrl = input.replace('http://localhost:7002', 'https://localhost:7002');
        console.warn(`HTTP fetch failed to localhost:7002, retrying on HTTPS: ${httpsUrl}`, error);
        return await originalFetch(httpsUrl, init);
      }
    }
  }
  return originalFetch(input, init);
};

const USE_MOCK_API = false;

async function enableMocking() {
  if (!USE_MOCK_API) return;

  // This imports your worker configuration
  const { worker } = await import('./mocks/browser');

  // This starts the Service Worker in the browser
  return worker.start({ 
    onUnhandledRequest: 'bypass', // Don't warn about images/CSS requests
  });
}

// 1. Wait for mocking to enable
enableMocking().then(() => {
  // 2. ONLY render the app once the worker is active
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});

reportWebVitals();
