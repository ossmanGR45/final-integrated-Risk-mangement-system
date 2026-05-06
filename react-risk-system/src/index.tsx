import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

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
