interface DiagnosticRow {
  label: string;
  status: string;
  tone: 'optimal' | 'warning';
  bold?: boolean;
}

const ROWS: DiagnosticRow[] = [
  { label: 'Canopy Volume', status: 'Nominal', tone: 'optimal' },
  { label: 'Nutrient Burn', status: 'None', tone: 'optimal' },
  { label: 'VPD Stress', status: 'Mild', tone: 'warning', bold: true },
];

export function DiagnosticPipelinePanel() {
  return (
    <div className="border border-brand-border p-4 bg-brand-surface shadow-md">
      <h3 className="data-label border-b border-brand-border pb-2 mb-3 !text-zinc-300">
        Diagnostic Pipeline
      </h3>
      <div className="space-y-2">
        {ROWS.map((row) => {
          const isWarn = row.tone === 'warning';
          return (
            <div
              key={row.label}
              className={`p-3 flex gap-3 text-xs font-mono items-center border ${
                isWarn
                  ? 'bg-status-warning/10 border-status-warning/20'
                  : 'bg-brand-bg border-zinc-800'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isWarn
                    ? 'bg-status-warning shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse'
                    : 'bg-status-optimal shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                }`}
              />
              <div className={isWarn ? 'text-status-warning' : 'text-zinc-400'}>{row.label}</div>
              <div
                className={`ml-auto ${
                  isWarn ? `${row.bold ? 'font-bold' : ''} text-status-warning` : 'text-zinc-100'
                }`}
              >
                {row.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
