import { motion } from 'motion/react';
import { Pencil } from 'lucide-react';
import { GrowStage } from '../../types';

export interface EditGrowFormData {
  name: string;
  stage: GrowStage;
  medium: string;
  startDate: string;
}

interface Props {
  open: boolean;
  value: EditGrowFormData;
  onChange: (next: EditGrowFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}

export function EditGrowModal({
  open,
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
        className="w-full max-w-lg border border-brand-border bg-brand-surface font-mono overflow-hidden shadow-2xl"
      >
        <div className="border-b border-brand-border p-4 bg-brand-bg flex items-center gap-2">
          <Pencil className="w-4 h-4 text-status-warning" />
          <h2 className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
            Configure Grow Instance
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
              Grow Ident_String
            </label>
            <input
              required
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all placeholder:text-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                INIT Stage
              </label>
              <select
                value={value.stage}
                onChange={(e) => onChange({ ...value, stage: e.target.value as GrowStage })}
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
                value={value.medium}
                onChange={(e) => onChange({ ...value, medium: e.target.value })}
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
              value={value.startDate}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              className="w-full border border-brand-border bg-brand-surface px-3 py-2 text-sm text-zinc-200 focus:border-status-optimal focus:ring-1 focus:ring-status-optimal outline-none transition-all"
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
              className="flex-1 bg-status-warning px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-black hover:bg-yellow-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'PROCESSING...' : 'APPLY MUTATION'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
