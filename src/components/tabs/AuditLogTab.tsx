import React, { useState } from 'react';
import { FileSearch, Search, Filter, ShieldCheck, Clock, User as UserIcon } from 'lucide-react';
import { AuditEvent } from '../../types';

interface AuditLogTabProps {
  auditEvents: AuditEvent[];
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditEvents }) => {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = auditEvents.filter(a => {
    const matchesActor = !actorFilter || (a.actorName && a.actorName.toLowerCase().includes(actorFilter.toLowerCase()));
    const matchesAction = !actionFilter || a.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesActor && matchesAction;
  });

  return (
    <div className="space-y-5 text-left">
      {/* Filter Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Actor name..."
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="relative w-full max-w-xs">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Action (e.g. USER_CREATED, PROJECT)..."
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing <strong className="text-white">{filtered.length}</strong> of {auditEvents.length} Recorded Events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Change Details / Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 shrink-0">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {ev.actorName || (ev.actorId ? `User #${ev.actorId}` : 'System')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                      {ev.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {ev.entityType} #{ev.entityId}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {ev.afterSummary && (
                      <p className="text-slate-200">
                        <strong>Result:</strong> {ev.afterSummary}
                      </p>
                    )}
                    {ev.reason && (
                      <p className="text-slate-400 text-[11px] italic mt-0.5">
                        Justification: "{ev.reason}"
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

