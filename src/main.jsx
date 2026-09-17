import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/MacroTracking">
      <AppProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
