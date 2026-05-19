import { Leaf } from 'lucide-react';
import { Plant } from '../../types';

interface Props {
  plant: Plant;
}

export function PlantHeader({ plant }: Props) {
  return (
    <div className="border border-brand-border bg-brand-surface p-6 font-mono text-zinc-100 flex justify-between items-end">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-status-optimal" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Plant Asset Record
          </span>
        </div>
        <h1 className="text-2xl uppercase tracking-tighter">{plant.name}</h1>
        <p className="data-label mt-1">Cultivar: {plant.strain}</p>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1">Asset ID</div>
        <div className="text-xs text-zinc-400">{plant.id.split('-')[0]}</div>
      </div>
    </div>
  );
}
