import React, { useState, useEffect, useMemo } from 'react';
import { User, PersonalProject, PersonalTask, PersonalMilestone, Milestone } from '../types';
import { adminApi } from '../api';
import { toast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { 
  Lock, Plus, Search, CheckCircle2, Calendar, 
  Trash2, Edit3, X, Save, CheckSquare,
  FileText, RefreshCw, Compass, Trophy, Sparkles, ChevronLeft, Layers
} from 'lucide-react';
import { ProjectExpeditionRoadmap } from './QuestMap';

interface PersonalProjectTrackerProps {
  currentUser: User;
}

export const PersonalProjectTracker: React.FC<PersonalProjectTrackerProps> = ({
  currentUser
}) => {
  const [projects, setProjects] = useState<PersonalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'CARDS' | 'QUEST_MAP'>('CARDS');
  const [selectedQuestProjectId, setSelectedQuestProjectId] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<PersonalProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<PersonalProject | null>(null);

  // Notes state
  const [expandedNotes, setExpandedNotes] = useState<Record<string | number, boolean>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<string | number, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | number | null>(null);

  // Inline quick additions
  const [quickTaskTitle, setQuickTaskTitle] = useState<Record<string | number, string>>({});
  const [quickTaskPriority, setQuickTaskPriority] = useState<Record<string | number, 'LOW' | 'MEDIUM' | 'HIGH'>>({});
  const [quickMilestoneTitle, setQuickMilestoneTitle] = useState<Record<string | number, string>>({});
  const [quickMilestoneDate, setQuickMilestoneDate] = useState<Record<string | number, string>>({});

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General Tasks');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [formStatus, setFormStatus] = useState<'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'>('IN_PROGRESS');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTargetDate, setFormTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CATEGORY_OPTIONS = [
    'General Tasks',
    'Admin Tools & Automation',
    'System Maintenance',
    'Security & Audit',
    'Learning & Research'
  ];

  const loadPersonalProjects = async () => {
    try {
      const data = await adminApi.getPersonalProjects();
      const normalizedData = (data || []).map((p, idx) => ({
        ...p,
        id: p.id !== undefined && p.id !== null ? p.id : ((p as any)._id || idx + 1)
      }));
      setProjects(normalizedData);
      const drafts: Record<string | number, string> = {};
      normalizedData.forEach(p => {
        drafts[p.id] = p.notes || '';
      });
      setNotesDrafts(drafts);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load projects', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPersonalProjects();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadPersonalProjects();
    toast.success('Projects updated', 'Refreshed');
  };

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormCategory('General Tasks');
    setFormDescription('');
    setFormPriority('MEDIUM');
    setFormStatus('IN_PROGRESS');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setFormTargetDate(d.toISOString().split('T')[0]);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.warning('Project title is required', 'Required Field');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createPersonalProject({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        status: formStatus,
        startDate: formStartDate,
        targetDate: formTargetDate,
        notes: '',
        milestones: [
          {
            id: Date.now().toString(),
            title: 'Initial Milestone',
            dueDate: formTargetDate,
            completed: false
          }
        ],
        tasks: [
          {
            id: (Date.now() + 1).toString(),
            title: 'First task',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: formStartDate
          }
        ]
      });

      confetti({ particleCount: 50, spread: 50 });
      toast.success('Project created', 'Success');
      setShowCreateModal(false);
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (p: PersonalProject) => {
    setProjectToEdit(p);
    setFormTitle(p.title);
    setFormDescription(p.description || '');
    setFormCategory(p.category || 'General Tasks');
    setFormPriority(p.priority || 'MEDIUM');
    setFormStatus(p.status || 'IN_PROGRESS');
    setFormStartDate(p.startDate || '');
    setFormTargetDate(p.targetDate || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToEdit) return;
    setIsSubmitting(true);
    try {
      await adminApi.updatePersonalProject(projectToEdit.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        status: formStatus,
        startDate: formStartDate,
        targetDate: formTargetDate
      });
      toast.success('Project updated', 'Saved');
      setProjectToEdit(null);
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await adminApi.deletePersonalProject(projectToDelete.id);
      toast.success('Project deleted', 'Deleted');
      setProjectToDelete(null);
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project', 'Error');
    }
  };

  // Milestone toggling
  const handleToggleMilestone = async (projectId: number, m: PersonalMilestone) => {
    try {
      await adminApi.updatePersonalMilestone(projectId, m.id, { completed: !m.completed });
      if (!m.completed) {
        confetti({ particleCount: 35, spread: 40 });
      }
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update milestone', 'Error');
    }
  };

  const handleAddMilestone = async (projectId: number | string) => {
    if (!projectId || String(projectId) === 'undefined' || String(projectId) === 'null') {
      toast.error('Project identifier is invalid. Please refresh.', 'Error');
      return;
    }
    const title = quickMilestoneTitle[projectId];
    if (!title || !title.trim()) return;

    try {
      await adminApi.addPersonalMilestone(projectId, {
        title: title.trim(),
        dueDate: quickMilestoneDate[projectId] || '',
        completed: false
      });
      setQuickMilestoneTitle(prev => ({ ...prev, [projectId]: '' }));
      setQuickMilestoneDate(prev => ({ ...prev, [projectId]: '' }));
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add milestone', 'Error');
    }
  };

  const handleDeleteMilestone = async (projectId: number, milestoneId: string | number) => {
    try {
      await adminApi.deletePersonalMilestone(projectId, milestoneId);
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete milestone', 'Error');
    }
  };

  // Task toggling
  const handleToggleTask = async (projectId: number, t: PersonalTask) => {
    const nextStatus = t.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await adminApi.updatePersonalTask(projectId, t.id, { status: nextStatus });
      if (nextStatus === 'DONE') {
        confetti({ particleCount: 25, spread: 35 });
      }
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task', 'Error');
    }
  };

  const handleAddTask = async (projectId: number | string) => {
    if (!projectId || String(projectId) === 'undefined' || String(projectId) === 'null') {
      toast.error('Project identifier is invalid. Please refresh.', 'Error');
      return;
    }
    const title = quickTaskTitle[projectId];
    if (!title || !title.trim()) return;

    try {
      await adminApi.addPersonalTask(projectId, {
        title: title.trim(),
        priority: quickTaskPriority[projectId] || 'MEDIUM',
        status: 'TODO'
      });
      setQuickTaskTitle(prev => ({ ...prev, [projectId]: '' }));
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add task', 'Error');
    }
  };

  const handleDeleteTask = async (projectId: number, taskId: string | number) => {
    try {
      await adminApi.deletePersonalTask(projectId, taskId);
      await loadPersonalProjects();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task', 'Error');
    }
  };

  // Notes save
  const handleSaveNotes = async (projectId: number) => {
    setSavingNotesId(projectId);
    try {
      await adminApi.updatePersonalProject(projectId, { notes: notesDrafts[projectId] || '' });
      toast.success('Notes saved', 'Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes', 'Error');
    } finally {
      setSavingNotesId(null);
    }
  };

  // Filtering
  const filteredProjects = projects.filter(p => {
    const term = searchTerm.toLowerCase();
    const titleMatch = (p.title || '').toLowerCase().includes(term) ||
                       (p.description || '').toLowerCase().includes(term) ||
                       (p.notes || '').toLowerCase().includes(term);
    const statusMatch = statusFilter === 'ALL' || p.status === statusFilter;
    const categoryMatch = categoryFilter === 'ALL' || p.category === categoryFilter;
    return titleMatch && statusMatch && categoryMatch;
  });

  // Metrics
  const totalProjects = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks ? p.tasks.length : 0), 0);
  const doneTasks = projects.reduce((acc, p) => acc + (p.tasks ? p.tasks.filter(t => t.status === 'DONE').length : 0), 0);

  const activeQuestProject = useMemo(() => {
    if (selectedQuestProjectId) {
      const found = projects.find(p => p.id === selectedQuestProjectId);
      if (found) return found;
    }
    return projects.length > 0 ? projects[0] : null;
  }, [projects, selectedQuestProjectId]);

  const adaptPersonalMilestones = (project: PersonalProject): Milestone[] => {
    if (!project.milestones || project.milestones.length === 0) return [];
    return project.milestones.map((m, idx) => ({
      id: typeof m.id === 'number' ? m.id : (parseInt(m.id as string, 10) || (idx + 1)),
      projectId: project.id,
      title: m.title,
      description: `Private milestone checkpoint for ${project.title}. Keep moving forward!`,
      sequence: idx + 1,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      status: m.completed ? 'APPROVED_COMPLETED' : 'IN_PROGRESS',
      startDate: project.startDate || '',
      dueDate: m.dueDate || project.targetDate || '',
      acceptanceCriteria: 'Complete all associated tasks and personal criteria for this checkpoint.',
      xpReward: 150,
      projectName: project.title,
      predecessorIds: idx > 0 ? [typeof project.milestones[idx - 1].id === 'number' ? (project.milestones[idx - 1].id as number) : idx] : [],
      tasks: []
    }));
  };

  const handleToggleMilestoneFromQuest = async (milestone: Milestone, project: PersonalProject) => {
    const matched = project.milestones?.find(
      (m, idx) => String(m.id) === String(milestone.id) || (idx + 1) === milestone.sequence || m.title === milestone.title
    );
    if (matched) {
      await handleToggleMilestone(project.id, matched);
    }
  };

  const currentStageId = useMemo(() => {
    if (!activeQuestProject?.milestones || activeQuestProject.milestones.length === 0) return null;
    const firstIncomplete = activeQuestProject.milestones.find(m => !m.completed);
    if (firstIncomplete) {
      return typeof firstIncomplete.id === 'number' ? firstIncomplete.id : (parseInt(firstIncomplete.id as string, 10) || 1);
    }
    const last = activeQuestProject.milestones[activeQuestProject.milestones.length - 1];
    return typeof last.id === 'number' ? last.id : (parseInt(last.id as string, 10) || activeQuestProject.milestones.length);
  }, [activeQuestProject]);

  const adaptedMilestones = useMemo(() => {
    if (!activeQuestProject) return [];
    return adaptPersonalMilestones(activeQuestProject);
  }, [activeQuestProject]);

  return (
    <div className="space-y-6 text-left">
      {/* Clean Top Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-500/20">
              <Lock className="w-3 h-3" />
              <span>Private</span>
            </span>
            <span className="text-xs text-gray-600">Only visible to you</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Personal Projects</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Track your private tasks, maintenance scripts, and personal notes.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewLayout('CARDS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewLayout === 'CARDS'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => {
                if (projects.length > 0 && !selectedQuestProjectId) {
                  setSelectedQuestProjectId(projects[0].id);
                }
                setViewLayout('QUEST_MAP');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewLayout === 'QUEST_MAP'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Quest Map</span>
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {viewLayout === 'QUEST_MAP' ? (
        <div className="space-y-4">
          {/* Quest Map Sub Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl text-left">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setViewLayout('CARDS')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Grid</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Expedition Project:</span>
                <select
                  value={activeQuestProject?.id || ''}
                  onChange={e => setSelectedQuestProjectId(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-cyan-400 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({(p.milestones || []).filter(m => m.completed).length}/{(p.milestones || []).length} Checkpoints)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeQuestProject && (
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    {(activeQuestProject.milestones || []).filter(m => m.completed).length * 150} XP Earned
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {(activeQuestProject.milestones || []).filter(m => m.completed).length}/{(activeQuestProject.milestones || []).length} Conquered
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quest Map Expedition Canvas or Empty State */}
          {!activeQuestProject || !activeQuestProject.milestones || activeQuestProject.milestones.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto space-y-4 my-8 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Compass className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {activeQuestProject ? 'No Milestones on this Expedition' : 'No Personal Projects Found'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeQuestProject 
                    ? `Add your first milestone checkpoint to initialize the winding S-curve expedition trail for "${activeQuestProject.title}".`
                    : 'Create a personal project first to view its expedition quest map.'}
                </p>
              </div>

              {activeQuestProject && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    placeholder="e.g. Stage 1: Initial Setup"
                    value={quickMilestoneTitle[activeQuestProject.id] || ''}
                    onChange={e => setQuickMilestoneTitle({ ...quickMilestoneTitle, [activeQuestProject.id]: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddMilestone(activeQuestProject.id); }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleAddMilestone(activeQuestProject.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0 cursor-pointer"
                  >
                    Add Stage
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ProjectExpeditionRoadmap
              stages={adaptedMilestones}
              currentStageId={currentStageId || undefined}
              currentUser={currentUser}
              projectName={activeQuestProject.title}
              projectCode="PERS"
              isPersonalProject={true}
              onToggleCheckpoint={(milestone) => handleToggleMilestoneFromQuest(milestone, activeQuestProject)}
            />
          )}
        </div>
      ) : (
        <>
          {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Total Projects</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalProjects}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">In Progress</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{inProgressCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Completed</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{completedCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Tasks Completed</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-gray-900">{doneTasks}</span>
            <span className="text-xs text-gray-600">/ {totalTasks}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-3 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PLANNING">Planning</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-gray-600" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-gray-900">
              {searchTerm ? 'No projects match your search' : 'No personal projects yet'}
            </h3>
            <p className="text-xs text-gray-600">
              {searchTerm 
                ? 'Try searching with a different keyword or reset filters.' 
                : 'Create your first personal project to organize your private tasks and notes.'}
            </p>
          </div>

          {!searchTerm && (
            <div className="pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map(p => {
          const progress = p.progressPercentage || 0;
          const isNotesExpanded = expandedNotes[p.id];
          const mList = p.milestones || [];
          const tList = p.tasks || [];

          return (
            <div 
              key={p.id}
              className="bg-white border border-gray-200 hover:border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                        {p.category || 'General'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700' :
                        p.priority === 'HIGH' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {p.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 mt-1">
                      {p.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedQuestProjectId(p.id);
                        setViewLayout('QUEST_MAP');
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors mr-1 cursor-pointer"
                      title="Open Expedition Quest Map"
                    >
                      <Compass className="w-3 h-3 text-emerald-600" />
                      <span>Quest Map</span>
                    </button>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border mr-1 ${
                      p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.status === 'IN_PROGRESS' ? 'bg-red-500/10 text-red-700 border-red-500/30' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(p)}
                      className="p-1 rounded text-gray-600 hover:text-rose-700 hover:bg-gray-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {p.description}
                  </p>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span>Start: {p.startDate || 'Not set'}</span>
                  <span>Due: {p.targetDate || 'Flexible'}</span>
                </div>

                {/* Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-800">{progress}%</span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className="h-full bg-red-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700 text-xs block">
                    Milestones ({mList.filter(m => m.completed).length}/{mList.length})
                  </span>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {mList.map(m => (
                      <div 
                        key={m.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg border ${
                          m.completed ? 'bg-white/40 border-gray-200 text-gray-600' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => handleToggleMilestone(p.id, m)}
                            className="rounded border-gray-200 bg-white text-red-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={m.completed ? 'line-through text-gray-900' : 'text-gray-800'}>
                            {m.title}
                          </span>
                        </label>

                        <div className="flex items-center space-x-2 shrink-0">
                          {m.dueDate && (
                            <span className="text-[10px] text-gray-600">{m.dueDate}</span>
                          )}
                          <button
                            onClick={() => handleDeleteMilestone(p.id, m.id)}
                            className="text-gray-600 hover:text-rose-700 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Milestone */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add milestone..."
                      value={quickMilestoneTitle[p.id] || ''}
                      onChange={e => setQuickMilestoneTitle({ ...quickMilestoneTitle, [p.id]: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddMilestone(p.id); }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddMilestone(p.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700 text-xs block">
                    Tasks ({tList.filter(t => t.status === 'DONE').length}/{tList.length})
                  </span>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {tList.map(t => (
                      <div 
                        key={t.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg border ${
                          t.status === 'DONE' ? 'bg-white/40 border-gray-200 text-gray-900' : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={t.status === 'DONE'}
                            onChange={() => handleToggleTask(p.id, t)}
                            className="rounded border-gray-200 bg-white text-red-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={t.status === 'DONE' ? 'line-through text-gray-900' : 'text-gray-800'}>
                            {t.title}
                          </span>
                        </label>

                        <div className="flex items-center space-x-2 shrink-0">
                          {t.priority && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-gray-50 text-gray-600">
                              {t.priority}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteTask(p.id, t.id)}
                            className="text-gray-600 hover:text-rose-700 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Task */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a task..."
                      value={quickTaskTitle[p.id] || ''}
                      onChange={e => setQuickTaskTitle({ ...quickTaskTitle, [p.id]: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddTask(p.id); }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none"
                    />
                    <select
                      value={quickTaskPriority[p.id] || 'MEDIUM'}
                      onChange={e => setQuickTaskPriority({ ...quickTaskPriority, [p.id]: e.target.value as any })}
                      className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none cursor-pointer shrink-0"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Med</option>
                      <option value="HIGH">High</option>
                    </select>
                    <button
                      onClick={() => handleAddTask(p.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-700 text-xs">Private Notes</span>
                    <button
                      onClick={() => setExpandedNotes({ ...expandedNotes, [p.id]: !isNotesExpanded })}
                      className="text-xs text-red-700 hover:text-red-700"
                    >
                      {isNotesExpanded ? 'Collapse' : (notesDrafts[p.id] ? 'View / Edit' : 'Add Notes')}
                    </button>
                  </div>

                  {isNotesExpanded && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={3}
                        value={notesDrafts[p.id] !== undefined ? notesDrafts[p.id] : (p.notes || '')}
                        onChange={e => setNotesDrafts({ ...notesDrafts, [p.id]: e.target.value })}
                        placeholder="Write down any notes, links, or thoughts..."
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSaveNotes(p.id)}
                          disabled={savingNotesId === p.id}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 transition-colors disabled:opacity-50"
                        >
                          {savingNotesId === p.id ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 text-left shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">New Personal Project</h3>
                <p className="text-xs text-gray-900">Only you can view and edit this project.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Infrastructure Maintenance or Tooling Spike"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief summary or objective..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={e => setFormTargetDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-900 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {projectToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 text-left shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Edit Project</h3>
                <p className="text-xs text-gray-600">Update project details and status.</p>
              </div>
              <button
                onClick={() => setProjectToEdit(null)}
                className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={e => setFormTargetDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setProjectToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-900 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 text-left shadow-xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">Delete Project</h3>
            <p className="text-xs text-gray-700">
              Are you sure you want to delete <strong className="text-gray-900">'{projectToDelete.title}'</strong>? This cannot be undone.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


