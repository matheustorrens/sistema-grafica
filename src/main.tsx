/**
 * Application Entry Point
 * Main entry file that bootstraps the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.css';

// Initialize the app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
