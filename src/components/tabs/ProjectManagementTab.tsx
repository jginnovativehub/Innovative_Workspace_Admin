import React, { useState } from 'react';
import { 
  FolderKanban, Archive, RefreshCw, Trash2, ShieldAlert, 
  CheckCircle2, Search, Plus, Calendar, User as UserIcon, 
  TrendingUp, AlertTriangle, Layers, Edit2, X, Sparkles, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, User } from '../../types';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface ProjectManagementTabProps {
  projects: Project[];
  users?: User[];
  onProjectMutated: () => void;
}

export const ProjectManagementTab: React.FC<ProjectManagementTabProps> = ({ 
  projects = [], 
  users = [], 
  onProjectMutated 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Provision Project Modal (2-Step Planning Wizard)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newDeliverables, setNewDeliverables] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTargetDate, setNewTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [newOwnerId, setNewOwnerId] = useState<number | ''>('');
  const [newMemberIds, setNewMemberIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default 3 Milestone Schedule (Configurable)
  const getDefaultMilestones = (start?: string, target?: string) => {
    const sDate = start || new Date().toISOString().split('T')[0];
    const d1 = new Date(sDate);
    d1.setDate(d1.getDate() + 20);
    const d2 = new Date(sDate);
    d2.setDate(d2.getDate() + 50);
    const d3 = target || new Date(new Date(sDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        title: 'Phase 1: Specifications & Requirements',
        description: 'System specifications and architecture approval',
        sequence: 1,
        startDate: sDate,
        dueDate: d1.toISOString().split('T')[0],
        acceptanceCriteria: 'Formal design specification approved by Technical Lead.',
        xpReward: 300
      },
      {
        title: 'Phase 2: Core Engineering Build',
        description: 'Prototype implementation and engineering verification',
        sequence: 2,
        startDate: new Date(d1.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: d2.toISOString().split('T')[0],
        acceptanceCriteria: 'Passes bench test suite with zero Sev-1 defects.',
        xpReward: 350
      },
      {
        title: 'Phase 3: Integration & Handover',
        description: 'Customer sign-off and regulatory safety checklist completed.',
        sequence: 3,
        startDate: new Date(d2.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: d3,
        acceptanceCriteria: 'Customer sign-off and regulatory safety checklist completed.',
        xpReward: 400
      }
    ];
  };

  const [newMilestones, setNewMilestones] = useState(getDefaultMilestones());

  const handleAddMilestone = () => {
    const nextSeq = newMilestones.length + 1;
    setNewMilestones([
      ...newMilestones,
      {
        title: `Stage ${nextSeq}: Milestone Deliverable`,
        description: 'Describe deliverable requirements...',
        sequence: nextSeq,
        startDate: newStartDate,
        dueDate: newTargetDate,
        acceptanceCriteria: 'Specific acceptance gate criteria...',
        xpReward: 300
      }
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (newMilestones.length <= 1) {
      toast.warning('A project must have at least 1 milestone!', 'Milestone Requirement');
      return;
    }
    const updated = newMilestones.filter((_, i) => i !== index).map((m, i) => ({
      ...m,
      sequence: i + 1
    }));
    setNewMilestones(updated);
  };

  const handleMilestoneChange = (index: number, field: string, val: any) => {
    const updated = [...newMilestones];
    updated[index] = { ...updated[index], [field]: val };
    setNewMilestones(updated);
  };

  // Quick Schedule Milestones Modal for 0-milestone projects
  const [scheduleMilestonesProject, setScheduleMilestonesProject] = useState<Project | null>(null);
  const [isSchedulingMilestones, setIsSchedulingMilestones] = useState(false);

  const handleConfirmScheduleMilestones = async () => {
    if (!scheduleMilestonesProject) return;
    setIsSchedulingMilestones(true);
    try {
      const stages = getDefaultMilestones(scheduleMilestonesProject.startDate, scheduleMilestonesProject.targetDate);
      const defaultOwnerId = (scheduleMilestonesProject.members && scheduleMilestonesProject.members.length > 0)
        ? (scheduleMilestonesProject.members[0].userId || scheduleMilestonesProject.members[0].id || scheduleMilestonesProject.ownerId)
        : scheduleMilestonesProject.ownerId;
      for (const m of stages) {
        await adminApi.createMilestone(scheduleMilestonesProject.id, {
          title: m.title,
          description: m.description,
          sequence: m.sequence,
          startDate: m.startDate,
          dueDate: m.dueDate,
          acceptanceCriteria: m.acceptanceCriteria,
          xpReward: m.xpReward,
          ownerId: defaultOwnerId,
          reviewerId: scheduleMilestonesProject.ownerId
        });
      }
      confetti({ particleCount: 60, spread: 50 });
      toast.success(`Configured 3 milestone stages for ${scheduleMilestonesProject.name}!`, 'Milestones Scheduled');
      setScheduleMilestonesProject(null);
      onProjectMutated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule milestones', 'Scheduling Failed');
    } finally {
      setIsSchedulingMilestones(false);
    }
  };

  // Deletion Modal
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Project Modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editDeliverables, setEditDeliverables] = useState('');
  const [editOwnerId, setEditOwnerId] = useState<number | ''>('');
  const [editMemberIds, setEditMemberIds] = useState<number[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newObjective.trim()) {
      toast.warning('Please fill in project code, name, and objective.', 'Required Project Fields');
      setWizardStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createProject({
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        objective: newObjective.trim(),
        scope: newScope.trim(),
        deliverables: newDeliverables.trim(),
        priority: newPriority,
        startDate: newStartDate,
        targetDate: newTargetDate,
        ownerId: newOwnerId ? Number(newOwnerId) : undefined,
        memberIds: newMemberIds,
        milestones: newMilestones
      });
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setShowCreateModal(false);
      setWizardStep(1);
      setNewCode('');
      setNewName('');
      setNewObjective('');
      setNewScope('');
      setNewDeliverables('');
      setNewOwnerId('');
      setNewMemberIds([]);
      setNewMilestones(getDefaultMilestones());
      onProjectMutated();
      toast.success(`Project ${newName} provisioned with ${newMilestones.length} milestones!`, 'Project Created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to provision project', 'Creation Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: number | string) => {
    try {
      await adminApi.archiveProject(id);
      onProjectMutated();
      toast.success('Project archived successfully!', 'Project Archived');
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive project', 'Archive Failed');
    }
  };

  const handleRestore = async (id: number | string) => {
    try {
      await adminApi.restoreProject(id);
      onProjectMutated();
      toast.success('Project restored successfully!', 'Project Restored');
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore project', 'Restore Failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId || !deleteReason || deleteReason.trim().length < 5) {
      toast.warning('A documented justification of at least 5 characters is mandatory for permanent deletion.', 'Audit Requirement');
      return;
    }
    setIsDeleting(true);
    try {
      await adminApi.deleteProject(deleteTargetId, deleteReason);
      setDeleteTargetId(null);
      setDeleteReason('');
      onProjectMutated();
      toast.success('Project permanently deleted and recorded in the audit trail.', 'Project Purged');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project', 'Deletion Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = (p: Project) => {
    setEditingProject(p);
    setEditCode(p.code || '');
    setEditName(p.name || (p as any).title || '');
    setEditObjective(p.objective || (p as any).description || '');
    setEditPriority(p.priority || 'HIGH');
    setEditStatus(p.status || 'ACTIVE');
    setEditStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setEditTargetDate(p.targetDate ? p.targetDate.split('T')[0] : (p as any).targetEndDate ? (p as any).targetEndDate.split('T')[0] : '');
    setEditScope((p as any).scope || '');
    setEditDeliverables((p as any).deliverables || '');
    setEditOwnerId(p.ownerId !== undefined && p.ownerId !== null ? Number(p.ownerId) : '');
    setEditMemberIds(p.members ? p.members.map((m: any) => m.userId) : []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editCode.trim() || !editName.trim() || !editObjective.trim()) {
      toast.warning('Project code, title, and strategic objective are mandatory.', 'Validation Error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const id = editingProject.id ?? (editingProject as any)._id;
      await adminApi.updateProject(id, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim(),
        objective: editObjective.trim(),
        priority: editPriority,
        status: editStatus,
        startDate: editStartDate,
        targetDate: editTargetDate,
        scope: editScope,
        deliverables: editDeliverables,
        ownerId: editOwnerId !== '' ? Number(editOwnerId) : undefined,
        memberIds: editMemberIds
      });
      setEditingProject(null);
      onProjectMutated();
      toast.success(`Project ${editName} updated successfully!`, 'Project Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project', 'Update Error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Safe filtering - will never crash even if properties vary
  const filtered = (projects || []).filter(p => {
    if (!p) return false;
    const nameStr = (p.name || p.title || '').toLowerCase();
    const codeStr = (p.code || '').toLowerCase();
    const objStr = (p.objective || p.description || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = nameStr.includes(term) || codeStr.includes(term) || objStr.includes(term);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by code, name, objective..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400 hidden md:inline">
            Total Projects: <strong className="text-white">{projects.length}</strong>
          </span>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-sm text-slate-300">No Enterprise Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? `No projects match "${searchTerm}". Clear your search query.` : 'No projects exist in the database. Provision a project to get started.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors mt-2"
          >
            <Plus className="w-4 h-4 text-red-400" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => {
            const projectName = p.name || p.title || 'Untitled Project';
            const projectObjective = p.objective || p.description || 'No objective specified.';
            const projectTarget = p.targetDate || p.targetEndDate || 'Not set';
            const projectOwner = p.ownerName || p.leadName || 'Executive Leadership';
            const progress = p.progressPercentage ?? p.progressPercent ?? 0;
            const milestonesCount = p.milestonesCount ?? (p.milestones ? p.milestones.length : 0);
            const tasksCount = p.tasksCount ?? 0;

            return (
              <div 
                key={p.id ?? p._id ?? p.code} 
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                          {p.code}
                        </span>
                        {getPriorityBadge(p.priority)}
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1.5 leading-snug">
                        {projectName}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                      p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      p.status === 'ARCHIVED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {projectObjective}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Delivery Velocity</span>
                      <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{milestonesCount} Milestones</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tasksCount} Tasks</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lead: <strong className="text-slate-300 font-normal">{projectOwner}</strong></span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Target: <strong className="text-slate-300 font-normal">{projectTarget}</strong></span>
                  </span>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {milestonesCount === 0 && (
                      <button
                        onClick={() => setScheduleMilestonesProject(p)}
                        className="cursor-pointer flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                        title="Schedule default milestone stages for this initiative"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Add Milestones</span>
                      </button>
                    )}

                    {p.status === 'ARCHIVED' ? (
                      <button
                        onClick={() => handleRestore(p.id ?? p._id)}
                        className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(p.id ?? p._id)}
                        className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(p)}
                      className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteTargetId(p.id ?? p._id)}
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK SCHEDULE MILESTONES MODAL */}
      {scheduleMilestonesProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-400">
              <Layers className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Schedule Milestone Gates</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Initiative <strong className="text-white">{scheduleMilestonesProject.name}</strong> ({scheduleMilestonesProject.code}) currently has no milestones scheduled.
              This will automatically provision <strong>3 sequential phase milestones</strong> (Specifications, Engineering Build, Integration & Handover) with acceptance verification criteria for the assigned team.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Phase 1: Specifications & Requirements</span>
                <span className="text-emerald-400 font-mono">Stage 1</span>
              </div>
              <div className="flex justify-between">
                <span>Phase 2: Core Engineering Build</span>
                <span className="text-indigo-400 font-mono">Stage 2</span>
              </div>
              <div className="flex justify-between">
                <span>Phase 3: Integration & Handover</span>
                <span className="text-purple-400 font-mono">Stage 3</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setScheduleMilestonesProject(null)}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSchedulingMilestones}
                onClick={handleConfirmScheduleMilestones}
                className="cursor-pointer px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSchedulingMilestones ? 'Scheduling...' : 'Confirm & Schedule Milestones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVISION PROJECT MODAL: 2-STEP PLANNING WIZARD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Project Planning Wizard</h2>
                  <p className="text-xs text-slate-400">
                    Step {wizardStep} of 2: {wizardStep === 1 ? 'Project Definition & Team Assignment' : 'Configurable Milestones Builder'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setWizardStep(1);
                }} 
                className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {wizardStep === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Project Code *</label>
                      <input
                        type="text"
                        required
                        value={newCode}
                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                        placeholder="e.g. PRJ-AUT-04"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1">Project Title / Initiative Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Autonomous Robotic Guidance System"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Strategic Objective *</label>
                    <textarea
                      rows={2}
                      required
                      value={newObjective}
                      onChange={e => setNewObjective(e.target.value)}
                      placeholder="Primary business outcome, targets and technical purpose..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Scope</label>
                      <textarea
                        rows={2}
                        value={newScope}
                        onChange={e => setNewScope(e.target.value)}
                        placeholder="Included subsystems, architecture boundaries..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Expected Deliverables</label>
                      <textarea
                        rows={2}
                        value={newDeliverables}
                        onChange={e => setNewDeliverables(e.target.value)}
                        placeholder="Prototypes, schematics, test certificates..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Priority</label>
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-red-500 focus:outline-none cursor-pointer"
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={newStartDate}
                        onChange={e => setNewStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Target Completion Date</label>
                      <input
                        type="date"
                        required
                        value={newTargetDate}
                        onChange={e => setNewTargetDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {users.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Designated Initiative Lead / Owner
                        </label>
                        <select
                          value={newOwnerId}
                          onChange={e => setNewOwnerId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Executive Leadership (Self)</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} ({u.role} - {u.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Assign Contributor Team Members ({newMemberIds.length} Selected)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          {users.map(u => {
                            const isOwner = Number(newOwnerId) === u.id;
                            const isChecked = newMemberIds.includes(u.id) || isOwner;
                            return (
                              <label key={u.id} className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer p-1 rounded hover:bg-slate-900 select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isOwner}
                                  onChange={e => {
                                    if (e.target.checked) setNewMemberIds([...newMemberIds, u.id]);
                                    else setNewMemberIds(newMemberIds.filter(id => id !== u.id));
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-0 cursor-pointer"
                                />
                                <span className="font-medium truncate">{u.fullName}</span>
                                {isOwner && <span className="text-[10px] text-amber-400 font-bold ml-auto">(Lead)</span>}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-red-400" />
                        <span>Configurable Milestone Schedule ({newMilestones.length} Milestones)</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Add or remove any number of milestone gates (supports 3, 8, 12, or custom stages).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone Stage</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newMilestones.map((m, idx) => (
                      <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                            Stage {m.sequence}
                          </span>
                          {newMilestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="cursor-pointer text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors"
                              title="Remove stage"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Milestone Title *</label>
                            <input
                              type="text"
                              value={m.title}
                              onChange={e => handleMilestoneChange(idx, 'title', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Start Date</label>
                              <input
                                type="date"
                                value={m.startDate}
                                onChange={e => handleMilestoneChange(idx, 'startDate', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Due Date</label>
                              <input
                                type="date"
                                value={m.dueDate}
                                onChange={e => handleMilestoneChange(idx, 'dueDate', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                            Acceptance Criteria (Verification Gate Standard) *
                          </label>
                          <input
                            type="text"
                            value={m.acceptanceCriteria}
                            onChange={e => handleMilestoneChange(idx, 'acceptanceCriteria', e.target.value)}
                            placeholder="Criteria required for verification approval..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-between bg-slate-950/80">
              {wizardStep === 1 ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)} 
                    className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCode.trim() || !newName.trim() || !newObjective.trim()) {
                        toast.warning('Please fill in project code, name, and objective.', 'Required Project Fields');
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="cursor-pointer px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <span>Proceed to Milestones Builder</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => setWizardStep(1)} 
                    className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    ⬅ Back to Project Info
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateProject()}
                    className="cursor-pointer px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/25 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitting ? 'Provisioning...' : `Provision Initiative & Launch (${newMilestones.length} Milestones)`}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETION MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Permanent Deletion Authorization</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Permanent deletion will remove this project and all dependent milestones, tasks, and 
              delivery records directly from the database. A <strong>documented audit justification</strong> is required.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Documented Deletion Justification *
              </label>
              <textarea
                rows={3}
                required
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Specify regulatory, cancellation, or duplicate record rationale..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteReason.trim().length < 5}
                onClick={handleConfirmDelete}
                className="cursor-pointer disabled:cursor-not-allowed px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 text-left shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Edit Project Configuration</h3>
              </div>
              <button 
                onClick={() => setEditingProject(null)} 
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Strategic Objective *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editObjective}
                  onChange={e => setEditObjective(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={e => setEditTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scope Definition & Boundaries
                </label>
                <textarea
                  rows={2}
                  value={editScope}
                  onChange={e => setEditScope(e.target.value)}
                  placeholder="Outline key system components, architectural boundaries..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deliverables & Verification Criteria
                </label>
                <textarea
                  rows={2}
                  value={editDeliverables}
                  onChange={e => setEditDeliverables(e.target.value)}
                  placeholder="Mandatory acceptance artifacts..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {users.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Designated Initiative Lead / Owner
                    </label>
                    <select
                      value={editOwnerId}
                      onChange={e => setEditOwnerId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Executive Leadership</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role} - {u.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned Contributor Team Members ({editMemberIds.length} Selected)
                    </label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5">
                      {users.map(u => {
                        const isOwner = Number(editOwnerId) === u.id;
                        const isChecked = editMemberIds.includes(u.id) || isOwner;
                        return (
                          <label key={u.id} className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isOwner}
                              onChange={(e) => {
                                if (e.target.checked) setEditMemberIds(prev => [...prev, u.id]);
                                else setEditMemberIds(prev => prev.filter(id => id !== u.id));
                              }}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium">{u.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({u.role} - {u.department})</span>
                            {isOwner && <span className="text-[10px] text-amber-400 font-bold ml-auto">(Lead)</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="cursor-pointer disabled:cursor-not-allowed px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
