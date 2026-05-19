import { Sprout, Activity, Plus, Brain, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGrows, getAllPlants } from '../services/firestoreService';
import { Grow, Plant } from '../types';
import { Link } from 'react-router-dom';
import { RecentMediaAnalysisWidget } from '../components/dashboard/RecentMediaAnalysisWidget';

export default function Dashboard() {
  const { user } = useAuth();
  const [grows, setGrows] = useState<Grow[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedGrows, fetchedPlants] = await Promise.all([
          getGrows(user.uid),
          getAllPlants(user.uid)
        ]);
        setGrows(fetchedGrows);
        setPlants(fetchedPlants);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const stats = [
    { label: 'Active Grows', value: grows.length.toString() },
    { label: 'Total Plants', value: plants.length.toString() },
    { label: 'Flowering Grows', value: grows.filter(g => g.stage.toLowerCase() === 'flower').length.toString() },
    { label: 'Vegetative Grows', value: grows.filter(g => g.stage.toLowerCase() === 'vegetative').length.toString() },
  ];

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-500 text-sm">Synchronizing cultivation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-xs font-bold uppercase tracking-widest text-white hover:text-emerald-400 transition-colors"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PhenoSage Dashboard</h1>
          <p className="text-slate-500 text-sm">Cultivation records overview.</p>
        </div>
        <Link 
          to="/grows"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
        >
          <Plus className="w-3 h-3" /> NEW GROW
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
            <div className="mt-1 text-2xl font-bold text-white">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Visual Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grows.length > 0 ? (
              grows.slice(0, 2).map((grow) => (
                <Link 
                  key={grow.id}
                  to={`/grows/${grow.id}`}
                  className="group relative rounded-3xl border border-brand-border bg-slate-900/40 p-5 transition hover:border-emerald-500/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 ring-1 ring-emerald-500/30 uppercase">{grow.stage}</span>
                      <h3 className="mt-2 text-lg font-bold text-white">{grow.name}</h3>
                      <p className="text-xs text-slate-500">{grow.medium} • Started {new Date(grow.startDate?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex flex-col items-center justify-center border border-slate-700">
                       <Sprout className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </Link>
              ))
            ) : null}

            {/* Empty State Card Placeholder */}
            <Link 
              to="/grows"
              className="rounded-3xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center p-8 text-center bg-brand-surface/20 hover:border-emerald-500/50 transition-colors"
            >
              <Sprout className="w-10 h-10 text-slate-700 mb-4" />
              <button className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                + Set Up Grow
              </button>
            </Link>
          </div>

          {/* Longitudinal Intelligence Table */}
          <div className="rounded-3xl border border-brand-border bg-brand-surface p-6">
            <h3 className="mb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Longitudinal Intelligence (Phase 5)</h3>
            <div className="space-y-5 text-center py-12">
              <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Longitudinal tracking will be activated in Phase 5 once media baseline analysis is available.
              </p>
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:border-l lg:border-brand-border lg:pl-6">
          <RecentMediaAnalysisWidget userId={user!.uid} />
          
          {/* Mini Chat Window */}
          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 opacity-50">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grow Copilot (Phase 6)</span>
            </div>
            <div className="relative">
               <div className="rounded-xl bg-brand-bg border border-brand-border px-3 py-2 text-[11px] text-slate-600">
                 Assistant offline until Phase 6
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
