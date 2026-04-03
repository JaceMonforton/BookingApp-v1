import React from 'react';
import { ConfigProvider, theme } from 'antd';
import 'antd/dist/reset.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import { useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Waiver from './components/Waiver';
import Packages from './pages/Packages';
import Dashboard from './pages/Dashboard';
import TrainerDashboard from './pages/TrainerDashboard';

const pulsedTheme = {
  token: {
    colorPrimary: '#0d9488',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0284c7',
    borderRadius: 10,
    borderRadiusLG: 14,
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyHeading: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    lineHeight: 1.55,
    boxShadow: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
    boxShadowSecondary: '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
  },
  components: {
    Layout: { bodyBg: '#f1f5f9', headerBg: '#ffffff', headerHeight: 56 },
    Card: { headerFontSize: 15, paddingLG: 22 },
    Button: { fontWeight: 600, controlHeight: 40 },
    Tabs: { titleFontSize: 14, itemSelectedColor: '#0d9488' },
    Form: { labelFontSize: 13, verticalLabelPadding: '0 0 6px' },
    Tag: { borderRadiusSM: 6 },
  },
  algorithm: theme.defaultAlgorithm,
};

function App() {
  const { loading } = useSelector((state) => state.alerts);

  return (
    <ConfigProvider theme={pulsedTheme}>
      <BrowserRouter>
        {loading && (
          <div className="app-loading-overlay" aria-busy="true" aria-label="Loading">
            <div className="app-loading-spinner" />
          </div>
        )}

        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: 10,
              fontSize: 14,
              boxShadow: '0 10px 40px -10px rgb(15 23 42 / 0.25)',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/register" element={<Navigate to="/login?tab=signup" replace />} />
          <Route path="/packages" element={<Packages />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles="client">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles="trainer,admin">
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute allowedRoles="trainer,admin">
                <Navigate to="/trainer" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms"
            element={
              <ProtectedRoute>
                <Waiver />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
