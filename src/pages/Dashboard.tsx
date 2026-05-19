import { Sprout, Activity, Plus, MessageSquare, Loader2, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { getGrows, getAllPlants } from '../services/firestoreService';
import { Grow, Plant } from '../types';
import { Link } from 'react-router-dom';
import { RecentMediaAnalysisWidget } from '../components/dashboard/RecentMediaAnalysisWidget';
import { CopilotTerminal } from '../components/copilot/TerminalCopilot';
import { seedDatabase } from '../services/seedService';

export default function Dashboard() {
  const { user } = useAuth();
  const { findings } = useAlerts();
  const [grows, setGrows] = useState<Grow[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await seedDatabase(user.uid);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Seeding failed. Check console.');
    } finally {
      setIsSeeding(false);
    }
  };

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
    { label: 'Flowering', value: grows.filter(g => g.stage.toLowerCase() === 'flower').length.toString() },
    { label: 'Vegetative', value: grows.filter(g => g.stage.toLowerCase() === 'vegetative').length.toString() },
  ];

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-6 h-6 text-status-optimal animate-spin" />
        <p className="data-label text-zinc-500">SYNC_INITIALIZING</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-status-error bg-status-error/10 p-4 shrink-0 text-center">
        <p className="text-status-error font-mono text-sm uppercase">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 data-label !text-zinc-300 hover:!text-status-error transition-colors"
        >
          [ Retry Sync ]
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-2xl font-mono text-zinc-100 tracking-tight uppercase">Control Center</h1>
          <p className="data-label mt-1">Cultivation Intel / Overview</p>
        </div>
        <Link 
          to="/grows"
          className="bg-status-optimal text-brand-bg px-4 py-2 rounded-sm text-[10px] font-mono font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 w-fit uppercase"
        >
          <Plus className="w-3 h-3" /> Initialize Grow
        </Link>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-border border border-brand-border">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-brand-bg p-4 flex flex-col"
          >
            <div className="data-label">{stat.label}</div>
            <div className="mt-2 text-2xl data-value">
              {stat.value.padStart(3, '0')}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Feed Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section>
             <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                <span className="data-label">Active Grow Instances</span>
             </div>
             <div className="flex flex-col border border-brand-border bg-brand-bg">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-3 border-b border-brand-border bg-brand-surface/30">
                  <div className="col-span-1"></div>
                  <div className="col-span-5 data-label">Identifier</div>
                  <div className="col-span-2 data-label text-center">Stage</div>
                  <div className="col-span-2 data-label text-center">Medium</div>
                  <div className="col-span-2 data-label text-right">Start_Date</div>
                </div>

                {grows.length > 0 ? (
                  grows.slice(0, 5).map((grow) => (
                    <Link 
                      key={grow.id}
                      to={`/grows/${grow.id}`}
                      className="group grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-3 border-b border-brand-border last:border-b-0 hover:bg-brand-surface transition-colors items-center"
                    >
                      <div className="hidden md:flex col-span-1 justify-center">
                        <Sprout className="w-4 h-4 text-zinc-600 group-hover:text-status-optimal transition-colors" />
                      </div>
                      <div className="col-span-5">
                         <div className="text-sm font-medium text-zinc-200">{grow.name}</div>
                         {/* Mobile only details */}
                         <div className="md:hidden mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-mono text-status-warning bg-status-warning/10 px-1 py-0.5">{grow.stage}</span>
                            <span className="text-[10px] font-mono text-zinc-500">{grow.medium}</span>
                         </div>
                      </div>
                      <div className="hidden md:block col-span-2 text-center text-[10px] uppercase font-mono text-status-warning">
                          {grow.stage}
                      </div>
                      <div className="hidden md:block col-span-2 text-center data-value text-xs text-zinc-400">
                          {grow.medium}
                      </div>
                      <div className="hidden md:block col-span-2 text-right data-value text-xs text-zinc-500">
                          {new Date(grow.startDate?.seconds * 1000).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center bg-brand-bg flex flex-col items-center justify-center">
                    <Sprout className="w-8 h-8 text-zinc-700 mb-3" />
                    <span className="data-label mb-4">No active records found</span>
                    <Link to="/grows" className="text-xs font-mono text-status-optimal hover:underline uppercase">
                       [ Execute Grow Setup ]
                    </Link>
                  </div>
                )}
             </div>
          </section>

          {/* Event Pipeline / Phase 5 */}
          <section>
             <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                <span className="data-label">Event Pipeline (Phase 5)</span>
             </div>
             <div className="border border-brand-border bg-brand-surface border-l-2 border-l-status-optimal p-6 flex items-start gap-4 hover:bg-brand-surface/80 transition-colors">
                <Activity className="w-5 h-5 text-status-optimal shrink-0" />
                <div className="flex-1">
                   <span className="data-label !text-zinc-200">Proactive Tasking Active</span>
                   <p className="text-[11px] font-mono text-zinc-400 mt-1 mb-3">
                     Diagnostic processing pipeline is actively mapping visual arrays.
                   </p>
                   <Link to="/alerts" className="text-[10px] font-mono text-status-optimal border border-status-optimal bg-status-optimal/10 px-2 py-1 uppercase tracking-widest hover:bg-status-optimal hover:text-brand-bg transition-colors">
                      [ Open Task Stream: {findings.length} Events ]
                   </Link>
                </div>
             </div>
          </section>
        </div>

        {/* AI Insight Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:border-l lg:border-brand-border lg:pl-6 max-h-full">
          
          {/* Dense Diagnostic Matrix */}
          <div className="border border-brand-border bg-brand-bg flex flex-col font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <div className="flex items-center gap-2 p-3 border-b border-brand-border bg-brand-surface/50">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-bold text-zinc-300">System Diagnostic Matrix</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-brand-border">
              <div className="bg-brand-bg p-3 flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600">Avg Env VPD</span>
                <span className="text-sm font-bold text-zinc-200">1.33 <span className="text-[9px] text-zinc-500 font-normal tracking-wide">kPa</span></span>
              </div>
              <div className="bg-brand-bg p-3 flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600">Canopy Health</span>
                <span className="text-sm font-bold text-status-optimal">94%</span>
              </div>
              <div className="bg-brand-bg p-3 flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600">Recent Scans</span>
                <span className="text-sm font-bold text-zinc-200">24</span>
              </div>
              <div className="bg-brand-bg p-3 flex flex-col gap-1">
                <span className="text-[8px] text-zinc-600">Active Flags</span>
                <span className="text-sm font-bold text-status-warning">{findings.length}</span>
              </div>
            </div>
          </div>

          <RecentMediaAnalysisWidget userId={user!.uid} />
          
          {/* Phase 6 Copilot Ledger */}
          <div className="flex-1 min-h-[400px]">
             <CopilotTerminal />
          </div>
        </div>
      </div>

      {/* Dev Tools Footer */}
      <div className="mt-12 mb-4 pt-4 border-t border-zinc-900 border-dashed flex justify-end">
        <button 
          onClick={handleSeedData}
          disabled={isSeeding}
          className="text-[9px] uppercase font-mono tracking-widest text-zinc-600 hover:text-blue-400 border border-transparent hover:border-blue-500/30 px-2 py-1 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
           {isSeeding ? '[ EXECUTING BATCH SEED... ]' : '[ SYS_DEV_SEED_ROUTINE ]'}
        </button>
      </div>
    </div>
  );
}
