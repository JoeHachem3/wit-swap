import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import './style/index.css';
import Pool from './pages/Pool/Pool';
import Swap from './pages/Swap/Swap';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import getTheme from './style/theme';
import store, { persistor } from './store/store';
import Liquidity from './pages/Liquidity/Liquidity';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={getTheme('dark')}>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate replace to="/swap" />} />
              <Route path="/" element={<App />}>
                <Route path="swap" element={<Swap />} />
                <Route path="pool" element={<Pool />} />
                <Route path="liquidity" element={<Liquidity />} />
                <Route path="*" element={<Navigate replace to="/swap" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);

export const routes = [
  { to: '/swap', label: 'Swap' },
  { to: '/pool', label: 'Pool' },
];
