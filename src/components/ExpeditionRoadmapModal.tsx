import React from 'react';
import { Project, User, Milestone } from '../types';
import { ProjectExpeditionRoadmap } from './QuestMap';
import { X, Compass } from 'lucide-react';

interface ExpeditionRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  currentUser: User;
  onSubmitForReview?: (m: Milestone) => void;
  onReviewMilestone?: (m: Milestone) => void;
}

export const ExpeditionRoadmapModal: React.FC<ExpeditionRoadmapModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  onSubmitForReview,
  onReviewMilestone
}) => {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-6 flex items-start justify-center scroll-smooth">
      <div className="relative w-full max-w-6xl my-6 bg-[#0b0f19] border border-cyan-500/50 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col">
        {/* Sticky Modal Top Bar with Project Identity & Clean Close Button */}
        <div className="sticky top-0 z-50 px-6 py-4 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between rounded-t-3xl shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {project.code}
                </span>
                <span className="text-sm font-bold text-white truncate max-w-lg">
                  {project.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive Stage-Gate Expedition Roadmap • Full Leadership Command View
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md text-xs font-bold shrink-0"
            title="Close Expedition Roadmap"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Full Roadmap */}
        <div className="p-3 sm:p-6">
          <ProjectExpeditionRoadmap
            stages={project.milestones || []}
            milestones={project.milestones || []}
            projectCode={project.code}
            projectName={project.name}
            currentUser={currentUser}
            isLeader={true}
            onSubmitForReview={onSubmitForReview}
            onReviewMilestone={onReviewMilestone}
          />
        </div>
      </div>
    </div>
  );
};
