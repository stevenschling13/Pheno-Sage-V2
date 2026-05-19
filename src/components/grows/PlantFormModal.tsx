import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export interface PlantFormData {
  name: string;
  strain: string;
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  value: PlantFormData;
  onChange: (next: PlantFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

export function PlantFormModal({
  open,
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  error,
}: Props) {
  if (!open) return null;

  return (
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
            {mode === 'edit' ? 'Configure Asset' : 'Construct Plant Asset'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 bg-brand-bg">
          {error && (
            <div className="p-3 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase tracking-wider">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              Asset Label/Tag
            </label>
            <input
              required
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
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
              value={value.strain}
              onChange={(e) => onChange({ ...value, strain: e.target.value })}
              placeholder="e.g. Kush Mints"
              className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-border mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-brand-border bg-brand-surface px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-status-optimal px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-brand-bg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'PROCESSING...' : 'COMMIT WRITE'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
