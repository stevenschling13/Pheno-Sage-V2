import React, { useState, useEffect } from 'react';
import { Plus, Sprout, ChevronRight, Loader2, Calendar, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getGrows, createGrow } from '../services/firestoreService';
import { Grow, GrowStage, toJsDate } from '../types';
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
    startDate: new Date().toISOString().split('T')[0],
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
        startDate: new Date(formData.startDate),
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        stage: 'Vegetative',
        medium: 'Soil',
        startDate: new Date().toISOString().split('T')[0],
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
        <Loader2 className="w-6 h-6 text-status-optimal animate-spin mb-4" />
        <p className="data-label text-zinc-500">SYNC_GROW_RECORDS</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-2xl font-mono text-zinc-100 tracking-tight uppercase">
            Grow Instances
          </h1>
          <p className="data-label mt-1">Manage Cultivation Batches</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-status-optimal text-brand-bg px-4 py-2 rounded-sm text-[10px] font-mono font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 w-fit uppercase"
        >
          <Plus className="w-3 h-3" /> Initialize Grow
        </button>
      </header>

      {grows.length === 0 ? (
        <div className="border border-dashed border-zinc-800 bg-brand-bg p-12 flex flex-col items-center justify-center text-center">
          <Sprout className="w-8 h-8 text-zinc-700 mb-4" />
          <h3 className="text-sm font-mono text-zinc-300 uppercase tracking-widest mb-2">
            Null Array
          </h3>
          <p className="text-xs font-mono text-zinc-500 max-w-xs mx-auto mb-6">
            Database contains 0 active grow configurations.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-mono text-status-optimal hover:underline uppercase"
          >
            [ Execute Batch Load ]
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border border border-brand-border">
          {grows.map((grow) => (
            <motion.div
              key={grow.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group relative bg-brand-bg"
            >
              <Link
                to={`/grows/${grow.id}`}
                className="block h-full p-5 hover:bg-brand-surface transition-colors cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2">
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-status-optimal transition-colors" />
                </div>

                <div className="mb-4">
                  <span className="bg-status-warning/10 text-status-warning border border-status-warning/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest">
                    {grow.stage}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-zinc-200 mb-2 truncate">{grow.name}</h3>
                <div className="flex items-center gap-2 data-label text-zinc-400 mb-6 font-mono normal-case">
                  <Target className="w-3 h-3 text-zinc-600" /> MediaType:{' '}
                  <span className="text-zinc-300">{grow.medium}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                  <div className="flex items-center gap-2 data-label">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    INIT:{' '}
                    <span className="data-value text-[10px]">
                      {toJsDate(grow.startDate)?.toLocaleDateString(undefined, {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit',
                      }) ?? '—'}
                    </span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg border border-brand-border bg-brand-surface shadow-2xl overflow-hidden font-mono"
            >
              <div className="border-b border-brand-border p-4 bg-brand-bg flex items-center gap-2">
                <Activity className="w-4 h-4 text-status-optimal" />
                <h2 className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                  Construct New Grow Instance
                </h2>
              </div>

              <form onSubmit={handleCreateGrow} className="p-6 space-y-5 bg-brand-bg">
                {errorMsg && (
                  <div className="p-3 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase tracking-wider">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                    Grow Ident_String
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. BATCH_01_KUSH"
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                      INIT Stage
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData({ ...formData, stage: e.target.value as GrowStage })
                      }
                      className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Germination">Germination</option>
                      <option value="Seedling">Seedling</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flower">Flower</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                      Bio_Medium
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.medium}
                      onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                      placeholder="Coco, Soil, RTW"
                      className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                    SYS_Boot_Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-brand-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-brand-border bg-brand-surface px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-status-optimal px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-brand-bg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'PROCESSING...' : 'EXECUTE LOAD'}
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
