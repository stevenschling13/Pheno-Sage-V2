import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Archive, Pencil } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  getGrowById,
  getPlantsByGrow,
  createPlant,
  updateGrow,
  updatePlant,
} from '../services/firestoreService';
import { Grow, Plant, toJsDate } from '../types';

import { GrowHeader } from '../components/grows/GrowHeader';
import { PlantList } from '../components/grows/PlantList';
import { PlantFormModal, type PlantFormData } from '../components/grows/PlantFormModal';
import { EditGrowModal, type EditGrowFormData } from '../components/grows/EditGrowModal';
import { ArchiveConfirmModal } from '../components/grows/ArchiveConfirmModal';

const EMPTY_PLANT_FORM: PlantFormData = { name: '', strain: '' };

export default function GrowDetailPage() {
  const { growId } = useParams<{ growId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [grow, setGrow] = useState<Grow | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plant create/edit
  const [plantFormOpen, setPlantFormOpen] = useState(false);
  const [plantToEdit, setPlantToEdit] = useState<Plant | null>(null);
  const [plantFormData, setPlantFormData] = useState<PlantFormData>(EMPTY_PLANT_FORM);
  const [submittingPlant, setSubmittingPlant] = useState(false);
  const [plantError, setPlantError] = useState<string | null>(null);

  // Grow edit
  const [growFormOpen, setGrowFormOpen] = useState(false);
  const [growFormData, setGrowFormData] = useState<EditGrowFormData>({
    name: '',
    stage: 'Vegetative',
    medium: '',
    startDate: '',
  });
  const [submittingGrow, setSubmittingGrow] = useState(false);
  const [growError, setGrowError] = useState<string | null>(null);

  // Archive
  const [archiveTarget, setArchiveTarget] = useState<
    { kind: 'grow' } | { kind: 'plant'; plantId: string } | null
  >(null);

  const fetchData = useCallback(async () => {
    if (!user || !growId) return;
    try {
      setLoading(true);
      const [growData, plantsData] = await Promise.all([
        getGrowById(growId),
        getPlantsByGrow(user.uid, growId),
      ]);

      if (!growData || growData.ownerId !== user.uid) {
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
  }, [user, growId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPlantOpen = () => {
    setPlantToEdit(null);
    setPlantFormData(EMPTY_PLANT_FORM);
    setPlantError(null);
    setPlantFormOpen(true);
  };

  const handleEditPlantOpen = (plant: Plant) => {
    setPlantToEdit(plant);
    setPlantFormData({ name: plant.name, strain: plant.strain });
    setPlantError(null);
    setPlantFormOpen(true);
  };

  const handlePlantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !growId) return;
    try {
      setSubmittingPlant(true);
      setPlantError(null);
      if (plantToEdit) {
        await updatePlant(plantToEdit.id, plantFormData);
      } else {
        await createPlant(user.uid, growId, plantFormData);
      }
      setPlantFormOpen(false);
      setPlantToEdit(null);
      setPlantFormData(EMPTY_PLANT_FORM);
      fetchData();
    } catch (err) {
      console.error(err);
      setPlantError(plantToEdit ? 'Failed to update plant.' : 'Failed to add plant.');
    } finally {
      setSubmittingPlant(false);
    }
  };

  const handleEditGrowOpen = () => {
    if (!grow) return;
    const startDate = toJsDate(grow.startDate) ?? new Date();
    setGrowFormData({
      name: grow.name,
      stage: grow.stage,
      medium: grow.medium,
      startDate: startDate.toISOString().split('T')[0],
    });
    setGrowError(null);
    setGrowFormOpen(true);
  };

  const handleGrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grow) return;
    try {
      setSubmittingGrow(true);
      setGrowError(null);
      await updateGrow(grow.id, {
        name: growFormData.name,
        stage: growFormData.stage,
        medium: growFormData.medium,
        startDate: new Date(growFormData.startDate),
      });
      setGrowFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setGrowError('Failed to update grow.');
    } finally {
      setSubmittingGrow(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      if (archiveTarget.kind === 'grow') {
        if (!grow) return;
        setSubmittingGrow(true);
        await updateGrow(grow.id, { archived: true });
        navigate('/grows');
      } else {
        setSubmittingPlant(true);
        await updatePlant(archiveTarget.plantId, { archived: true });
        setArchiveTarget(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      if (archiveTarget.kind === 'grow') setGrowError('Failed to archive grow.');
    } finally {
      setSubmittingGrow(false);
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
            onClick={handleEditGrowOpen}
            className="p-1.5 border border-brand-border bg-brand-surface text-zinc-500 hover:text-status-optimal hover:border-status-optimal/30 transition-all"
            title="Edit Grow Instance"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setArchiveTarget({ kind: 'grow' })}
            className="p-1.5 border border-brand-border bg-brand-surface text-zinc-500 hover:text-status-error hover:border-status-error/30 transition-all"
            title="Archive Grow Instance"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <GrowHeader grow={grow} plantCount={plants.length} />

      <PlantList
        grow={grow}
        plants={plants}
        userId={user!.uid}
        onAddPlant={handleAddPlantOpen}
        onEditPlant={handleEditPlantOpen}
        onArchivePlant={(plantId) => setArchiveTarget({ kind: 'plant', plantId })}
      />

      <AnimatePresence>
        <PlantFormModal
          open={plantFormOpen}
          mode={plantToEdit ? 'edit' : 'create'}
          value={plantFormData}
          onChange={setPlantFormData}
          onSubmit={handlePlantSubmit}
          onCancel={() => {
            setPlantFormOpen(false);
            setPlantToEdit(null);
            setPlantError(null);
          }}
          submitting={submittingPlant}
          error={plantError}
        />
      </AnimatePresence>

      <AnimatePresence>
        <EditGrowModal
          open={growFormOpen}
          value={growFormData}
          onChange={setGrowFormData}
          onSubmit={handleGrowSubmit}
          onCancel={() => {
            setGrowFormOpen(false);
            setGrowError(null);
          }}
          submitting={submittingGrow}
          error={growError}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ArchiveConfirmModal
          open={archiveTarget !== null}
          target={archiveTarget?.kind ?? 'grow'}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchiveTarget(null)}
          submitting={submittingGrow || submittingPlant}
        />
      </AnimatePresence>
    </div>
  );
}
