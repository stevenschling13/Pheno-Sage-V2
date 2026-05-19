import { CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface MorningBriefingProps {
  observations: string[];
  pendingApprovals: string[];
  onApprove: (approval: string) => void;
}

export default function MorningBriefing({
  observations,
  pendingApprovals,
  onApprove,
}: MorningBriefingProps) {
  return (
    <div className="w-full max-w-2xl border border-zinc-800 bg-[#09090b] rounded-none shadow-sm text-zinc-300 font-mono text-sm overflow-hidden">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
          Morning Briefing
        </span>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            System Observations
          </h4>
          <ul className="space-y-2">
            {observations.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0" />
                <span className="text-zinc-300 leading-relaxed">{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {pendingApprovals && pendingApprovals.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-status-warning mb-3 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Pending Approvals
            </h4>
            <div className="space-y-2.5">
              {pendingApprovals.map((approval, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-zinc-800 rounded-none bg-zinc-900/20"
                >
                  <span className="text-zinc-300">{approval}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(approval)}
                      className="px-3 py-1.5 text-xs bg-brand-surface border border-zinc-700 rounded-none hover:bg-zinc-800 text-zinc-300 transition-colors"
                    >
                      Modify
                    </button>
                    <button
                      onClick={() => onApprove(approval)}
                      className="px-3 py-1.5 text-xs bg-status-optimal/10 border border-status-optimal/30 text-status-optimal rounded-none hover:bg-status-optimal/20 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
