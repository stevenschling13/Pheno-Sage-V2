import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProtectedLayout from './components/layout/ProtectedLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { AlertsProvider } from './contexts/AlertsContext';

const CommandConsole = lazy(() => import('./pages/CommandConsole'));
const GrowsPage = lazy(() => import('./pages/GrowsPage'));
const GrowDetailPage = lazy(() => import('./pages/GrowDetailPage'));
const PlantDetailPage = lazy(() => import('./pages/PlantDetailPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const CopilotPage = lazy(() => import('./pages/CopilotPage'));

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
      Loading module…
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AlertsProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<CommandConsole />} />
                  <Route path="/grows" element={<GrowsPage />} />
                  <Route path="/grows/:growId" element={<GrowDetailPage />} />
                  <Route path="/grows/:growId/plants/:plantId" element={<PlantDetailPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/copilot" element={<CopilotPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AlertsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
