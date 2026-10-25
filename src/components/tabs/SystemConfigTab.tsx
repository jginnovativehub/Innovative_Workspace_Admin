import React, { useState } from 'react';
import { Settings, Save, Clock, Calendar, Database, ShieldCheck } from 'lucide-react';
import { SystemConfig } from '../../types';
import { adminApi } from '../../api';
import { toast } from '../../context/ToastContext';

interface SystemConfigTabProps {
  config: SystemConfig;
  onConfigSaved: () => void;
}

export const SystemConfigTab: React.FC<SystemConfigTabProps> = ({ config, onConfigSaved }) => {
  const [deadlineDay, setDeadlineDay] = useState(config.reportingDeadlineDay || 'Friday');
  const [deadlineTime, setDeadlineTime] = useState(config.reportingDeadlineTime || '17:00');
  const [timezone, setTimezone] = useState(config.companyTimezone || 'Asia/Kolkata');
  const [weekStart, setWeekStart] = useState(config.reportingWeekStart || 'Monday');
  const [maxFileSize, setMaxFileSize] = useState(config.maxFileSizeMb || 25);
  const [retentionDays, setRetentionDays] = useState(config.retentionDays || 365);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.updateConfig({
        reportingDeadlineDay: deadlineDay,
        reportingDeadlineTime: deadlineTime,
        companyTimezone: timezone,
        reportingWeekStart: weekStart,
        maxFileSizeMb: Number(maxFileSize),
        retentionDays: Number(retentionDays)
      });
      onConfigSaved();
      toast.success('System operational parameters updated and recorded in the audit event trail!', 'Configuration Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update system parameters', 'Update Failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl text-left space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-black text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-red-400" />
            <span>Platform Operational Parameters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global governance rules affecting reporting deadlines, notification schedules, and document compliance company-wide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Weekly Reporting Deadline Day
              </label>
              <select
                value={deadlineDay}
                onChange={e => setDeadlineDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday (Default)</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reporting Cutoff Time
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={e => setDeadlineTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reporting Week Start Day
              </label>
              <select
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Deliverable Evidence Attachment Size (MB)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={maxFileSize}
                onChange={e => setMaxFileSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data & Audit Log Retention Period (Days)
              </label>
              <input
                type="number"
                min={30}
                max={3650}
                value={retentionDays}
                onChange={e => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              All modifications to operational rules trigger an immediate immutable audit trail entry recording 
              the previous and updated parameters.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

