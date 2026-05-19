import { Activity, Droplets, Thermometer, Wind } from 'lucide-react';

export function LiveTelemetryPanel() {
  return (
    <div className="border border-brand-border bg-brand-bg flex flex-col font-mono text-[10px] uppercase tracking-widest text-zinc-400 shadow-md">
      <div className="flex items-center justify-between p-3 border-b border-brand-border bg-brand-surface/50">
        <div className="flex items-center gap-2 text-zinc-300 font-bold">
          <Activity className="w-3.5 h-3.5 text-status-optimal" />
          Live Telemetry Array
        </div>
        <div className="text-[8px] text-status-optimal blink border border-status-optimal/30 bg-status-optimal/10 px-1.5 py-0.5">
          ONLINE
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-brand-border">
        <Reading icon={<Wind className="w-2.5 h-2.5" />} label="VPD" unit="kpa" value="1.25" />
        <Reading
          icon={<Thermometer className="w-2.5 h-2.5" />}
          label="EC"
          unit="mS/cm"
          value="1.40"
        />
        <Reading
          icon={<Droplets className="w-2.5 h-2.5" />}
          label="Substrate"
          unit="%"
          value="48.2"
        />
        <Reading
          icon={<Activity className="w-2.5 h-2.5" />}
          label="State"
          value="NOMINAL"
          valueClass="text-status-optimal"
        />
      </div>
    </div>
  );
}

function Reading({
  icon,
  label,
  unit,
  value,
  valueClass = 'text-zinc-200',
}: {
  icon: React.ReactNode;
  label: string;
  unit?: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-[#050505] p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 mb-0.5">
        {icon} {label}
        {unit && <span className="text-status-optimal">({unit})</span>}
      </div>
      <span className={`text-lg font-bold font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}
