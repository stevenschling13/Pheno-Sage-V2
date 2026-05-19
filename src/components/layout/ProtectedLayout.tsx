import {
  LayoutDashboard,
  Leaf,
  Sprout,
  LogOut,
  Camera,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedLayout() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-bg">
        <Loader2 className="h-6 w-6 animate-spin text-status-optimal" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { label: 'Command Console', icon: Terminal, path: '/dashboard' },
    { label: 'Grow Records', icon: Sprout, path: '/grows' },
    { label: 'Alerts', icon: AlertTriangle, path: '/alerts' },
  ];

  return (
    <div className="flex h-[100dvh] print:h-auto flex-col bg-brand-bg print:bg-white font-sans text-zinc-300 antialiased overflow-hidden print:overflow-visible selection:bg-status-optimal selection:text-white relative">
      {/* Global Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-brand-border bg-brand-surface px-4 md:px-6 z-10 relative print:hidden">
        <div className="flex items-center gap-3">
          <Leaf className="h-4 w-4 text-status-optimal" />
          <span className="text-sm font-bold tracking-tight text-white uppercase">
            PHENOSAGE <span className="text-zinc-500 font-normal">v2</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 rounded border border-brand-border bg-brand-bg px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-status-optimal animate-pulse"></div>
            <span className="data-label text-[9px] !text-zinc-400">SYS_ONLINE</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">DISCONNECT</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative print:overflow-visible">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-56 flex-col border-r border-brand-border bg-brand-surface/50 p-3 shrink-0 print:hidden">
          <div className="mb-4 px-2 data-label">Views</div>
          <div className="space-y-0.5 flex-1 mx-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex w-full items-center gap-3 rounded p-2 text-xs font-mono transition-colors ${
                    isActive
                      ? 'bg-brand-surface text-status-optimal border border-brand-border'
                      : 'text-zinc-400 hover:bg-brand-surface border border-transparent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-6 h-px bg-brand-border"></div>

            <div className="mb-4 px-2 data-label">Tools</div>
            <div className="flex w-full items-center gap-3 rounded p-2 text-xs font-mono text-zinc-600 cursor-not-allowed">
              <Camera className="h-4 w-4" /> Visual Doctor
            </div>
            <Link
              to="/copilot"
              className={`flex w-full items-center gap-3 rounded p-2 text-xs font-mono transition-colors ${
                location.pathname === '/copilot'
                  ? 'bg-brand-surface text-status-optimal border border-brand-border'
                  : 'text-zinc-400 hover:bg-brand-surface border border-transparent'
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Copilot
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0 z-0 relative print:overflow-visible">
          <div className="p-4 md:p-6 mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-1 left-1 right-1 h-[60px] terminal-glass rounded-xl px-2 !backdrop-blur-xl flex items-center justify-around z-50 print:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-status-optimal' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-mono uppercase tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Status Bar (Desktop Only) */}
      <footer className="hidden md:flex h-6 items-center justify-between border-t border-brand-border bg-brand-bg px-4 !text-[10px] uppercase font-mono text-zinc-500 tracking-wider print:hidden">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-status-optimal"></span>
            Firestore Sync Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
            Analysis Phase 4 Pipeline
          </span>
        </div>
        <div>
          {user.email} <span className="mx-2 text-zinc-700">|</span> SESSION ACTIVE
        </div>
      </footer>
    </div>
  );
}
