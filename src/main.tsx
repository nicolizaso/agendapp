import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      theme="dark"
      richColors
      toastOptions={{
        style: {
          background: 'var(--color-ink-850)',
          border: '1px solid var(--color-ink-700)',
          color: 'var(--color-ink-100)',
        },
      }}
    />
  </StrictMode>
);
