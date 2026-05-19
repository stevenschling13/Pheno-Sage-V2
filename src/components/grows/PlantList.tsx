import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Leaf, Pencil, Plus, Sprout, Trash2 } from 'lucide-react';
import { Grow, Plant } from '../../types';
import { MediaUpload } from '../media/MediaUpload';
import { MediaGallery } from '../media/MediaGallery';

interface Props {
  grow: Grow;
  plants: Plant[];
  userId: string;
  onAddPlant: () => void;
  onEditPlant: (plant: Plant) => void;
  onArchivePlant: (plantId: string) => void;
}

export function PlantList({
  grow,
  plants,
  userId,
  onAddPlant,
  onEditPlant,
  onArchivePlant,
}: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
        <h2 className="data-label text-zinc-300">Registered Plant Assets</h2>
        <button
          onClick={onAddPlant}
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
                    onClick={() => onEditPlant(plant)}
                    className="p-1.5 border border-transparent hover:border-brand-border text-zinc-500 hover:text-status-optimal transition-all"
                    title="Edit Item"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onArchivePlant(plant.id)}
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
                    <MediaUpload userId={userId} growId={grow.id} plantId={plant.id} />
                  </div>
                </div>
                <div className="xl:col-span-3 p-4 flex flex-col bg-brand-bg">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                    <h5 className="data-label">Media Library Cache</h5>
                  </div>
                  <div className="flex-1">
                    <MediaGallery userId={userId} plantId={plant.id} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
