import React, { useState } from 'react';
import { LeaderboardUser, Badge, User } from '../types';
import { 
  Trophy, Medal, Flame, Zap, Award, ShieldCheck, Target, 
  CheckCheck, Crown, X, Sparkles, CheckCircle2 
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardUser[];
  badges: Badge[];
  currentUser: User;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  badges,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'BADGES'>('LEADERBOARD');

  if (!isOpen) return null;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">1</span>;
      case 2:
        return <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs border border-slate-300">2</span>;
      case 3:
        return <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-xs">3</span>;
      default:
        return <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center border border-gray-200">{rank}</span>;
    }
  };

  const getBadgeIcon = (iconName: string, isEarned: boolean) => {
    const colorClass = isEarned ? 'text-indigo-600' : 'text-gray-400';
    switch (iconName) {
      case 'Zap': return <Zap className={`w-6 h-6 ${colorClass}`} />;
      case 'Award': return <Award className={`w-6 h-6 ${colorClass}`} />;
      case 'ShieldCheck': return <ShieldCheck className={`w-6 h-6 ${colorClass}`} />;
      case 'Target': return <Target className={`w-6 h-6 ${colorClass}`} />;
      case 'CheckCheck': return <CheckCheck className={`w-6 h-6 ${colorClass}`} />;
      case 'Crown': return <Crown className={`w-6 h-6 ${colorClass}`} />;
      default: return <Sparkles className={`w-6 h-6 ${colorClass}`} />;
    }
  };

  const userEarnedCodes = (currentUser.badges || []).map(b => b.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <span>Innovation Hall of Fame & Mastery</span>
              </h2>
              <p className="text-xs text-gray-600">Honoring excellence in milestone delivery, reporting & problem resolution</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 px-6 pt-2 bg-gray-50/60">
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'LEADERBOARD'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>Top Contributors (Leaderboard)</span>
          </button>
          <button
            onClick={() => setActiveTab('BADGES')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'BADGES'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Achievement Badges ({badges.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'LEADERBOARD' ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-600 flex items-center justify-between pb-2 px-3 border-b border-gray-200 font-semibold uppercase tracking-wider">
                <span className="w-12">Rank</span>
                <span className="flex-1">Innovator</span>
                <span className="w-24 text-center">Streak</span>
                <span className="w-24 text-center">Tasks Done</span>
                <span className="w-28 text-right">Total XP</span>
              </div>
              {leaderboard.map(u => {
                const isMe = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isMe 
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 flex items-center">
                      {getRankBadge(u.rank)}
                    </div>

                    <div className="flex-1 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700">
                        {u.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-900">{u.fullName}</span>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-indigo-700 font-semibold">{u.avatarTitle}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-[11px] text-gray-600">{u.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 flex items-center justify-center text-xs font-bold text-amber-700">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                      <span>{u.streakCount}w</span>
                    </div>

                    <div className="w-24 text-center text-xs font-semibold text-gray-700">
                      {u.completedTasksCount}
                    </div>

                    <div className="w-28 text-right">
                      <span className="text-sm font-extrabold text-blue-700 font-mono block">
                        {u.xp.toLocaleString()} XP
                      </span>
                      <span className="text-[10px] text-gray-600">Level {u.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map(b => {
                const isEarned = userEarnedCodes.includes(b.code);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border flex items-start space-x-4 transition-all ${
                      isEarned
                        ? 'bg-white border-2 border-emerald-500 shadow-sm'
                        : 'bg-gray-50/70 border border-gray-200 opacity-75'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                      isEarned 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs' 
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}>
                      {getBadgeIcon(b.icon, isEarned)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{b.title}</h4>
                        <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                          isEarned
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-gray-500 bg-gray-100 border-gray-200'
                        }`}>
                          +{b.xpBonus} XP
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{b.description}</p>
                      <div className="mt-2.5">
                        {isEarned ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500">
                            Locked • Complete requirement to earn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
