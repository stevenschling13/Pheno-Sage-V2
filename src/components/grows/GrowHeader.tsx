import { Calendar, Target } from 'lucide-react';
import { Grow, toJsDate } from '../../types';

interface Props {
  grow: Grow;
  plantCount: number;
}

export function GrowHeader({ grow, plantCount }: Props) {
  const startDate = toJsDate(grow.startDate);
  const uptimeDays = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86_400_000) : 0;

  return (
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
              {startDate
                ? startDate.toLocaleDateString(undefined, {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex md:flex-col">
        <div className="flex-1 bg-brand-surface/50 p-6 border-r md:border-r-0 md:border-b border-brand-border flex flex-col justify-center items-center text-center">
          <div className="data-label mb-2">Plant Count</div>
          <div className="text-2xl data-value text-status-optimal">
            {plantCount.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="flex-1 bg-brand-surface/50 p-6 flex flex-col justify-center items-center text-center">
          <div className="data-label mb-2">SYS Uptime (Days)</div>
          <div className="text-2xl data-value">{uptimeDays.toString().padStart(3, '0')}</div>
        </div>
      </div>
    </header>
  );
}
