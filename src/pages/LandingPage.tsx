import { Leaf, AlertCircle, ArrowRight, Loader2, Target, Calendar, User, Sprout } from 'lucide-react';
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
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-300 overflow-hidden selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Leaf className="w-6 h-6 text-brand-bg" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
            PhenoSage <span className="text-emerald-500">v2</span>
          </span>
        </div>
        <button 
          onClick={handleSignIn}
          disabled={signingIn}
          className="text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          {signingIn ? 'Signing In...' : 'Sign In'}
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-32">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {(authError || signInError) && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                {authError || signInError}
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cultivation tracking v2
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter mb-8 italic uppercase text-white">
              Cultivate <br />
              <span className="text-emerald-500">Precision.</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-lg mb-12 leading-relaxed">
              The professional operating system for cannabis cultivators. 
              Track grows and plants, with AI visual diagnostics and longitudinal memory coming in future phases.
            </p>
            
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={handleSignIn}
                disabled={signingIn}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-3 disabled:opacity-50"
              >
                {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {signingIn ? 'Authenticating...' : 'Get Started'}
              </button>
              <button className="bg-brand-surface border border-brand-border hover:border-slate-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all">
                Documentation
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-[500px] mx-auto border border-brand-border rounded-[40px] bg-brand-surface/40 backdrop-blur-3xl p-10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              
              <div className="relative flex justify-between items-start mb-12">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">Platform Status</div>
                  <div className="text-2xl font-bold text-white font-mono tracking-tight">Phase 2 Active</div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Target, label: "Grow Tracking", val: "Live", color: "text-emerald-400" },
                  { icon: Sprout, label: "Plant Tracking", val: "Live", color: "text-emerald-400" },
                  { icon: Leaf, label: "Visual Diagnostics", val: "Planned", color: "text-slate-500" },
                  { icon: AlertCircle, label: "Proactive Tasking", val: "Planned", color: "text-slate-500" }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-5 rounded-2xl border border-brand-border hover:bg-slate-800/50 transition-colors group cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-slate-800 group-hover:bg-brand-bg transition-colors`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-brand-border py-16">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-slate-500">
          <div className="text-[10px] font-black uppercase tracking-[0.3em]">&copy; PhenoSage Core v2</div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
            <span className="hover:text-emerald-500 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-emerald-500 cursor-pointer transition-colors">Operations</span>
            <span className="hover:text-emerald-500 cursor-pointer transition-colors">Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
