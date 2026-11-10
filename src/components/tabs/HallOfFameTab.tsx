import React, { useState, useMemo } from 'react';
import { LeaderboardUser, Badge, User } from '../../types';
import { 
  Trophy, Medal, Flame, Zap, Award, ShieldCheck, Target, 
  CheckCheck, Crown, Sparkles, CheckCircle2, Search,
  Users, TrendingUp, Star
} from 'lucide-react';

interface HallOfFameTabProps {
  leaderboard: LeaderboardUser[];
  badges: Badge[];
  currentUser: User;
  allUsers: User[];
}

export const HallOfFameTab: React.FC<HallOfFameTabProps> = ({
  leaderboard,
  badges,
  currentUser,
  allUsers
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LEADERBOARD' | 'BADGES'>('LEADERBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Compute departments
  const departments = useMemo(() => {
    const deps = new Set(leaderboard.map(u => u.department).filter(Boolean));
    return ['ALL', ...Array.from(deps)];
  }, [leaderboard]);

  // Filtered leaderboard
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(u => {
      const matchSearch = searchTerm === '' || 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.avatarTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = departmentFilter === 'ALL' || u.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [leaderboard, searchTerm, departmentFilter]);

  // Aggregate stats
  const totalXp = useMemo(() => {
    return leaderboard.reduce((acc, curr) => acc + (curr.xp || 0), 0);
  }, [leaderboard]);

  const totalTasksCompleted = useMemo(() => {
    return leaderboard.reduce((acc, curr) => acc + (curr.completedTasksCount || 0), 0);
  }, [leaderboard]);

  const topChampion = leaderboard.length > 0 ? leaderboard[0] : null;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs border border-amber-300">
            🥇 1
          </span>
        );
      case 2:
        return (
          <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs border border-slate-300">
            🥈 2
          </span>
        );
      case 3:
        return (
          <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-xs border border-amber-800">
            🥉 3
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center border border-gray-200">
            #{rank}
          </span>
        );
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Gamification & Recognition Engine
              </span>
              <span className="text-xs text-gray-600">Company-Wide Achievement Hub</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Innovation Hall of Fame & Mastery</h1>
            <p className="text-xs text-gray-600 max-w-2xl">
              Recognizing company-wide delivery excellence, milestone execution velocity, reporting compliance, and gamified innovation mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('LEADERBOARD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
              activeSubTab === 'LEADERBOARD'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>Leaderboard ({leaderboard.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('BADGES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
              activeSubTab === 'BADGES'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Achievement Badges ({badges.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Champion */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rank #1 Champion</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold text-sm">
              {topChampion ? topChampion.fullName.split(' ').map(n => n[0]).join('') : '-'}
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 truncate">
                {topChampion ? topChampion.fullName : 'No data yet'}
              </div>
              <div className="text-xs text-amber-700 font-semibold">
                {topChampion ? `${topChampion.xp.toLocaleString()} XP • Level ${topChampion.level}` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Total Innovation XP */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Company XP</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {totalXp.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Cumulative innovation points across {leaderboard.length} staff
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Tasks Delivered</span>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {totalTasksCompleted.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Verified approved milestone tasks completed
          </div>
        </div>

        {/* Available Badges */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Mastery Badges</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {badges.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Gamified mastery recognitions configured
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'LEADERBOARD' ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search innovator by name, role, title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder-gray-400 transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-gray-500 whitespace-nowrap">Department:</span>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                {departments.map(d => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Innovator</th>
                  <th className="py-3 px-4">Role / Department</th>
                  <th className="py-3 px-4 text-center">Streak</th>
                  <th className="py-3 px-4 text-center">Tasks Done</th>
                  <th className="py-3 px-4 text-center">Badges</th>
                  <th className="py-3 px-4 text-right">Innovation XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No innovators found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map(u => {
                    const isMe = u.id === currentUser.id;
                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isMe ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            {getRankBadge(u.rank)}
                          </div>
                        </td>

                        {/* Innovator */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center font-bold text-xs text-red-700 shrink-0">
                              {u.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-900 text-sm">{u.fullName}</span>
                                {isMe && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-indigo-700 font-medium">{u.avatarTitle}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role / Dept */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              {u.role}
                            </span>
                            <div className="text-gray-600 text-xs">{u.department}</div>
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1 font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{u.streakCount}w</span>
                          </div>
                        </td>

                        {/* Tasks Done */}
                        <td className="py-3 px-4 text-center font-semibold text-gray-800">
                          {u.completedTasksCount}
                        </td>

                        {/* Badges Count */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                            <Award className="w-3 h-3" />
                            <span>{u.badgesCount}</span>
                          </span>
                        </td>

                        {/* Innovation XP */}
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-extrabold text-blue-700 font-mono block">
                            {u.xp.toLocaleString()} XP
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Level {u.level}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Badges Catalog */
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Achievement Badges & Criteria</h2>
              <p className="text-xs text-gray-600">
                Official recognition criteria rewarded automatically upon meeting deliverable milestones.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {badges.length} Official Company Badges
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {badges.map(b => {
              const isEarnedByAdmin = userEarnedCodes.includes(b.code);
              // Find users who have this badge
              const earners = allUsers.filter(u => 
                (u.badges || []).some(ub => ub.code === b.code)
              );

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs">
                      {getBadgeIcon(b.icon, true)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{b.title}</h4>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full text-amber-800 bg-amber-50 border border-amber-200 shrink-0">
                          +{b.xpBonus} XP
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{b.description}</p>
                    </div>
                  </div>

                  {/* Badge Earners Roster */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">
                      Earned by {earners.length} team {earners.length === 1 ? 'member' : 'members'}:
                    </span>
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {earners.length === 0 ? (
                        <span className="text-gray-400 text-[11px] italic">Not yet awarded</span>
                      ) : (
                        earners.slice(0, 5).map(earner => (
                          <div
                            key={earner.id}
                            title={`${earner.fullName} (${earner.department})`}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-800 border-2 border-white flex items-center justify-center font-bold text-[10px]"
                          >
                            {earner.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))
                      )}
                      {earners.length > 5 && (
                        <span className="text-[10px] text-gray-500 pl-2">+{earners.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
