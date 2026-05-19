import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  target: 'grow' | 'plant';
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export function ArchiveConfirmModal({ open, target, onConfirm, onCancel, submitting }: Props) {
  if (!open) return null;

  return (
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
          Confirm archiving of {target === 'grow' ? 'Grow Instance' : 'Plant Asset'}. Data will be
          unlinked from active views.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-brand-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            Terminate
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 bg-status-error text-brand-bg px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-50"
          >
            {submitting ? 'WAIT...' : 'EXECUTE'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
