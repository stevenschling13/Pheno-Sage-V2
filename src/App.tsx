/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import GrowsPage from './pages/GrowsPage';
import GrowDetailPage from './pages/GrowDetailPage';
import ProtectedLayout from './components/layout/ProtectedLayout';
import { AuthProvider } from './contexts/AuthContext';

/**
 * App Component
 * 
 * Manages the application's routing and layout structure.
 * Protected routes are wrapped in ProtectedLayout.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/grows" element={<GrowsPage />} />
            <Route path="/grows/:growId" element={<GrowDetailPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
