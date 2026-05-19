/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CommandConsole from './pages/CommandConsole';
import GrowsPage from './pages/GrowsPage';
import GrowDetailPage from './pages/GrowDetailPage';
import AlertsPage from './pages/AlertsPage';
import PlantDetailPage from './pages/PlantDetailPage';
import CopilotPage from './pages/CopilotPage';
import ProtectedLayout from './components/layout/ProtectedLayout';
import { AuthProvider } from './contexts/AuthContext';
import { AlertsProvider } from './contexts/AlertsContext';

/**
 * App Component
 * 
 * Manages the application's routing and layout structure.
 * Protected routes are wrapped in ProtectedLayout.
 */
export default function App() {
  return (
    <AuthProvider>
      <AlertsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<CommandConsole />} />
              <Route path="/grows" element={<GrowsPage />} />
              <Route path="/grows/:growId" element={<GrowDetailPage />} />
              <Route path="/grows/:growId/plants/:plantId" element={<PlantDetailPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/copilot" element={<CopilotPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AlertsProvider>
    </AuthProvider>
  );
}
