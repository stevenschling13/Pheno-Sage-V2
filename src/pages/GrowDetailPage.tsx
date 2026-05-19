import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Sprout,
  Calendar,
  Target,
  Trash2,
  Loader2,
  AlertTriangle,
  Archive,
  Leaf,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  getGrowById,
  getPlantsByGrow,
  createPlant,
  updateGrow,
  updatePlant,
} from '../services/firestoreService';
import { Grow, Plant, GrowStage } from '../types';

import { MediaUpload } from '../components/media/MediaUpload';
import { MediaGallery } from '../components/media/MediaGallery';

export default function GrowDetailPage() {
  const { growId } = useParams<{ growId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [grow, setGrow] = useState<Grow | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [plantFormData, setPlantFormData] = useState({ name: '', strain: '' });
  const [submittingPlant, setSubmittingPlant] = useState(false);
  const [plantError, setPlantError] = useState<string | null>(null);

  // Edit Grow State
  const [isEditGrowModalOpen, setIsEditGrowModalOpen] = useState(false);
  const [editGrowFormData, setEditGrowFormData] = useState({
    name: '',
    stage: 'Vegetative' as GrowStage,
    medium: '',
    startDate: '',
  });
  const [submittingGrowEdit, setSubmittingGrowEdit] = useState(false);
  const [growEditError, setGrowEditError] = useState<string | null>(null);

  // Edit Plant State
  const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null);
  const [editPlantFormData, setEditPlantFormData] = useState({ name: '', strain: '' });

  // Archive Confirmations
  const [growToArchive, setGrowToArchive] = useState<boolean>(false);
  const [plantToArchive, setPlantToArchive] = useState<string | null>(null);

  useEffect(() => {
    if (user && growId) fetchData();
  }, [user, growId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [growData, plantsData] = await Promise.all([
        getGrowById(growId!),
        getPlantsByGrow(user!.uid, growId!),
      ]);

      if (!growData || growData.ownerId !== user?.uid) {
        setError('Grow not found or access denied.');
        return;
      }

      setGrow(growData);
      setPlants(plantsData);
    } catch (err) {
      console.error('Error fetching grow details:', err);
      setError('Failed to load grow details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !growId) return;

    try {
      setSubmittingPlant(true);
      setPlantError(null);
      await createPlant(user.uid, growId, plantFormData);
      setIsAddPlantModalOpen(false);
      setPlantFormData({ name: '', strain: '' });
      fetchData();
    } catch (err) {
      console.error('Error creating plant:', err);
      setPlantError('Failed to add plant.');
    } finally {
      setSubmittingPlant(false);
    }
  };

  const openEditGrow = () => {
    if (!grow) return;
    setEditGrowFormData({
      name: grow.name,
      stage: grow.stage,
      medium: grow.medium,
      startDate: grow.startDate
        ? new Date((grow.startDate as any).seconds * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    setIsEditGrowModalOpen(true);
  };

  const handleEditGrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grow) return;
    try {
      setSubmittingGrowEdit(true);
      setGrowEditError(null);
      await updateGrow(grow.id, {
        name: editGrowFormData.name,
        stage: editGrowFormData.stage,
        medium: editGrowFormData.medium,
        startDate: new Date(editGrowFormData.startDate) as any,
      });
      setIsEditGrowModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error updating grow:', err);
      setGrowEditError('Failed to update grow.');
    } finally {
      setSubmittingGrowEdit(false);
    }
  };

  const handleArchiveGrow = async () => {
    if (!grow) return;
    try {
      setSubmittingGrowEdit(true);
      await updateGrow(grow.id, { archived: true });
      navigate('/grows');
    } catch (err) {
      console.error('Error archiving grow:', err);
      setGrowEditError('Failed to archive grow.');
      setSubmittingGrowEdit(false);
    }
  };

  const openEditPlant = (plant: Plant) => {
    setPlantToEdit(plant);
    setEditPlantFormData({ name: plant.name, strain: plant.strain });
  };

  const handleEditPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantToEdit) return;
    try {
      setSubmittingPlant(true);
      setPlantError(null);
      await updatePlant(plantToEdit.id, editPlantFormData);
      setPlantToEdit(null);
      fetchData();
    } catch (err) {
      console.error('Error updating plant:', err);
      setPlantError('Failed to update plant.');
    } finally {
      setSubmittingPlant(false);
    }
  };

  const handleArchivePlant = async () => {
    if (!plantToArchive) return;
    try {
      setSubmittingPlant(true);
      await updatePlant(plantToArchive, { archived: true });
      setPlantToArchive(null);
      fetchData();
    } catch (err) {
      console.error('Error archiving plant:', err);
      setSubmittingPlant(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-status-optimal animate-spin mb-4" />
        <p className="data-label text-zinc-500">SYNC_DOCUMENT</p>
      </div>
    );
  }

  if (error || !grow) {
    return (
      <div className="p-8 text-center bg-status-error/10 border border-status-error max-w-lg mx-auto flex flex-col items-center">
        <AlertTriangle className="w-8 h-8 text-status-error mx-auto mb-4" />
        <p className="text-status-error font-mono text-sm uppercase mb-4">
          {error || 'Access Denied'}
        </p>
        <Link to="/grows" className="data-label hover:text-status-optimal">
          [ Back to Records ]
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center justify-between border-b border-brand-border pb-4">
        <Link
          to="/grows"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors data-label"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <div className="flex gap-2">
          <button
            onClick={openEditGrow}
            className="p-1.5 border border-brand-border bg-brand-surface text-zinc-500 hover:text-status-optimal hover:border-status-optimal/30 transition-all"
            title="Edit Grow Instance"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGrowToArchive(true)}
            className="p-1.5 border border-brand-border bg-brand-surface text-zinc-500 hover:text-status-error hover:border-status-error/30 transition-all"
            title="Archive Grow Instance"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <header className="border border-brand-border bg-brand-surface flex flex-col md:flex-row shadow-sm">
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-border bg-brand-bg">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-status-warning/10 border border-status-warning/20 px-2.5 py-1 text-[10px] font-mono text-status-warning uppercase tracking-widest">
              {grow.stage}
            </span>
            <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
              ID: {grow.id.slice(0, 8)}
            </span>
          </div>

          <h1 className="text-3xl font-mono text-zinc-100 tracking-tight uppercase mb-6 truncate">
            {grow.name}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-auto">
            <div className="flex items-center gap-2 data-label text-zinc-400 font-mono normal-case">
              <Target className="w-3 h-3 text-zinc-600" /> MediaType:{' '}
              <span className="text-zinc-300">{grow.medium}</span>
            </div>
            <div className="flex items-center gap-2 data-label font-mono normal-case text-zinc-500">
              <Calendar className="w-3 h-3 text-zinc-600" /> Start:{' '}
              <span className="data-value text-xs">
                {new Date((grow.startDate as any)?.seconds * 1000).toLocaleDateString(undefined, {
                  month: '2-digit',
                  day: '2-digit',
                  year: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col">
          <div className="flex-1 bg-brand-surface/50 p-6 border-r md:border-r-0 md:border-b border-brand-border flex flex-col justify-center items-center text-center">
            <div className="data-label mb-2">Plant Count</div>
            <div className="text-2xl data-value text-status-optimal">
              {plants.length.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex-1 bg-brand-surface/50 p-6 flex flex-col justify-center items-center text-center">
            <div className="data-label mb-2">SYS Uptime (Days)</div>
            <div className="text-2xl data-value">
              {Math.floor((Date.now() / 1000 - (grow.startDate as any)?.seconds) / 86400)
                .toString()
                .padStart(3, '0')}
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
          <h2 className="data-label text-zinc-300">Registered Plant Assets</h2>
          <button
            onClick={() => setIsAddPlantModalOpen(true)}
            className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-status-optimal hover:text-emerald-400 transition-colors"
          >
            <Plus className="w-3 h-3" /> [ Add Plant ]
          </button>
        </div>

        {plants.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-12 text-center bg-brand-bg">
            <Sprout className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
              Null array. No plants discovered.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {plants.map((plant) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative border border-brand-border bg-brand-bg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-brand-border bg-brand-surface/40">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-status-optimal opacity-80" />
                    <div>
                      <Link
                        to={`/grows/${grow.id}/plants/${plant.id}`}
                        className="text-sm font-mono text-zinc-200 uppercase hover:text-status-optimal transition-colors"
                      >
                        {plant.name}
                      </Link>
                      <p className="data-label !text-[9px] mt-0.5">{plant.strain}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Link
                      to={`/grows/${grow.id}/plants/${plant.id}`}
                      className="border border-brand-border bg-brand-bg hover:bg-brand-surface text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 px-3 py-1.5 transition-colors font-bold mr-2"
                    >
                      [ Analytics ]
                    </Link>
                    <button
                      onClick={() => openEditPlant(plant)}
                      className="p-1.5 border border-transparent hover:border-brand-border text-zinc-500 hover:text-status-optimal transition-all"
                      title="Edit Item"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setPlantToArchive(plant.id)}
                      className="p-1.5 border border-transparent hover:border-brand-border text-zinc-500 hover:text-status-error transition-all"
                      title="Archive Item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 min-h-[300px]">
                  <div className="xl:col-span-1 border-b xl:border-b-0 xl:border-r border-brand-border p-4 bg-brand-surface/10 flex items-start justify-center">
                    <div className="w-full">
                      <MediaUpload userId={user!.uid} growId={grow.id} plantId={plant.id} />
                    </div>
                  </div>
                  <div className="xl:col-span-3 p-4 flex flex-col bg-brand-bg">
                    <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                      <h5 className="data-label">Media Library Cache</h5>
                    </div>
                    <div className="flex-1">
                      <MediaGallery userId={user!.uid} plantId={plant.id} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Plant Modal */}
      <AnimatePresence>
        {(isAddPlantModalOpen || plantToEdit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md border border-brand-border bg-brand-surface shadow-2xl font-mono overflow-hidden"
            >
              <div className="border-b border-brand-border p-4 bg-brand-bg flex items-center gap-2">
                <Leaf className="w-4 h-4 text-status-optimal" />
                <h2 className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                  {plantToEdit ? 'Configure Asset' : 'Construct Plant Asset'}
                </h2>
              </div>

              <form
                onSubmit={plantToEdit ? handleEditPlant : handleCreatePlant}
                className="p-6 space-y-5 bg-brand-bg"
              >
                {plantError && (
                  <div className="p-3 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase tracking-wider">
                    {plantError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                    Asset Label/Tag
                  </label>
                  <input
                    required
                    type="text"
                    value={plantToEdit ? editPlantFormData.name : plantFormData.name}
                    onChange={(e) =>
                      plantToEdit
                        ? setEditPlantFormData({ ...editPlantFormData, name: e.target.value })
                        : setPlantFormData({ ...plantFormData, name: e.target.value })
                    }
                    placeholder="e.g. KM-01"
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                    Cultivar Specification
                  </label>
                  <input
                    required
                    type="text"
                    value={plantToEdit ? editPlantFormData.strain : plantFormData.strain}
                    onChange={(e) =>
                      plantToEdit
                        ? setEditPlantFormData({ ...editPlantFormData, strain: e.target.value })
                        : setPlantFormData({ ...plantFormData, strain: e.target.value })
                    }
                    placeholder="e.g. Kush Mints"
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-brand-border mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddPlantModalOpen(false);
                      setPlantToEdit(null);
                      setPlantError(null);
                    }}
                    className="flex-1 border border-brand-border bg-brand-surface px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPlant}
                    className="flex-1 bg-status-optimal px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-brand-bg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {submittingPlant ? 'PROCESSING...' : 'COMMIT WRITE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Grow Modal */}
      <AnimatePresence>
        {isEditGrowModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg border border-brand-border bg-brand-surface font-mono overflow-hidden shadow-2xl"
            >
              <div className="border-b border-brand-border p-4 bg-brand-bg flex items-center gap-2">
                <Pencil className="w-4 h-4 text-status-warning" />
                <h2 className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                  Configure Grow Instance
                </h2>
              </div>

              <form onSubmit={handleEditGrow} className="p-6 space-y-5 bg-brand-bg">
                {growEditError && (
                  <div className="p-3 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase tracking-wider">
                    {growEditError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                    Grow Ident_String
                  </label>
                  <input
                    required
                    type="text"
                    value={editGrowFormData.name}
                    onChange={(e) =>
                      setEditGrowFormData({ ...editGrowFormData, name: e.target.value })
                    }
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                      INIT Stage
                    </label>
                    <select
                      value={editGrowFormData.stage}
                      onChange={(e) =>
                        setEditGrowFormData({
                          ...editGrowFormData,
                          stage: e.target.value as GrowStage,
                        })
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
                      value={editGrowFormData.medium}
                      onChange={(e) =>
                        setEditGrowFormData({ ...editGrowFormData, medium: e.target.value })
                      }
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
                    value={editGrowFormData.startDate}
                    onChange={(e) =>
                      setEditGrowFormData({ ...editGrowFormData, startDate: e.target.value })
                    }
                    className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-brand-border mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditGrowModalOpen(false);
                      setGrowEditError(null);
                    }}
                    className="flex-1 border border-brand-border bg-brand-surface px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrowEdit}
                    className="flex-1 bg-status-warning px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-black hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                  >
                    {submittingGrowEdit ? 'PROCESSING...' : 'APPLY MUTATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Modal (Grow or Plant) */}
      <AnimatePresence>
        {(growToArchive || plantToArchive) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm border border-status-error bg-brand-bg p-6 text-center shadow-[0_0_40px_rgba(239,68,68,0.15)] font-mono"
            >
              <AlertTriangle className="w-10 h-10 text-status-error mx-auto mb-4" />
              <h2 className="text-sm font-bold text-status-error uppercase mb-2 tracking-widest">
                Destructive Action
              </h2>
              <p className="text-zinc-400 text-xs mb-8 leading-relaxed">
                Confirm archiving of {growToArchive ? 'Grow Instance' : 'Plant Asset'}. Data will be
                unlinked from active views.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGrowToArchive(false);
                    setPlantToArchive(null);
                  }}
                  className="flex-1 border border-brand-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
                >
                  Terminate
                </button>
                <button
                  onClick={growToArchive ? handleArchiveGrow : handleArchivePlant}
                  disabled={submittingGrowEdit || submittingPlant}
                  className="flex-1 bg-status-error text-brand-bg px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-50"
                >
                  {submittingGrowEdit || submittingPlant ? 'WAIT...' : 'EXECUTE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
