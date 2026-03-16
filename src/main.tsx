import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { evictExpired } from './lib/cache/local';
import { initSettingsBridge } from './lib/settings-bridge';

evictExpired();
initSettingsBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
