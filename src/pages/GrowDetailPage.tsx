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
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getGrowById, getPlantsByGrow, createPlant, updateGrow, updatePlant } from '../services/firestoreService';
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
  const [editGrowFormData, setEditGrowFormData] = useState({ name: '', stage: 'Vegetative' as GrowStage, medium: '', startDate: '' });
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
        getPlantsByGrow(user!.uid, growId!)
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
      startDate: grow.startDate ? new Date((grow.startDate as any).seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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
        startDate: new Date(editGrowFormData.startDate) as any
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
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Accessing cultivation documents...</p>
      </div>
    );
  }

  if (error || !grow) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 font-bold mb-4">{error || 'Access Denied'}</p>
        <Link to="/grows" className="text-white hover:text-emerald-400 font-bold text-xs uppercase tracking-widest">
           Back to Records
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <nav className="flex items-center justify-between">
        <Link 
          to="/grows" 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={openEditGrow}
            className="p-2.5 rounded-xl border border-brand-border bg-brand-surface text-slate-500 hover:text-emerald-400 hover:border-emerald-400/30 transition-all"
            title="Edit Grow"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setGrowToArchive(true)}
            className="p-2.5 rounded-xl border border-brand-border bg-brand-surface text-slate-500 hover:text-red-400 hover:border-red-400/30 transition-all"
            title="Archive Grow"
          >
            <Archive className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <header className="rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-xl">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                {grow.stage}
              </span>
              <span className="text-slate-700 text-xs font-mono uppercase">ID: {grow.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">{grow.name}</h1>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Target className="w-4 h-4 text-emerald-500 opacity-60" /> {grow.medium}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-emerald-500 opacity-60" /> Started {new Date((grow.startDate as any)?.seconds * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 min-w-[200px]">
            <div className="bg-brand-bg rounded-2xl border border-brand-border p-4 text-center">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Plants</div>
              <div className="text-2xl font-black text-white">{plants.length}</div>
            </div>
            <div className="bg-brand-bg rounded-2xl border border-brand-border p-4 text-center">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Days</div>
              <div className="text-2xl font-black text-white">
                {Math.floor((Date.now() / 1000 - (grow.startDate as any)?.seconds) / 86400)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Individual Plant Assets</h2>
          <button 
            onClick={() => setIsAddPlantModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-surface border border-brand-border px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all"
          >
            <Plus className="w-4 h-4" /> ADD PLANT
          </button>
        </div>

        {plants.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-brand-border p-12 text-center bg-brand-surface/20">
            <Sprout className="w-8 h-8 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No plants added to this grow unit yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {plants.map((plant) => (
              <motion.div 
                key={plant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-3xl border border-brand-border bg-brand-bg p-6 lg:p-8 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="font-black text-2xl text-white tracking-tight uppercase">{plant.name}</h4>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{plant.strain}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditPlant(plant)}
                      className="p-2.5 rounded-xl border border-brand-border bg-brand-surface text-slate-500 hover:text-emerald-400 transition-all"
                      title="Edit Plant"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPlantToArchive(plant.id)}
                      className="p-2.5 rounded-xl border border-brand-border bg-brand-surface text-slate-500 hover:text-red-400 transition-all"
                      title="Archive Plant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 border-b xl:border-b-0 xl:border-r border-brand-border pb-6 xl:pb-0 xl:pr-6">
                     <MediaUpload userId={user!.uid} growId={grow.id} plantId={plant.id} />
                  </div>
                  <div className="xl:col-span-2">
                     <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Media Library</h5>
                     <MediaGallery userId={user!.uid} plantId={plant.id} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">{plantToEdit ? 'Edit Plant' : 'Add Plant Asset'}</h2>
              
              <form onSubmit={plantToEdit ? handleEditPlant : handleCreatePlant} className="space-y-5">
                {plantError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {plantError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Plant Label/Tag</label>
                  <input 
                    required
                    type="text"
                    value={plantToEdit ? editPlantFormData.name : plantFormData.name}
                    onChange={(e) => plantToEdit 
                      ? setEditPlantFormData({...editPlantFormData, name: e.target.value})
                      : setPlantFormData({...plantFormData, name: e.target.value})}
                    placeholder="e.g. KM-01"
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Strain / Cultivar</label>
                  <input 
                    required
                    type="text"
                    value={plantToEdit ? editPlantFormData.strain : plantFormData.strain}
                    onChange={(e) => plantToEdit
                      ? setEditPlantFormData({...editPlantFormData, strain: e.target.value})
                      : setPlantFormData({...plantFormData, strain: e.target.value})}
                    placeholder="e.g. Kush Mints"
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAddPlantModalOpen(false); setPlantToEdit(null); setPlantError(null); }}
                    className="flex-1 rounded-xl border border-brand-border px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingPlant}
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    {submittingPlant ? 'SAVING...' : 'SAVE PLANT'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-lg rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Edit Grow Container</h2>
              
              <form onSubmit={handleEditGrow} className="space-y-5">
                {growEditError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {growEditError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Grow Unit Name</label>
                  <input 
                    required
                    type="text"
                    value={editGrowFormData.name}
                    onChange={(e) => setEditGrowFormData({...editGrowFormData, name: e.target.value})}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Stage</label>
                    <select 
                      value={editGrowFormData.stage}
                      onChange={(e) => setEditGrowFormData({...editGrowFormData, stage: e.target.value as GrowStage})}
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
                      value={editGrowFormData.medium}
                      onChange={(e) => setEditGrowFormData({...editGrowFormData, medium: e.target.value})}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                   <input 
                    required
                    type="date"
                    value={editGrowFormData.startDate}
                    onChange={(e) => setEditGrowFormData({...editGrowFormData, startDate: e.target.value})}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsEditGrowModalOpen(false); setGrowEditError(null); }}
                    className="flex-1 rounded-xl border border-brand-border px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingGrowEdit}
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    {submittingGrowEdit ? 'SAVING...' : 'SAVE CHANGES'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-bg/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-2xl text-center"
            >
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                Archive {growToArchive ? 'Grow' : 'Plant'}
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                Are you sure you want to archive {growToArchive ? 'this entire grow' : 'this plant'}? It will be removed from your active records.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => { setGrowToArchive(false); setPlantToArchive(null); }}
                  className="flex-1 rounded-xl border border-brand-border px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={growToArchive ? handleArchiveGrow : handleArchivePlant}
                  disabled={submittingGrowEdit || submittingPlant}
                  className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 text-sm font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {(submittingGrowEdit || submittingPlant) ? 'ARCHIVING...' : 'ARCHIVE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
