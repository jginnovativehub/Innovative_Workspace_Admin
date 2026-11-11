import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Milestone, User } from '../types';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, Sparkles, 
  ExternalLink, User as UserIcon, Calendar, ArrowRight,
  Send, Check, X, ShieldCheck, Lock, Star, Trophy, Flame, 
  Compass, ChevronRight, Layers, Eye, RefreshCw, Radio, 
  Award, FileText, CheckSquare, Zap, Target, Flag, Crown
} from 'lucide-react';

export interface ProjectExpeditionRoadmapProps {
  stages?: Milestone[];
  milestones?: Milestone[];
  currentStageId?: number | string;
  currentUser: User;
  projectCode?: string;
  projectName?: string;
  onSelectMilestone?: (m: Milestone) => void;
  onSubmitForReview?: (m: Milestone) => void;
  onReviewMilestone?: (m: Milestone) => void;
  onToggleCheckpoint?: (m: Milestone) => void;
  isLeader?: boolean;
  isPersonalProject?: boolean;
}

interface NodeCoordinate {
  index: number;
  stage: Milestone;
  x: number;
  y: number;
  cardSide: 'left' | 'right';
}

export const ProjectExpeditionRoadmap: React.FC<ProjectExpeditionRoadmapProps> = ({
  stages: propStages,
  milestones: propMilestones,
  currentStageId,
  currentUser,
  projectCode = 'PRJ-EXPEDITION',
  projectName = 'Enterprise Hardware/Software Expedition',
  onSelectMilestone,
  onSubmitForReview,
  onReviewMilestone,
  onToggleCheckpoint,
  isLeader = false,
  isPersonalProject = false
}) => {
  // Normalize stages from either stages or milestones prop
  const stages = propStages || propMilestones || [];

  // Ref for vertical scroll container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement>(null);

  // Identify active stage
  const activeStageIndex = useMemo(() => {
    if (stages.length === 0) return 0;
    if (currentStageId) {
      const idx = stages.findIndex(s => String(s.id) === String(currentStageId));
      if (idx !== -1) return idx;
    }
    // Look for IN_PROGRESS, CHANGES_REQUESTED, or SUBMITTED_FOR_REVIEW
    const inProgressIdx = stages.findIndex(s => 
      s.status === 'IN_PROGRESS' || 
      s.status === 'CHANGES_REQUESTED' || 
      s.status === 'SUBMITTED_FOR_REVIEW'
    );
    if (inProgressIdx !== -1) return inProgressIdx;

    // Otherwise first non-completed
    const notCompletedIdx = stages.findIndex(s => s.status !== 'APPROVED_COMPLETED');
    if (notCompletedIdx !== -1) return notCompletedIdx;

    // Default to last
    return stages.length - 1;
  }, [stages, currentStageId]);

  const activeStage = stages[activeStageIndex] || stages[0];
  const [selectedStage, setSelectedStage] = useState<Milestone | null>(activeStage || null);
  const [viewMode, setViewMode] = useState<'MAP' | 'DOSSIER'>('MAP');

  // Compute Candy Crush-style vertical winding S-curve road coordinates
  const { coords, totalHeight } = useMemo(() => {
    const startY = 140;
    const stepY = 175; // Vertical distance between levels
    const centerX = 300; // Centerline in 600px viewBox
    const amplitude = 125; // Lateral swing of the winding road

    const coordinates: NodeCoordinate[] = stages.map((stage, i) => {
      const y = startY + i * stepY;
      
      // Serpentine oscillation: Center -> Right -> Center -> Left -> Center -> Right...
      let x = centerX;
      const mod = i % 4;
      if (mod === 1) x = centerX + amplitude;      // Swing Right
      else if (mod === 3) x = centerX - amplitude; // Swing Left
      else x = centerX;                            // Center spine

      // Place descriptive mission card on the opposite side of the curve
      const cardSide: 'left' | 'right' = x <= centerX ? 'right' : 'left';

      return {
        index: i,
        stage,
        x,
        y,
        cardSide
      };
    });

    const computedHeight = startY + stages.length * stepY + 120;

    return {
      coords: coordinates,
      totalHeight: Math.max(computedHeight, 600)
    };
  }, [stages]);

  const activeCoord = coords[activeStageIndex];

  // Explicit user-triggered focus on active stage (never hijack scroll automatically)
  const handleFocusActiveStage = () => {
    if (activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Construct Vertical S-Curve Path segments
  const pathSegments = useMemo(() => {
    const segments: { d: string; type: 'completed' | 'active' | 'upcoming'; fromIndex: number }[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];

      const dy = next.y - curr.y;
      // Smooth vertical cubic bezier curve with vertical entry & exit tangents
      const d = `M ${curr.x},${curr.y} C ${curr.x},${curr.y + dy * 0.5} ${next.x},${next.y - dy * 0.5} ${next.x},${next.y}`;

      let type: 'completed' | 'active' | 'upcoming' = 'upcoming';
      if (i < activeStageIndex) {
        type = 'completed';
      } else if (i === activeStageIndex) {
        type = 'active';
      } else {
        type = 'upcoming';
      }

      segments.push({ d, type, fromIndex: i });
    }

    return segments;
  }, [coords, activeStageIndex]);

  // Stats calculation
  const completedCount = stages.filter(s => s.status === 'APPROVED_COMPLETED').length;
  const progressPercent = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;
  const totalBounty = stages.reduce((acc, s) => acc + (s.xpReward || 0), 0);
  const unlockedBounty = stages
    .filter(s => s.status === 'APPROVED_COMPLETED')
    .reduce((acc, s) => acc + (s.xpReward || 0), 0);

  const inspectedStage = selectedStage || activeStage || stages[0];

  const handleNodeClick = (st: Milestone) => {
    setSelectedStage(st);
    if (onSelectMilestone) onSelectMilestone(st);
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 text-slate-100 rounded-3xl p-5 sm:p-7 shadow-2xl relative backdrop-blur-xl">
      {/* Background Mission Control Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ---------------------------------------------------------------------
          MISSION CONTROL HUD TOP HEADER
      --------------------------------------------------------------------- */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                {projectCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isPersonalProject ? 'Personal Quest Map' : 'Expedition Quest Map'}
              </span>
              {isPersonalProject ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Initiative</span>
                </span>
              ) : (isLeader || Number(activeStage?.ownerId) === Number(currentUser.id)) ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Initiative Command Authority</span>
                </span>
              ) : null}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>{projectName}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {isPersonalProject 
                ? 'Personal milestone expedition trail. Scroll down with your mouse wheel to conquer your self-directed checkpoints.'
                : 'Candy Crush-style vertical winding roadmap. Scroll down naturally with your mouse wheel to conquer milestone checkpoints.'}
            </p>
          </div>
        </div>

        {/* Telemetry Stats & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Progress Gauge Pill */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 flex items-center space-x-4 shadow-inner">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Expedition Progress
              </div>
              <div className="text-lg font-black text-white font-mono flex items-center space-x-1.5">
                <span className="text-emerald-400">{completedCount}</span>
                <span className="text-slate-600">/</span>
                <span>{stages.length} Stages</span>
                <span className="text-xs text-cyan-400 font-bold ml-1">({progressPercent}%)</span>
              </div>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* XP Bounty Pillar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 flex items-center space-x-3 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                XP Bounty Unlocked
              </div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {unlockedBounty.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {totalBounty.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Winding Road</span>
            </button>
            <button
              onClick={() => setViewMode('DOSSIER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'DOSSIER'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dossier Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          VIEW MODE 1: VERTICAL CANDY CRUSH-STYLE WINDING EXPEDITION ROAD
          Naturally scrollable with the mouse wheel (Zero horizontal scroll!)
      --------------------------------------------------------------------- */}
      {viewMode === 'MAP' && (
        <div className="relative z-10 py-6 overflow-x-hidden">
          {/* Mouse Wheel Traversal Hint & Optional Focus Action */}
          <div className="flex items-center justify-center gap-3 pb-4 flex-wrap">
            <span className="flex items-center space-x-2 text-cyan-400 font-mono text-xs bg-slate-900/90 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Scroll freely with your mouse wheel to traverse the expedition road</span>
            </span>
            {activeCoord && (
              <button
                type="button"
                onClick={handleFocusActiveStage}
                className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-400/50 transition-all cursor-pointer shadow-xs"
                title="Center viewport on active stage"
              >
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Jump to Stage {activeCoord.index + 1}</span>
              </button>
            )}
          </div>

          {/* Centralized Vertical Road Stage Container */}
          <div 
            ref={mapContainerRef}
            className="relative mx-auto max-w-2xl w-full" 
            style={{ height: `${totalHeight}px` }}
          >
            {/* SVG Winding Road Track Layer */}
            <svg 
              viewBox={`0 0 600 ${totalHeight}`} 
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
            >
              <defs>
                {/* Emerald Road Gradient */}
                <linearGradient id="emeraldRoad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                {/* Cyan Active Gradient */}
                <linearGradient id="cyanRoad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                {/* Road Glow Filter */}
                <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Outer Wide Road Base (The winding terrain path) */}
              {pathSegments.map((seg, idx) => (
                <g key={`road-base-${idx}`}>
                  {/* Road Shadow */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="#020617"
                    strokeWidth="68"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {/* Road Surface Border Rails */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="56"
                    strokeLinecap="round"
                  />
                  {/* Road Bed Fill */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="48"
                    strokeLinecap="round"
                  />
                  {/* Center Lane Dashes */}
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                    strokeDasharray="8 14"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </g>
              ))}

              {/* 2. Completed Trail Segments (Solid Glowing Emerald Road Core) */}
              {pathSegments
                .filter(seg => seg.type === 'completed')
                .map((seg, idx) => (
                  <g key={`completed-${idx}`}>
                    {/* Emerald Neon Glow Halo */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="24"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                      filter="url(#roadGlow)"
                    />
                    {/* Solid Emerald Line */}
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="url(#emeraldRoad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                  </g>
                ))}

              {/* 3. Active Trail Segment (Marching Cyan Energy Beam) */}
              {pathSegments
                .filter(seg => seg.type === 'active')
                .map((seg, idx) => (
                  <g key={`active-${idx}`}>
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="26"
                      strokeOpacity="0.3"
                      strokeLinecap="round"
                      filter="url(#roadGlow)"
                    />
                    <path
                      d={seg.d}
                      fill="none"
                      stroke="url(#cyanRoad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="14 10"
                      className="animate-dash-march"
                    />
                  </g>
                ))}
            </svg>

            {/* Top Gateway: Expedition Basecamp Flag */}
            <div 
              style={{ left: '50%', top: '40px' }} 
              className="absolute -translate-x-1/2 flex items-center space-x-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-slate-300 shadow-md"
            >
              <Flag className="w-4 h-4 text-cyan-400" />
              <span>EXPEDITION BASECAMP • START</span>
            </div>

            {/* ---------------------------------------------------------------
                CANDY CRUSH 3D MEDALLIONS & DESCRIPTIVE MISSION CARDS
            --------------------------------------------------------------- */}
            {coords.map((coord, idx) => {
              const st = coord.stage;
              const isCompleted = st.status === 'APPROVED_COMPLETED';
              const isActive = idx === activeStageIndex;
              const isSelected = inspectedStage?.id === st.id;

              return (
                <div
                  key={st.id}
                  ref={isActive ? activeNodeRef : null}
                  style={{
                    left: `${(coord.x / 600) * 100}%`,
                    top: `${(coord.y / totalHeight) * 100}%`
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center"
                >
                  {/* -----------------------------------------------------------
                      THE 3D CANDY CRUSH LEVEL MEDALLION
                  ----------------------------------------------------------- */}
                  <div
                    onClick={() => handleNodeClick(st)}
                    className={`relative cursor-pointer transition-all duration-300 group ${
                      isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* STATE 1: COMPLETED STAGE MEDALLION */}
                    {isCompleted && (
                      <div className="relative flex flex-col items-center">
                        {/* 3D Emerald Golden Medallion */}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 border-4 border-emerald-200 shadow-[0_8px_0_#065f46,0_16px_25px_rgba(16,185,129,0.5)] flex items-center justify-center relative overflow-hidden transition-all ${
                          isSelected ? 'ring-4 ring-emerald-300' : ''
                        }`}>
                          {/* Top glossy shine highlight */}
                          <div className="absolute top-1 left-2 right-2 h-4 bg-white/40 rounded-full blur-[0.5px]" />
                          <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                        </div>

                        {/* 3 Golden Stars underneath the medallion (Candy Crush Star Tier) */}
                        <div className="absolute -bottom-3 flex items-center space-x-0.5 bg-slate-950/95 border border-amber-400 px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                    )}

                    {/* STATE 2: ACTIVE STAGE MEDALLION (Energetic Cyber 3D Orb) */}
                    {isActive && (
                      <div className="relative flex flex-col items-center">
                        {/* Radar Pulse / Ripple Rings */}
                        <span className="absolute -inset-4 rounded-full bg-cyan-400/30 animate-radar pointer-events-none" />
                        <span className="absolute -inset-2 rounded-full border-2 border-cyan-300 animate-pulse pointer-events-none" />

                        {/* 3D Cyan Level Button */}
                        <div className={`w-18 h-18 rounded-full bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-700 border-4 border-cyan-100 shadow-[0_8px_0_#0369a1,0_18px_35px_rgba(6,182,212,0.8)] flex items-center justify-center relative overflow-hidden transition-all ${
                          isSelected ? 'ring-4 ring-cyan-200' : ''
                        }`}>
                          {/* Top glossy shine highlight */}
                          <div className="absolute top-1.5 left-2.5 right-2.5 h-5 bg-white/50 rounded-full blur-[0.5px]" />
                          <span className="text-2xl font-black text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            {st.sequence}
                          </span>
                        </div>

                        {/* Active Indicator Tag */}
                        <div className="absolute -bottom-3 flex items-center space-x-1 bg-cyan-950/95 border border-cyan-300 px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                          <span className="text-[10px] font-black text-cyan-200 tracking-wider">ACTIVE</span>
                        </div>
                      </div>
                    )}

                    {/* STATE 3: UPCOMING / LOCKED MEDALLION */}
                    {!isCompleted && !isActive && (
                      <div className="relative flex flex-col items-center">
                        {/* 3D Dark Titanium / Stone Medallion */}
                        <div className={`w-15 h-15 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-4 border-slate-600 shadow-[0_6px_0_#1e293b] flex items-center justify-center relative transition-all ${
                          isSelected ? 'ring-2 ring-indigo-400 border-indigo-400' : 'group-hover:border-slate-500'
                        }`}>
                          {st.status === 'SUBMITTED_FOR_REVIEW' ? (
                            <ShieldCheck className="w-6 h-6 text-amber-400 animate-pulse" />
                          ) : st.status === 'BLOCKED' ? (
                            <ShieldAlert className="w-6 h-6 text-rose-400" />
                          ) : st.status === 'CHANGES_REQUESTED' ? (
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                          ) : (
                            <Lock className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {/* Stage Sequence Pill */}
                        <div className="absolute -bottom-2.5 px-2 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                          {st.sequence}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* -----------------------------------------------------------
                      DESCRIPTIVE MISSION CARD (Positioned on the open side of the road)
                  ----------------------------------------------------------- */}
                  <div
                    onClick={() => handleNodeClick(st)}
                    className={`absolute z-10 w-52 sm:w-60 p-3 rounded-2xl border transition-all cursor-pointer backdrop-blur-md shadow-lg ${
                      coord.cardSide === 'right' 
                        ? 'left-24 sm:left-28 text-left' 
                        : 'right-24 sm:right-28 text-right'
                    } ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-102'
                        : isCompleted
                        ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-300'
                        : isActive
                        ? 'bg-slate-950/95 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 ${coord.cardSide === 'right' ? 'justify-start' : 'justify-end'}`}>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
                          Stage {st.sequence}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          isActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {st.status === 'APPROVED_COMPLETED' ? 'Conquered' : st.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                        {st.title}
                      </h4>

                      <div className={`flex items-center gap-2 pt-1 text-[11px] font-mono ${coord.cardSide === 'right' ? 'justify-start' : 'justify-end'}`}>
                        <span className="text-amber-400 font-bold flex items-center space-x-1">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          <span>+{st.xpReward || 300} XP</span>
                        </span>
                        <span className="text-slate-500">
                          Due: {st.dueDate || 'Friday'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* -----------------------------------------------------------------
                ACTIVE MEMBER MASCOT / PIN MARKER (Candy Crush Teardrop Avatar)
                Anchored directly above the active stage medallion
            ----------------------------------------------------------------- */}
            {activeCoord && activeStage && (
              <div
                style={{
                  left: `${(activeCoord.x / 600) * 100}%`,
                  top: `${(activeCoord.y / totalHeight) * 100}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-full mb-10 z-40 pointer-events-auto animate-float flex flex-col items-center"
                onClick={() => handleNodeClick(activeStage)}
              >
                {/* Holographic Mission Board (Placard) */}
                <div className="bg-slate-950/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] rounded-2xl p-3 min-w-[240px] max-w-[280px] backdrop-blur-xl relative group cursor-pointer hover:border-cyan-300 transition-all text-center">
                  <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/40">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-[9px] flex items-center justify-center">
                        {activeStage.ownerName ? activeStage.ownerName.split(' ').map(n => n[0]).join('') : 'EM'}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
                        Current Mission: Stage {activeStage.sequence}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>

                  <h5 className="text-xs font-black text-white line-clamp-1 pt-1.5">
                    {activeStage.title}
                  </h5>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono">
                    <span className="text-amber-400 font-bold">+{activeStage.xpReward || 300} XP Bounty</span>
                    <span className="text-cyan-300 font-semibold">{activeStage.status === 'SUBMITTED_FOR_REVIEW' ? 'Review Gate' : `Due: ${activeStage.dueDate || 'Friday'}`}</span>
                  </div>
                </div>

                {/* Candy Crush Teardrop Avatar Pin pointing down */}
                <div className="w-10 h-10 -mt-1 flex items-center justify-center relative">
                  <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]">
                    <circle cx="20" cy="18" r="11" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
                    <path d="M 13 17 Q 20 21 27 17 Q 20 14 13 17" fill="#06b6d4" opacity="0.95" />
                    <line x1="20" y1="7" x2="20" y2="2" stroke="#06b6d4" strokeWidth="2" />
                    <circle cx="20" cy="2" r="1.5" fill="#38bdf8" />
                    <path d="M 16 28 L 24 28 L 20 36 Z" fill="#06b6d4" />
                  </svg>
                </div>
              </div>
            )}

            {/* Bottom Gateway: Expedition Summit Trophy */}
            <div 
              style={{ left: '50%', top: `${totalHeight - 50}px` }} 
              className="absolute -translate-x-1/2 flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300 shadow-lg"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>EXPEDITION SUMMIT • MISSION ACCOMPLISHED</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          VIEW MODE 2: DOSSIER MATRIX GRID VIEW
      --------------------------------------------------------------------- */}
      {viewMode === 'DOSSIER' && (
        <div className="relative z-10 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((st, idx) => {
            const isCompleted = st.status === 'APPROVED_COMPLETED';
            const isActive = idx === activeStageIndex;
            const isSelected = inspectedStage?.id === st.id;

            return (
              <div
                key={st.id}
                onClick={() => handleNodeClick(st)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : isCompleted
                    ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400'
                    : isActive
                    ? 'bg-slate-950/80 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Stage {st.sequence}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCompleted ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' :
                      isActive ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 animate-pulse' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {st.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {st.title}
                  </h4>

                  {st.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {st.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">
                    +{st.xpReward || 300} XP
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Due: {st.dueDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------------
          STAGE INSPECTION COCKPIT (EXPAND PANEL / ACCEPTANCE GATE CHECKLIST)
      --------------------------------------------------------------------- */}
      {inspectedStage && (
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/90 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Stage Left Briefing */}
            <div className="space-y-4 max-w-3xl flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  STAGE {inspectedStage.sequence} CHECKPOINT
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {inspectedStage.title}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  inspectedStage.status === 'APPROVED_COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  inspectedStage.status === 'SUBMITTED_FOR_REVIEW' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  inspectedStage.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                  inspectedStage.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {inspectedStage.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  +{inspectedStage.xpReward || 300} XP BOUNTY
                </span>
              </div>

              {inspectedStage.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {inspectedStage.description}
                </p>
              )}

              {/* Acceptance Criteria & Verification Gate Checklist */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>Formal Stage-Gate Verification Criteria</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Strict Acceptance Gate</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed">
                  {inspectedStage.acceptanceCriteria || 'Deliverable verification artifacts and QA logic analysis traces required for sign-off.'}
                </div>

                {/* Acceptance Checklist Items */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <CheckSquare className={`w-4 h-4 ${inspectedStage.status === 'APPROVED_COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>Unit verification and integration regression tests pass 100%</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <CheckSquare className={`w-4 h-4 ${inspectedStage.status === 'APPROVED_COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>Hardware enclosure tolerance & schematic Gerber files validated</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <CheckSquare className={`w-4 h-4 ${inspectedStage.status === 'APPROVED_COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>Deliverable artifact evidence attached and reviewed by Lead Architect</span>
                  </div>
                </div>
              </div>

              {/* Submitted Test Evidence (if any) */}
              {inspectedStage.evidenceNotes && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-xs space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Submitted Milestone Acceptance Evidence:</span>
                    </span>
                    {inspectedStage.acceptedAt && (
                      <span className="text-[11px] text-emerald-500/80">
                        Accepted {new Date(inspectedStage.acceptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-200/90 leading-relaxed font-mono">
                    {inspectedStage.evidenceNotes}
                  </p>
                  {inspectedStage.evidenceUrl && (
                    <div className="pt-1">
                      <a
                        href={inspectedStage.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition-colors"
                      >
                        <span>Download & Inspect Complete Deliverable Artifact Package</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Personnel Metadata Bar */}
              <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-1">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  <span>Assignee / Owner: <strong className="text-white">{inspectedStage.ownerName || 'Unassigned'}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Lead Reviewer: <strong className="text-white">{inspectedStage.reviewerName || 'Unassigned'}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Due Date: <strong className="text-white">{inspectedStage.dueDate || 'Unscheduled'}</strong></span>
                </div>
              </div>
            </div>

            {/* Stage Right Actions Cockpit */}
            <div className="flex flex-col gap-3 min-w-[220px] shrink-0">
              {/* Personal Project Direct Checkpoint Toggle */}
              {isPersonalProject ? (
                inspectedStage.status === 'APPROVED_COMPLETED' ? (
                  <div className="space-y-2">
                    <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center shadow-lg space-y-1">
                      <div className="flex items-center justify-center space-x-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Checkpoint Conquered!</span>
                      </div>
                      <span className="text-[11px] text-emerald-300/80 block font-mono">
                        +{inspectedStage.xpReward || 150} XP Credited
                      </span>
                    </div>
                    {onToggleCheckpoint && (
                      <button
                        onClick={() => onToggleCheckpoint(inspectedStage)}
                        className="w-full text-center text-xs text-slate-400 hover:text-white underline cursor-pointer py-1"
                      >
                        Reopen Checkpoint
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => (onToggleCheckpoint ? onToggleCheckpoint(inspectedStage) : onSubmitForReview?.(inspectedStage))}
                    className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conquer Checkpoint (+150 XP)</span>
                  </button>
                )
              ) : (
                <>
                  {/* Submit for Review Action (Contributor / Owner) */}
                  {(inspectedStage.status === 'IN_PROGRESS' || 
                    inspectedStage.status === 'CHANGES_REQUESTED' || 
                    inspectedStage.status === 'NOT_STARTED') && onSubmitForReview && (
                    <button
                      onClick={() => onSubmitForReview(inspectedStage)}
                      className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit for Review Gate</span>
                    </button>
                  )}

                  {/* Conduct Review Gate Action (Reviewer / Lead / Management) */}
                  {inspectedStage.status === 'SUBMITTED_FOR_REVIEW' && onReviewMilestone && (
                    <button
                      onClick={() => onReviewMilestone(inspectedStage)}
                      className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Conduct Review Gate</span>
                    </button>
                  )}

                  {/* Conquered Badge */}
                  {inspectedStage.status === 'APPROVED_COMPLETED' && (
                    <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center shadow-lg space-y-1">
                      <div className="flex items-center justify-center space-x-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Stage Conquered!</span>
                      </div>
                      <span className="text-[11px] text-emerald-300/80 block font-mono">
                        +{inspectedStage.xpReward || 300} XP Credited
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Quick Jump between stages */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <button
                  disabled={inspectedStage.sequence <= 1}
                  onClick={() => {
                    const prev = stages.find(s => s.sequence === inspectedStage.sequence - 1);
                    if (prev) handleNodeClick(prev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ← Prev Stage
                </button>
                <button
                  disabled={inspectedStage.sequence >= stages.length}
                  onClick={() => {
                    const next = stages.find(s => s.sequence === inspectedStage.sequence + 1);
                    if (next) handleNodeClick(next);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next Stage →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Backwards compatibility alias for existing callers
export const QuestMap = ProjectExpeditionRoadmap;
