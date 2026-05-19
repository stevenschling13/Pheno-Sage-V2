import { LayoutDashboard, Leaf, Sprout, ClipboardList, LogOut, Settings, User, Camera, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedLayout
 * 
 * Provides the sleek top header, sidebar navigation, and footer status bar.
 * Matches the 'Sleek Interface' aesthetic.
 */
export default function ProtectedLayout() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Grow Records', icon: Sprout, path: '/grows' },
  ];

  const aiTools = [
    { label: 'Visual Doctor (Coming Soon)', icon: Camera, path: '#', disabled: true },
    { label: 'Grow Copilot (Coming Soon)', icon: MessageSquare, path: '#', disabled: true },
  ];

  return (
    <div className="flex h-screen flex-col bg-brand-bg font-sans text-slate-300 antialiased overflow-hidden">
      {/* Global Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-border bg-brand-surface px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Leaf className="h-5 w-5 text-brand-bg" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            PhenoSage <span className="text-emerald-500">v2</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-brand-border bg-slate-900/50 py-1.5 pl-3 pr-4">
            <div className="h-2 w-2 rounded-full bg-slate-700"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Tools: Planned</span>
          </div>
          <div className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-brand-border bg-brand-surface/50 p-4 flex flex-col shrink-0">
          <div className="mb-6 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Core Operations</div>
          <div className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'emerald-glow' : 'opacity-60'}`} />
                  {item.label}
                </Link>
              );
            })}
            
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed">
              <AlertTriangle className="h-5 w-5 opacity-30" />
              Alerts (Coming Soon)
            </button>

            <div className="my-6 h-px bg-brand-border"></div>
            
            <div className="mb-4 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Tools</div>
            {aiTools.map((item) => (
                <div
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 cursor-not-allowed"
                >
                  <item.icon className="h-5 w-5 opacity-30" />
                  {item.label}
                </div>
            ))}
          </div>

          <div className="mt-auto p-2 border-t border-brand-border">
            <button 
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-brand-border bg-brand-surface px-6 text-[10px] text-slate-500 font-mono tracking-wider">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Firestore Sync Configured
          </span>
          <span className="flex items-center gap-1.5 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
            Analysis planned for Phase 4
          </span>
        </div>
        <div>PhenoSage v2 MVP</div>
      </footer>
    </div>
  );
}
