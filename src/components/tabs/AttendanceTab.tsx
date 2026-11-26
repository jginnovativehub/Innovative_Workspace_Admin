import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, Clock, MessageSquare, ChevronLeft, ChevronRight, 
  UserCheck, AlertCircle, Sparkles, Building2, ShieldCheck, Filter, Search,
  CalendarDays, UserPlus, Check, X, RefreshCw, Eye, Edit3, Trash2, PartyPopper, Sun, Plus
} from 'lucide-react';
import { User, AttendanceRecord, AttendanceSummary, HolidayRecord, WeekendPolicy } from '../../types';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface AttendanceTabProps {
  users: User[];
  onUserMutated?: () => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ users, onUserMutated }) => {
  // Navigation & Date State
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [viewMode, setViewMode] = useState<'ROLL_CALL' | 'CALENDAR'>('ROLL_CALL');
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.id || 1);

  // Data State
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Holidays & Weekend Policy State (Admin, CEO, COO - Defaults to false, set explicitly)
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [weekendPolicy, setWeekendPolicy] = useState<WeekendPolicy>({
    saturdayHoliday: false,
    sundayHoliday: false
  });
  const [satHoliday, setSatHoliday] = useState(false);
  const [sunHoliday, setSunHoliday] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayType, setNewHolidayType] = useState('COMPANY_HOLIDAY');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [submittingHoliday, setSubmittingHoliday] = useState(false);

  // Filters for Roll-Call Table
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalData, setRecordModalData] = useState<{
    userId: number;
    date: string;
    status: 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT';
    comment: string;
    existingId?: string | number;
  }>({
    userId: users[0]?.id || 1,
    date: todayStr,
    status: 'PRESENT',
    comment: ''
  });
  const [savingRecord, setSavingRecord] = useState(false);

  // Day inspection modal
  const [selectedDayRecord, setSelectedDayRecord] = useState<{ date: string; record?: AttendanceRecord } | null>(null);
  const [inspectComment, setInspectComment] = useState('');
  const [inspectStatus, setInspectStatus] = useState<'PRESENT' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT'>('PRESENT');

  // Departments list
  const departments = ['ALL', ...Array.from(new Set(users.map(u => u.department || 'General')))];

  // Fetch all attendance for selected month
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [records, sum, holData] = await Promise.all([
        adminApi.getAttendance({ month: selectedMonth }),
        adminApi.getAttendanceSummary({ month: selectedMonth }),
        adminApi.getHolidays().catch(() => ({ holidays: [], weekendPolicy: { saturdayHoliday: false, sundayHoliday: false } }))
      ]);
      setMonthlyRecords(records);
      setSummary(sum);
      setHolidays(holData.holidays || []);
      setWeekendPolicy(holData.weekendPolicy || { saturdayHoliday: false, sundayHoliday: false });
      setSatHoliday(Boolean(holData.weekendPolicy?.saturdayHoliday));
      setSunHoliday(Boolean(holData.weekendPolicy?.sundayHoliday));
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch attendance data', 'Attendance Error');
    } finally {
      setLoading(false);
    }
  };

  // Weekend Policy & Holiday Handlers
  const handleSaveWeekendPolicy = async () => {
    try {
      const res = await adminApi.updateWeekendPolicy({
        saturdayHoliday: satHoliday,
        sundayHoliday: sunHoliday
      });
      setWeekendPolicy(res.weekendPolicy);
      toast.success('Weekend policy updated successfully', 'Settings Saved');
      await fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update weekend policy', 'Error');
    }
  };

  const handleCreateHoliday = async () => {
    if (!newHolidayDate || !newHolidayTitle) {
      toast.error('Date and Title are required to declare a holiday', 'Validation');
      return;
    }
    setSubmittingHoliday(true);
    try {
      await adminApi.createHoliday({
        date: newHolidayDate,
        title: newHolidayTitle,
        type: newHolidayType,
        description: newHolidayDesc
      });
      toast.success(`Holiday "${newHolidayTitle}" declared!`, 'Holiday Added');
      setNewHolidayDate('');
      setNewHolidayTitle('');
      setNewHolidayDesc('');
      setIsHolidayModalOpen(false);
      await fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to declare holiday', 'Error');
    } finally {
      setSubmittingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to remove this company holiday?')) return;
    try {
      await adminApi.deleteHoliday(id);
      toast.success('Company holiday removed', 'Deleted');
      await fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove holiday', 'Error');
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  // Month Navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleResetCurrentMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(yearNum, monthNum - 1, 1);
  const monthDisplayName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Today's attendance mapping by userId
  const todayRecordsByUser = new Map<number, AttendanceRecord>();
  monthlyRecords.forEach(r => {
    if (r.date === todayStr) {
      todayRecordsByUser.set(r.userId, r);
    }
  });

  // Calculate Roll-Call Stats
  const totalEmployees = users.length;
  let presentTodayCount = 0;
  let halfDayTodayCount = 0;
  let onLeaveTodayCount = 0;
  let absentTodayCount = 0;

  users.forEach(u => {
    const rec = todayRecordsByUser.get(u.id);
    if (!rec) return;
    if (rec.status === 'PRESENT') presentTodayCount++;
    else if (rec.status === 'HALF_DAY') halfDayTodayCount++;
    else if (rec.status === 'ON_LEAVE') onLeaveTodayCount++;
    else if (rec.status === 'ABSENT') absentTodayCount++;
  });

  const totalMarkedToday = presentTodayCount + halfDayTodayCount + onLeaveTodayCount + absentTodayCount;
  const unmarkedTodayCount = Math.max(0, totalEmployees - totalMarkedToday);
  const attendanceRate = totalEmployees > 0 ? Math.round(((presentTodayCount + halfDayTodayCount * 0.5) / totalEmployees) * 100) : 0;

  // Filtered Users for Roll-Call Table
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || user.department === deptFilter;
    
    const rec = todayRecordsByUser.get(user.id);
    const userStatus = rec ? rec.status : 'UNMARKED';
    const matchesStatus = statusFilter === 'ALL' || userStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Open Record Modal (either for new or edit)
  const openRecordModal = (user: User, existingRecord?: AttendanceRecord) => {
    setRecordModalData({
      userId: user.id,
      date: existingRecord ? existingRecord.date : todayStr,
      status: existingRecord ? (existingRecord.status as any) : 'PRESENT',
      comment: existingRecord?.comment || '',
      existingId: existingRecord?.id || existingRecord?._id
    });
    setIsRecordModalOpen(true);
  };

  // Submit Record Modal
  const handleSaveAttendance = async () => {
    setSavingRecord(true);
    try {
      if (recordModalData.existingId) {
        await adminApi.updateAttendance(recordModalData.existingId, {
          status: recordModalData.status,
          comment: recordModalData.comment
        });
        toast.success('Attendance record updated successfully', 'Updated');
      } else {
        await adminApi.markAttendance({
          userId: recordModalData.userId,
          date: recordModalData.date,
          status: recordModalData.status,
          comment: recordModalData.comment
        });
        toast.success('Attendance logged on behalf of employee', 'Recorded');
      }
      setIsRecordModalOpen(false);
      await fetchAttendance();
      if (onUserMutated) onUserMutated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance', 'Save Error');
    } finally {
      setSavingRecord(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await adminApi.deleteAttendance(id);
      toast.success('Attendance entry removed', 'Deleted');
      if (selectedDayRecord) setSelectedDayRecord(null);
      await fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record', 'Error');
    }
  };

  // Selected User records for Calendar View
  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];
  const userCalendarRecords = monthlyRecords.filter(r => r.userId === selectedUserId);
  const userRecordsByDate = new Map<string, AttendanceRecord>();
  userCalendarRecords.forEach(r => {
    if (r.date) userRecordsByDate.set(r.date, r);
  });

  // Calendar calculations
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); // 0 is Sun
  const startOffset = (firstDayOfWeek + 6) % 7; // Monday = 0, Sun = 6

  const renderStatusBadge = (status?: string, size = 'sm') => {
    const textClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
    switch (status) {
      case 'PRESENT':
        return (
          <span className={`inline-flex items-center space-x-1 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${textClass}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Present</span>
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className={`inline-flex items-center space-x-1 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${textClass}`}>
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Half Day</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className={`inline-flex items-center space-x-1 font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300 ${textClass}`}>
            <Building2 className="w-3 h-3 text-purple-600" />
            <span>On Leave</span>
          </span>
        );
      case 'ABSENT':
        return (
          <span className={`inline-flex items-center space-x-1 font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${textClass}`}>
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Absent</span>
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center space-x-1 font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200 ${textClass}`}>
            <span>Unmarked</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0">
              <CalendarDays className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              Workforce Governance
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
            Workforce Attendance & Roll-Call Central
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Executive roll-call and individual monthly attendance calendars. Employees have strict privacy isolation and cannot view peers' logs.
          </p>
        </div>

        {/* Action Buttons & Month Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Navigator */}
          <div className="inline-flex items-center bg-gray-50 border border-gray-300 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-gray-800 min-w-[120px] text-center">
              {monthDisplayName}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedMonth !== currentMonthStr && (
            <button
              onClick={handleResetCurrentMonth}
              className="px-2.5 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Current Month
            </button>
          )}

          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (users.length > 0) openRecordModal(users[0]);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Record on Behalf</span>
          </button>

          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-all shadow-xs"
            title="Configure Weekend Schedule (Saturday/Sunday) and Declare Company Holidays"
          >
            <PartyPopper className="w-4 h-4 text-purple-600" />
            <span>Weekend & Holidays</span>
          </button>
        </div>
      </div>

      {/* Weekend Schedule & Holidays Executive Card */}
      <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900">
              Weekend Policy & Company Holidays (Admin / CEO / COO Authority)
            </h3>
          </div>
          <p className="text-[11px] text-purple-800">
            Current Schedule: Saturday is <strong className="underline">{weekendPolicy.saturdayHoliday ? 'Company Holiday (Off)' : 'Working Day'}</strong> &bull; Sunday is <strong className="underline">{weekendPolicy.sundayHoliday ? 'Company Holiday (Off)' : 'Working Day'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center space-x-1.5 bg-white border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={satHoliday}
              onChange={e => setSatHoliday(e.target.checked)}
              className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span>Sat Off</span>
          </label>

          <label className="flex items-center space-x-1.5 bg-white border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={sunHoliday}
              onChange={e => setSunHoliday(e.target.checked)}
              className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span>Sun Off</span>
          </label>

          <button
            onClick={handleSaveWeekendPolicy}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Apply Weekend Policy
          </button>

          <button
            onClick={() => {
              setNewHolidayDate(todayStr);
              setIsHolidayModalOpen(true);
            }}
            className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Declare Holiday</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Total Workforce
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalEmployees}</div>
          <div className="text-[11px] text-gray-500 mt-1">Registered staff</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
            Present Today
          </div>
          <div className="text-2xl font-bold text-emerald-700 flex items-center justify-between">
            <span>{presentTodayCount}</span>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {attendanceRate}%
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Checked in for duty</div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">
            Half Day Today
          </div>
          <div className="text-2xl font-bold text-amber-700">{halfDayTodayCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Partial shift logged</div>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 mb-1">
            On Leave / Absent
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {onLeaveTodayCount + absentTodayCount}
          </div>
          <div className="text-[11px] text-purple-700 mt-1">
            {onLeaveTodayCount} leave, {absentTodayCount} absent
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Unmarked Today
          </div>
          <div className="text-2xl font-bold text-gray-700">{unmarkedTodayCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Pending check-in</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setViewMode('ROLL_CALL')}
          className={`pb-3 text-xs font-bold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap shrink-0 ${
            viewMode === 'ROLL_CALL'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Workforce Roll-Call (Today: {todayStr})</span>
        </button>

        <button
          onClick={() => setViewMode('CALENDAR')}
          className={`pb-3 text-xs font-bold transition-colors flex items-center space-x-2 border-b-2 whitespace-nowrap shrink-0 ${
            viewMode === 'CALENDAR'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Individual Monthly Calendar Grid</span>
        </button>
      </div>

      {/* VIEW MODE 1: ROLL-CALL TABLE */}
      {viewMode === 'ROLL_CALL' && (
        <div className="space-y-4">
          {/* Table Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs text-gray-900 border-none outline-none focus:ring-0 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span>Dept:</span>
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="ABSENT">Absent</option>
                  <option value="UNMARKED">Unmarked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roll Call Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Today's Status</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Daily Comment / Remark</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No employees match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const todayRec = todayRecordsByUser.get(user.id);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 border border-red-200">
                                {user.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{user.fullName}</div>
                                <div className="text-[11px] text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-800">{user.department}</div>
                            <div className="text-[11px] text-gray-500">{user.role}</div>
                          </td>

                          <td className="py-3 px-4">
                            {renderStatusBadge(todayRec?.status)}
                          </td>

                          <td className="py-3 px-4">
                            {todayRec?.markedAt ? (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>{new Date(todayRec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not checked in</span>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            {todayRec?.comment ? (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-700 flex items-start space-x-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 text-[11px]">{todayRec.comment}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No comment provided</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => openRecordModal(user, todayRec)}
                                className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-[11px] transition-colors"
                                title="Edit or mark today's status"
                              >
                                {todayRec ? 'Edit Status' : 'Mark Present'}
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setViewMode('CALENDAR');
                                }}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors"
                                title="View Full Monthly Calendar"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INDIVIDUAL MONTHLY CALENDAR GRID */}
      {viewMode === 'CALENDAR' && (
        <div className="space-y-6">
          {/* Employee Selection Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 border border-red-200">
                {selectedUser?.fullName?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-gray-900">{selectedUser?.fullName}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 font-semibold text-gray-700">
                    {selectedUser?.role}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedUser?.department} &bull; {selectedUser?.email}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-semibold text-gray-600 shrink-0">Inspect Employee:</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(Number(e.target.value))}
                className="w-full sm:w-auto max-w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 bg-gray-50 border-b-2 border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  {monthDisplayName} Calendar Grid
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Present</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Half Day</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>On Leave</span>
                </span>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 border-b-2 border-gray-300 bg-gray-100 divide-x divide-gray-300 text-center text-[10px] sm:text-xs font-bold text-gray-700 py-2 sm:py-3 tracking-wider uppercase mb-0">
              <div className="py-0.5">Mon</div>
              <div className="py-0.5">Tue</div>
              <div className="py-0.5">Wed</div>
              <div className="py-0.5">Thu</div>
              <div className="py-0.5">Fri</div>
              <div className={`py-0.5 ${weekendPolicy.saturdayHoliday ? 'text-rose-600 bg-rose-50/50' : 'text-gray-700'}`}>
                Sat <span className="hidden sm:inline">{weekendPolicy.saturdayHoliday ? '(Off)' : ''}</span>
              </div>
              <div className={`py-0.5 ${weekendPolicy.sundayHoliday ? 'text-rose-600 bg-rose-50/50' : 'text-gray-700'}`}>
                Sun <span className="hidden sm:inline">{weekendPolicy.sundayHoliday ? '(Off)' : ''}</span>
              </div>
            </div>

            {/* Grid Cells with High-Contrast Solid 1px Grid Lines */}
            <div className="grid grid-cols-7 gap-[1px] bg-gray-300">
              {/* Empty leading offset cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[68px] sm:min-h-[120px] bg-gray-100/70 p-1 sm:p-2.5 opacity-60 min-w-0 overflow-hidden" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                const record = userRecordsByDate.get(dateKey);
                const isToday = dateKey === todayStr;
                const dayOfWeek = (startOffset + idx) % 7;
                const isSaturday = dayOfWeek === 5;
                const isSunday = dayOfWeek === 6;

                const holiday = holidays.find(h => h.date === dateKey);
                const isWeekendOff = (isSaturday && weekendPolicy.saturdayHoliday) || (isSunday && weekendPolicy.sundayHoliday);

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      setSelectedDayRecord({ date: dateKey, record });
                      setInspectComment(record?.comment || '');
                      setInspectStatus((record?.status as any) || 'PRESENT');
                    }}
                    className={`min-h-[68px] sm:min-h-[120px] p-1 sm:p-2.5 min-w-0 overflow-hidden transition-all cursor-pointer flex flex-col justify-between group ${
                      isToday
                        ? 'bg-red-50/40 ring-2 ring-red-600 ring-inset z-10'
                        : holiday
                        ? 'bg-purple-50/50 hover:bg-purple-100/50'
                        : record
                        ? record.status === 'PRESENT'
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : record.status === 'HALF_DAY'
                          ? 'bg-amber-50/20 hover:bg-amber-50/40'
                          : 'bg-purple-50/20 hover:bg-purple-50/40'
                        : isWeekendOff
                        ? 'bg-gray-50/80 hover:bg-gray-100/60'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 items-center">
                      <span className={`text-[11px] sm:text-xs font-bold flex items-center justify-center min-w-[22px] sm:min-w-[24px] h-5 sm:h-6 px-1 sm:px-1.5 rounded-md sm:rounded-lg transition-colors shrink-0 ${
                        isToday 
                          ? 'text-white bg-red-600 shadow-xs' 
                          : holiday
                          ? 'text-white bg-purple-600 shadow-xs'
                          : isWeekendOff
                          ? 'text-rose-600 font-bold'
                          : 'text-gray-900 group-hover:text-red-600'
                      }`}>
                        {dayNum}
                      </span>
                      {holiday ? (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 flex items-center space-x-1 shrink-0 max-w-full">
                          <Sparkles className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                          <span className="hidden sm:inline">Holiday</span>
                        </span>
                      ) : record ? (
                        <>
                          <span className="hidden sm:inline-flex">{renderStatusBadge(record.status, 'sm')}</span>
                          <span className={`sm:hidden text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            record.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            record.status === 'ON_LEAVE' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {record.status === 'PRESENT' ? 'P' : record.status === 'HALF_DAY' ? 'HD' : record.status === 'ON_LEAVE' ? 'L' : 'A'}
                          </span>
                        </>
                      ) : isWeekendOff ? (
                        <span className="text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-gray-200/80 text-gray-600 border border-gray-300 truncate max-w-full">
                          <span className="sm:hidden">Off</span>
                          <span className="hidden sm:inline">{isSunday ? 'Sun Off' : 'Sat Off'}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Mobile Compact Indicator Dots */}
                    <div className="sm:hidden flex items-center justify-center gap-1 mt-1 min-h-[10px]">
                      {record?.comment && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {holiday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      )}
                    </div>

                    <div className="hidden sm:block my-1.5 flex-1 space-y-1">
                      {holiday && (
                        <div className="text-[11px] font-bold text-purple-900 bg-purple-100/90 border border-purple-200 rounded-lg px-2 py-1 line-clamp-1 flex items-center space-x-1.5 shadow-2xs">
                          <PartyPopper className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{holiday.title}</span>
                        </div>
                      )}
                      {record?.comment ? (
                        <div className="text-[11px] text-gray-700 line-clamp-2 bg-gray-50 group-hover:bg-white p-1.5 rounded-lg border border-gray-200 flex items-start space-x-1 shadow-2xs leading-snug">
                          <MessageSquare className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                          <span>{record.comment}</span>
                        </div>
                      ) : record?.markedAt ? (
                        <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : holiday ? null : isWeekendOff ? (
                        <div className="text-[10px] text-gray-400 italic">Rest Day</div>
                      ) : (
                        <div className="text-[10px] text-gray-300 italic">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD OR EDIT ATTENDANCE ON BEHALF */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-gray-200 text-left space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  {recordModalData.existingId ? 'Edit Attendance Record' : 'Record Attendance on Behalf'}
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Employee
                </label>
                <select
                  value={recordModalData.userId}
                  onChange={e => setRecordModalData(prev => ({ ...prev, userId: Number(e.target.value) }))}
                  disabled={!!recordModalData.existingId}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.department} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={recordModalData.date}
                  onChange={e => setRecordModalData(prev => ({ ...prev, date: e.target.value }))}
                  disabled={!!recordModalData.existingId}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PRESENT', 'HALF_DAY', 'ON_LEAVE'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRecordModalData(prev => ({ ...prev, status: st }))}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        recordModalData.status === st
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {st === 'PRESENT' ? 'Present' : st === 'HALF_DAY' ? 'Half Day' : 'On Leave'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Comment / Daily Work Summary
                </label>
                <textarea
                  rows={3}
                  value={recordModalData.comment}
                  onChange={e => setRecordModalData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="e.g. Worked on Sprint 4 backend API & architecture review"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingRecord}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs flex items-center space-x-1.5"
              >
                {savingRecord ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Attendance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT / EDIT DAY DETAIL IN CALENDAR VIEW */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-gray-200 text-left space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                  <CalendarDays className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Date Inspection: {selectedDayRecord.date}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Check if this date is a declared Holiday */}
              {(() => {
                const dayHoliday = holidays.find(h => h.date === selectedDayRecord.date);
                if (dayHoliday) {
                  return (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <PartyPopper className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-purple-900 text-xs block">
                            Company Holiday: {dayHoliday.title}
                          </span>
                          <span className="text-[11px] text-purple-700 block mt-0.5">
                            {dayHoliday.description || 'Official company holiday'} ({dayHoliday.type?.replace('_', ' ')})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await handleDeleteHoliday(dayHoliday.id || dayHoliday._id!);
                          setSelectedDayRecord(null);
                        }}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center space-x-1 shrink-0 p-1"
                        title="Remove this company holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Attendance Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PRESENT', 'HALF_DAY', 'ON_LEAVE'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setInspectStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        inspectStatus === st
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {st === 'PRESENT' ? 'Present' : st === 'HALF_DAY' ? 'Half Day' : 'On Leave'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Comment / Daily Work Summary
                </label>
                <textarea
                  rows={3}
                  value={inspectComment}
                  onChange={e => setInspectComment(e.target.value)}
                  placeholder="Enter employee remarks or task details..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-gray-400"
                />
              </div>

              {selectedDayRecord.record?.markedAt && (
                <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  Logged at: {new Date(selectedDayRecord.record.markedAt).toLocaleString()}
                </div>
              )}

              {/* Quick Holiday Declaration on this Date */}
              {!holidays.some(h => h.date === selectedDayRecord.date) && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Mark date as Company Holiday?</span>
                  <button
                    onClick={() => {
                      setNewHolidayDate(selectedDayRecord.date);
                      setSelectedDayRecord(null);
                      setIsHolidayModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Declare Holiday</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              {selectedDayRecord.record ? (
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(selectedDayRecord.record!.id || selectedDayRecord.record!._id!)}
                  className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              ) : <div />}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayRecord(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (selectedDayRecord.record) {
                        await adminApi.updateAttendance(
                          selectedDayRecord.record.id || selectedDayRecord.record._id!,
                          { status: inspectStatus, comment: inspectComment }
                        );
                        toast.success('Attendance updated', 'Saved');
                      } else {
                        await adminApi.markAttendance({
                          userId: selectedUserId,
                          date: selectedDayRecord.date,
                          status: inspectStatus,
                          comment: inspectComment
                        });
                        toast.success('Attendance recorded', 'Saved');
                      }
                      setSelectedDayRecord(null);
                      await fetchAttendance();
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to update record', 'Error');
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HOLIDAY & WEEKEND POLICY CONFIGURATION (ADMIN, CEO, COO) */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 text-left space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <PartyPopper className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Weekend Schedule & Company Holidays Governance
                  </h3>
                  <p className="text-xs text-gray-500">
                    Set Saturday & Sunday off policy and declare official company-recognized holidays.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto pr-1">
              {/* Weekend Policy Setting */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                    Weekend Schedule Policy
                  </h4>
                </div>
                <p className="text-xs text-gray-500">
                  Select whether Saturday and Sunday are company holidays (off) or working days.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:border-purple-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={satHoliday}
                      onChange={e => setSatHoliday(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-xs">Saturday is Holiday (Off)</span>
                      <span className="text-[11px] text-gray-500">
                        {satHoliday ? 'Company rest day' : 'Official working day'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:border-purple-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={sunHoliday}
                      onChange={e => setSunHoliday(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-xs">Sunday is Holiday (Off)</span>
                      <span className="text-[11px] text-gray-500">
                        {sunHoliday ? 'Company rest day' : 'Official working day'}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveWeekendPolicy}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Weekend Settings</span>
                  </button>
                </div>
              </div>

              {/* Declare New Holiday Form */}
              <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <PartyPopper className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    Declare New Company Holiday
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={e => setNewHolidayDate(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali, Foundation Day"
                      value={newHolidayTitle}
                      onChange={e => setNewHolidayTitle(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Category
                    </label>
                    <select
                      value={newHolidayType}
                      onChange={e => setNewHolidayType(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                    >
                      <option value="COMPANY_HOLIDAY">Company Holiday</option>
                      <option value="PUBLIC_HOLIDAY">Public Holiday</option>
                      <option value="FESTIVAL">Festival</option>
                      <option value="OPTIONAL_HOLIDAY">Optional Holiday</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Description / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Short description of the celebration or event"
                    value={newHolidayDesc}
                    onChange={e => setNewHolidayDesc(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleCreateHoliday}
                    disabled={submittingHoliday}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{submittingHoliday ? 'Declaring...' : 'Declare Company Holiday'}</span>
                  </button>
                </div>
              </div>

              {/* Declared Holidays List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                  Recognized Company Holidays ({holidays.length})
                </h4>
                {holidays.length === 0 ? (
                  <p className="text-gray-400 italic py-2">No company holidays declared yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {holidays
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(h => (
                        <div key={h.id || h._id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {h.date}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 block text-xs">{h.title}</span>
                              <span className="text-[11px] text-gray-500">
                                {h.description || 'Company Holiday'} &bull; {h.type?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteHoliday(h.id || h._id!)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                            title="Delete holiday"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
