import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { connectPanelSocket } from './stores/devices';
import './index.css';

connectPanelSocket();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
