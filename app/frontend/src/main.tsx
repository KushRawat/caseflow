import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { RequestOverlay } from './components/RequestOverlay';
import { SessionManager } from './components/SessionManager';
import { TOAST_DURATION } from './config/ui';
import './i18n';
import './styles/global.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RequestOverlay />
        <SessionManager />
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: TOAST_DURATION,
            style: { background: 'transparent', boxShadow: 'none' }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
