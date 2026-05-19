import React, { useState, useEffect } from 'react';
import { Plus, Sprout, ChevronRight, Loader2, Calendar, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getGrows, createGrow } from '../services/firestoreService';
import { Grow, GrowStage } from '../types';
import { Link } from 'react-router-dom';

export default function GrowsPage() {
  const { user } = useAuth();
  const [grows, setGrows] = useState<Grow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stage: 'Vegetative' as GrowStage,
    medium: 'Soil',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchGrows();
  }, [user]);

  const fetchGrows = async () => {
    try {
      setLoading(true);
      const data = await getGrows(user!.uid);
      setGrows(data);
    } catch (error) {
      console.error('Error fetching grows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await createGrow(user.uid, {
        ...formData,
        startDate: new Date(formData.startDate)
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: new Date().toISOString().split('T')[0]
      });
      fetchGrows();
    } catch (error) {
      console.error('Error creating grow:', error);
      setErrorMsg('Failed to create grow. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Loading grow records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Grow Records</h1>
          <p className="text-slate-500 text-sm">Manage your cultivation batches and environments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" /> NEW GROW
        </button>
      </header>

      {grows.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-border bg-brand-surface/20 p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <Sprout className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Grows</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
            Create your first grow record to start tracking plant and grow records.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-[0.2em] transition-colors"
          >
            + Initialize New Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grows.map((grow) => (
            <motion.div
              key={grow.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              <Link to={`/grows/${grow.id}`}>
                <div className="h-full rounded-2xl border border-brand-border bg-brand-surface p-6 transition-all hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {grow.stage}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{grow.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 flex items-center gap-2 font-mono uppercase">
                    <Target className="w-3 h-3" /> {grow.medium}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-brand-border/50">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                      <Calendar className="w-3.5 h-3.5" />
                      Started {new Date(grow.startDate?.seconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Grow Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-lg rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create New Grow</h2>
              
              <form onSubmit={handleCreateGrow} className="space-y-5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Grow Unit Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Tent 1 - Kush Mints"
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Stage</label>
                    <select 
                      value={formData.stage}
                      onChange={(e) => setFormData({...formData, stage: e.target.value as GrowStage})}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors appearance-none"
                    >
                      <option value="Germination">Germination</option>
                      <option value="Seedling">Seedling</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flower">Flower</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Medium</label>
                    <input 
                      required
                      type="text"
                      value={formData.medium}
                      onChange={(e) => setFormData({...formData, medium: e.target.value})}
                      placeholder="Soil, DWC, etc."
                      className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                   <input 
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-brand-border px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    {submitting ? 'INITIALIZING...' : 'INITIALIZE GROW'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
