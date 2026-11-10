import React, { useState } from 'react';
import { 
  FileSearch, Search, Filter, ShieldCheck, Clock, User as UserIcon, 
  Trash2, CheckSquare, Square, AlertTriangle, X, Check, RefreshCw
} from 'lucide-react';
import { AuditEvent } from '../../types';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface AuditLogTabProps {
  auditEvents: AuditEvent[];
  onAuditEventsChanged?: () => void;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditEvents, onAuditEventsChanged }) => {
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  // Selection mode for deleting audits
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  
  // Deletion modals state
  const [singleToDelete, setSingleToDelete] = useState<AuditEvent | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered list
  const filtered = auditEvents.filter(a => {
    const matchesActor = !actorFilter || (a.actorName && a.actorName.toLowerCase().includes(actorFilter.toLowerCase()));
    const matchesAction = !actionFilter || a.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesActor && matchesAction;
  });

  // Toggle selection for a single audit event
  const toggleSelect = (id: number | string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all visible
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  // Cancel selection mode
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Execute single deletion
  const handleConfirmSingleDelete = async () => {
    if (!singleToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteAuditEvent(singleToDelete.id);
      toast.success(`Audit record #${singleToDelete.id} (${singleToDelete.action}) deleted successfully`, 'Audit Record Deleted');
      setSingleToDelete(null);
      if (onAuditEventsChanged) {
        onAuditEventsChanged();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete audit record', 'Deletion Error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute bulk deletion
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await adminApi.bulkDeleteAuditEvents(idsArray);
      toast.success(`${res.deletedCount || idsArray.length} audit records deleted permanently`, 'Audit Records Removed');
      setShowBulkDeleteModal(false);
      exitSelectionMode();
      if (onAuditEventsChanged) {
        onAuditEventsChanged();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk delete audit records', 'Deletion Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="space-y-5 text-left">
      {/* -------------------------------------------------------------------
          TOP ACTION & FILTER BAR
      ------------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search by Actor */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Actor..."
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Search by Action */}
          <div className="relative w-full sm:w-56">
            <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Action..."
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Event Count Badge */}
          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Showing <strong className="text-gray-900">{filtered.length}</strong> of {auditEvents.length} Events
          </span>
        </div>

        {/* Delete Mode Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isSelectionMode ? (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-xs"
              title="Enter deletion mode to choose and delete audit records"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Delete Audits</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-red-50/80 border border-red-200 p-1.5 rounded-xl">
              <span className="text-xs font-bold text-red-900 px-2 font-mono">
                {selectedIds.size} Selected
              </span>

              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 text-xs font-bold bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>

              <button
                disabled={selectedIds.size === 0}
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>

              <button
                onClick={exitSelectionMode}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white transition-colors cursor-pointer"
                title="Cancel selection mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------
          SELECTION MODE NOTICE BANNER
      ------------------------------------------------------------------- */}
      {isSelectionMode && (
        <div className="bg-red-50/90 border border-red-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-red-800 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Audit Deletion Mode Active:</strong> Choose which audit records you want to delete by checking the boxes, or click the red trash icon on any row to delete individually.
            </span>
          </div>
          <button
            onClick={exitSelectionMode}
            className="text-xs font-bold text-red-700 hover:underline ml-4 shrink-0 cursor-pointer"
          >
            Done / Exit Mode
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------
          AUDIT LOG TABLE
      ------------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600 border-b border-gray-200">
              <tr>
                {isSelectionMode && (
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-gray-600 hover:text-red-600 transition-colors flex items-center justify-center"
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-red-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Change Details / Audit Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSelectionMode ? 7 : 6} className="py-10 text-center text-gray-500">
                    <FileSearch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No audit records match the current filter</p>
                    <p className="text-xs text-gray-500 mt-1">Try clearing your actor or action filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(ev => {
                  const isSelected = selectedIds.has(ev.id);

                  return (
                    <tr 
                      key={ev.id} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-red-50/50 hover:bg-red-50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleSelect(ev.id)}
                            className="cursor-pointer text-gray-500 hover:text-red-600 transition-colors flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-red-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString()}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {ev.actorName || (ev.actorId ? `User #${ev.actorId}` : 'System')}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-700 border border-red-500/30">
                          {ev.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {ev.entityType} #{ev.entityId}
                      </td>

                      {/* Change Details */}
                      <td className="py-3 px-4 text-xs">
                        {ev.afterSummary && (
                          <p className="text-gray-800">
                            <strong>Result:</strong> {ev.afterSummary}
                          </p>
                        )}
                        {ev.reason && (
                          <p className="text-gray-600 text-[11px] italic mt-0.5">
                            Justification: "{ev.reason}"
                          </p>
                        )}
                      </td>

                      {/* Row Action (Individual Delete) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSingleToDelete(ev)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          title={`Delete audit record #${ev.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          MODAL 1: CONFIRM SINGLE AUDIT RECORD DELETION
      ------------------------------------------------------------------- */}
      {singleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Delete Audit Record</h3>
                <p className="text-xs text-gray-500">Record ID #{singleToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Are you sure you want to delete the audit record for{' '}
              <strong className="text-gray-900 font-mono">[{singleToDelete.action}]</strong> executed by{' '}
              <strong className="text-gray-900">{singleToDelete.actorName || 'System'}</strong> on{' '}
              {new Date(singleToDelete.timestamp).toLocaleDateString()}?
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
              <span className="text-gray-500 font-semibold block text-[10px] uppercase tracking-wider">
                Target Entity: {singleToDelete.entityType} #{singleToDelete.entityId}
              </span>
              {singleToDelete.afterSummary && (
                <p className="text-gray-800 text-[11px] font-mono truncate">
                  {singleToDelete.afterSummary}
                </p>
              )}
            </div>

            <p className="text-[11px] text-red-600 italic">
              Warning: This audit record will be permanently deleted from the database.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                disabled={isDeleting}
                onClick={() => setSingleToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmSingleDelete}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODAL 2: CONFIRM BULK AUDIT RECORDS DELETION
      ------------------------------------------------------------------- */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Delete Selected Audit Records</h3>
                <p className="text-xs text-gray-500">Permanent Bulk Removal</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              You have selected <strong className="text-red-700 font-bold">{selectedIds.size} audit record(s)</strong> for deletion.
              Are you sure you want to permanently remove all selected items?
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Irreversible Administrative Action</span>
              </div>
              <p className="text-[11px] text-red-700">
                These {selectedIds.size} records will be permanently purged from the audit trail and local/Atlas storage.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmBulkDelete}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting {selectedIds.size} records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All {selectedIds.size} Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
