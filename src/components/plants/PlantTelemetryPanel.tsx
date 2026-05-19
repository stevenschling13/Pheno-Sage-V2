import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export interface TelemetryPoint {
  date: string;
  vpd: number;
  moisture: number;
  ec: number;
}

interface Props {
  data: TelemetryPoint[];
  hasImage: boolean;
  isAnalyzing: boolean;
  isBatchAnalyzing: boolean;
  batchProgress: { current: number; total: number } | null;
  analysisError: string | null;
  analysisSuccess: boolean;
  onTriggerAnalysis: () => void;
  onBatchAnalysis: () => void;
}

export function PlantTelemetryPanel({
  data,
  hasImage,
  isAnalyzing,
  isBatchAnalyzing,
  batchProgress,
  analysisError,
  analysisSuccess,
  onTriggerAnalysis,
  onBatchAnalysis,
}: Props) {
  const disableAnalysis = isAnalyzing || isBatchAnalyzing || !hasImage;

  return (
    <div className="border border-brand-border bg-brand-surface/20">
      <div className="flex items-center justify-between border-b border-brand-border bg-brand-bg p-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <span className="data-label text-zinc-300">Longitudinal Array (14D)</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-mono">
          <button className="px-2 py-1 bg-brand-surface border border-brand-border text-zinc-300 hover:text-status-optimal transition-colors">
            [ VPD ]
          </button>
          <button className="px-2 py-1 bg-brand-bg border border-brand-border text-zinc-500 hover:text-zinc-300 transition-colors">
            [ EC ]
          </button>
          <button className="px-2 py-1 bg-brand-bg border border-brand-border text-zinc-500 hover:text-zinc-300 transition-colors">
            [ H2O ]
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-brand-border border-b border-brand-border">
        <OverlayMetric label="Target Trend" value="1.20 - 1.40" tone="optimal" />
        <OverlayMetric label="7D Avg" value="1.25" tone="default" />
        <OverlayMetric label="Variance" value="+0.15" tone="warning" />
        <OverlayMetric label="Array Status" value="STABLE" tone="optimal" />
      </div>

      <div className="p-4 bg-brand-bg h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#52525b"
              fontSize={10}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip
              isAnimationActive={false}
              contentStyle={{
                backgroundColor: '#09090b',
                borderColor: '#52525b',
                borderRadius: '0',
                fontSize: '10px',
                textTransform: 'uppercase',
                padding: '8px',
                color: '#a1a1aa',
              }}
              itemStyle={{ color: '#10b981', padding: '0', margin: '0' }}
              cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="stepAfter"
              dataKey="vpd"
              stroke="#10b981"
              strokeWidth={2}
              fill="#10b981"
              fillOpacity={0.1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-brand-border p-3 bg-[#050505] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onTriggerAnalysis}
            disabled={disableAnalysis}
            className="text-[10px] font-mono border border-status-optimal text-status-optimal hover:bg-status-optimal hover:text-brand-bg px-3 py-1.5 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> EXECUTING...
              </>
            ) : (
              '[ Trigger Analysis ]'
            )}
          </button>
          <button
            onClick={onBatchAnalysis}
            disabled={disableAnalysis}
            className="text-[10px] font-mono border border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-3 py-1.5 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:flex items-center gap-2"
          >
            {isBatchAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> BATCH ({batchProgress?.current}/
                {batchProgress?.total})
              </>
            ) : (
              '[ Run Batch Analysis ]'
            )}
          </button>
          {analysisError && (
            <div className="flex items-center gap-1.5 text-[9px] text-status-error uppercase tracking-widest">
              <AlertTriangle className="w-3 h-3" /> {analysisError}
            </div>
          )}
          {analysisSuccess && (
            <div className="flex items-center gap-1.5 text-[9px] text-status-optimal uppercase tracking-widest blink">
              <CheckCircle2 className="w-3 h-3" /> DISPATCH SUCCESS
            </div>
          )}
        </div>
        <div className="text-[9px] uppercase text-zinc-600 tracking-widest hidden md:block">
          Diagnostic Pipeline Control
        </div>
      </div>
    </div>
  );
}

function OverlayMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'optimal' | 'warning' | 'default';
}) {
  const toneClass =
    tone === 'optimal'
      ? 'text-status-optimal'
      : tone === 'warning'
        ? 'text-status-warning'
        : 'text-zinc-200';
  return (
    <div className="bg-[#050505] p-2 flex flex-col justify-center">
      <div className="text-[8px] text-zinc-500 uppercase tracking-widest">{label}</div>
      <div className={`text-xs font-bold font-mono ${toneClass}`}>{value}</div>
    </div>
  );
}
