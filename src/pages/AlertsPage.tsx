import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { AlertTriangle, CheckCircle2, ShieldAlert, Zap, Loader2, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AlertsPage() {
  const { user } = useAuth();
  const { findings, loading, resolveFinding } = useAlerts();

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-6 h-6 text-status-optimal animate-spin" />
        <p className="data-label text-zinc-500">SYNC_ALERTS_DB</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-2xl font-mono text-zinc-100 tracking-tight uppercase">Event Pipeline</h1>
          <p className="data-label mt-1">Proactive Tasking & Diagnostics</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="data-label text-zinc-300">Action Required [{findings.length}]</span>
          </div>
          
          {findings.length === 0 ? (
             <div className="border border-brand-border bg-brand-surface/20 p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-status-optimal mb-4" />
                <span className="data-label text-zinc-300">Null Array</span>
                <p className="text-xs font-mono text-zinc-500 mt-2 max-w-sm">
                  System nominal. No active anomalies or proactive tasks discovered in the pipeline.
                </p>
             </div>
          ) : (
            <div className="flex flex-col gap-px bg-brand-border border border-brand-border">
              {findings.map((finding) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={finding.id} 
                  className="bg-brand-bg p-4 flex flex-col sm:flex-row gap-4 sm:items-start group hover:bg-brand-surface/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {finding.severity === 'high' ? (
                      <ShieldAlert className="w-5 h-5 text-status-error" />
                    ) : finding.severity === 'medium' ? (
                      <AlertTriangle className="w-5 h-5 text-status-warning" />
                    ) : (
                      <Zap className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 font-mono">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${
                        finding.severity === 'high' ? 'bg-status-error/10 text-status-error border border-status-error/20' : 
                        finding.severity === 'medium' ? 'bg-status-warning/10 text-status-warning border border-status-warning/20' : 
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        SEV_{finding.severity}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest border-l border-zinc-700 pl-2">
                        {finding.category || 'DIAGNOSTIC'}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-zinc-200 mb-1 break-words">{finding.title}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 break-words line-clamp-3">{finding.recommendation}</p>
                    
                    <div className="flex items-center gap-4">
                      <Link 
                        to={`/grows/${finding.growId}/plants/${finding.plantId}`}
                        className="text-[9px] uppercase tracking-widest text-status-optimal hover:text-emerald-400 transition-colors border border-status-optimal/30 bg-status-optimal/10 px-2 py-1"
                      >
                        [ LOAD SOURCE ]
                      </Link>
                      <button 
                        onClick={() => resolveFinding(finding.id)}
                        className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
                      >
                        [ RESOLVE ]
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 lg:border-l lg:border-brand-border lg:pl-6 max-h-full">
          <div className="border border-brand-border bg-brand-surface/20 p-6 flex flex-col gap-4 font-mono">
             <div className="flex items-center gap-2 border-b border-brand-border pb-2">
               <Target className="w-4 h-4 text-zinc-500" />
               <span className="data-label !text-zinc-300">Intel Pipeline (Ph.5)</span>
             </div>
             <p className="text-[10px] text-zinc-500 leading-relaxed">
               The Event Pipeline analyzes chronological media arrays to auto-generate tasks. As visual diagnostics find anomalies (deficiencies, pests, pathogens), they flow here for resolution.
             </p>
             <div className="bg-brand-bg border border-brand-border p-3 text-[9px] uppercase tracking-widest text-zinc-400 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-status-optimal/30 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <div className="flex justify-between border-b border-zinc-800 pb-1">
                  <span>Engine Status</span>
                  <span className="text-status-optimal">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue Size</span>
                  <span className="text-zinc-200">{findings.length}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
