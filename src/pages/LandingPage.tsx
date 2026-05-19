import {
  Leaf,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Target,
  Sprout,
  Cpu,
  Database,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { user, signInWithGoogle, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async () => {
    try {
      setSignInError(null);
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      setSignInError('Authentication failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-bg font-mono">
        <Loader2 className="h-6 w-6 animate-spin text-status-optimal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-zinc-300 overflow-hidden selection:bg-status-optimal selection:text-brand-bg font-sans flex flex-col">
      {/* Brutalist Grid Background Pattern */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <nav className="relative z-10 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full border-b border-brand-border bg-brand-bg">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-status-optimal" />
          <span className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            PHENOSAGE <span className="text-zinc-500 font-normal">v2</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 rounded border border-brand-border bg-brand-surface px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-status-warning animate-pulse"></div>
            <span className="data-label text-[9px] !text-zinc-400">SYS_AUTH_REQ</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 w-full flex-1 flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {(authError || signInError) && (
              <div className="mb-6 p-4 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase font-mono tracking-wider flex items-center gap-3">
                <AlertTriangle className="w-4 h-4" />
                {authError || signInError}
              </div>
            )}

            <div className="data-label mb-6 border border-brand-border w-fit px-2 py-1 bg-brand-surface flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-status-optimal" />
              Cultivation Operating System
            </div>

            <h1 className="text-5xl md:text-7xl font-mono text-zinc-100 uppercase tracking-tighter mb-6 leading-none">
              Precision <br />
              <span className="text-zinc-500">Cultivation.</span>
            </h1>

            <p className="text-sm font-mono text-zinc-400 max-w-lg mb-10 leading-relaxed uppercase tracking-wider">
              The professional operating system for structured cultivation logic. Track
              environmental parameters, visual diagnostics, and longitudinal array data.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="bg-status-optimal text-brand-bg px-6 py-3 text-[11px] font-mono font-bold hover:bg-emerald-400 transition-colors flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
              >
                {signingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Database className="w-4 h-4 shrink-0" />
                )}
                {signingIn ? 'Authenticating...' : 'Initialize Session'}
              </button>
              <button className="border border-brand-border bg-brand-surface text-zinc-400 hover:text-zinc-100 px-6 py-3 text-[11px] font-mono font-bold uppercase tracking-widest transition-colors">
                [ Protocol Docs ]
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="w-full max-w-lg mx-auto border border-brand-border bg-brand-surface font-mono overflow-hidden">
              <div className="border-b border-brand-border p-3 bg-brand-bg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    System Capabilities
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-status-optimal border border-status-optimal/30 bg-status-optimal/10 px-1.5 py-0.5">
                  Phase_7_Live
                </span>
              </div>

              <div className="p-4 bg-brand-bg space-y-px">
                {[
                  {
                    icon: Database,
                    label: 'Core Grow Data',
                    val: 'Online',
                    color: 'text-status-optimal',
                  },
                  {
                    icon: Target,
                    label: 'Media Library Cache',
                    val: 'Online',
                    color: 'text-status-optimal',
                  },
                  {
                    icon: Leaf,
                    label: 'AI Visual Diagnostics',
                    val: 'Online',
                    color: 'text-status-optimal',
                  },
                  {
                    icon: AlertTriangle,
                    label: 'Event Pipeline',
                    val: 'Online',
                    color: 'text-status-optimal',
                  },
                  {
                    icon: Cpu,
                    label: 'Predictive Ledger',
                    val: 'Online',
                    color: 'text-status-optimal',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center px-4 py-3 border border-brand-border bg-brand-surface/50 hover:bg-brand-surface transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-status-optimal transition-colors" />
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest ${item.color}`}
                    >
                      [{item.val}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-brand-border bg-brand-surface mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest gap-4">
          <div>
            System Built on <span className="text-zinc-300">&copy; PhenoSage Core v2</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">
              Privacy_Protocol
            </span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Ops_Manual</span>
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Sys_Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
