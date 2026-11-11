import React, { useState } from 'react';
import { NotificationItem } from '../../types';
import { 
  Bell, Search, CheckCheck, Trash2, Check, Clock, 
  AlertTriangle, Shield, UserPlus, FolderKanban, 
  FileText, Zap, Award, RefreshCw, Filter, CheckCircle2
} from 'lucide-react';
import { toast } from '../../context/ToastContext';
import { adminApi } from '../../api';

interface NotificationsTabProps {
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number | string) => void;
  onMarkAllNotificationsRead: () => void;
  onRefresh: () => void;
  onDeleteNotification?: (id: number | string) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onRefresh,
  onDeleteNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Notification feed updated', 'Refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    try {
      await adminApi.deleteNotification(id);
      toast.success('Notification dismissed', 'Success');
      if (onDeleteNotification) {
        onDeleteNotification(id);
      } else {
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss notification', 'Error');
    }
  };

  // Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.readAt).length;
  const blockerCount = notifications.filter(n => n.type === 'BLOCKER_ALERT').length;
  const governanceCount = notifications.filter(n => 
    n.type === 'USER_PROVISIONED' || 
    n.type === 'PROJECT_CREATED' || 
    n.type === 'PROJECT_DELETED' || 
    n.type === 'SECURITY_ALERT'
  ).length;

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.body || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.type || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'UNREAD' ? !n.readAt :
      Boolean(n.readAt);

    const matchesType = 
      typeFilter === 'ALL' ? true :
      n.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'BLOCKER_ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'USER_PROVISIONED':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case 'PROJECT_CREATED':
      case 'PROJECT_DELETED':
        return <FolderKanban className="w-4 h-4 text-blue-600" />;
      case 'MILESTONE_REVIEW':
      case 'REVIEW_APPROVED':
      case 'REVIEW_CHANGES_REQUESTED':
      case 'TASK_SUBMITTED':
      case 'TASK_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'XP_GAIN':
      case 'LEVEL_UP':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'SECURITY_ALERT':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'BLOCKER_ALERT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'USER_PROVISIONED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROJECT_CREATED':
      case 'PROJECT_DELETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SECURITY_ALERT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'XP_GAIN':
      case 'LEVEL_UP':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-500/20">
              <Bell className="w-3 h-3" />
              <span>Platform Intelligence</span>
            </span>
            <span className="text-xs text-gray-500 font-mono">Live SSE Hub</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Notifications Center</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Real-time feed of platform alerts, blocker escalations, project state changes, and automated system events.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200 transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllNotificationsRead}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Total Streamed</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Unread Alerts</span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">{unreadCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Escalated Blockers</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">{blockerCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <span className="text-xs text-gray-600 block font-medium">Governance Events</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{governanceCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, description, or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Read Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">All Read States</option>
            <option value="UNREAD">Unread Only ({unreadCount})</option>
            <option value="READ">Read Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="BLOCKER_ALERT">Blocker Alerts</option>
            <option value="USER_PROVISIONED">User Provisioning</option>
            <option value="PROJECT_CREATED">Project Created</option>
            <option value="PROJECT_DELETED">Project Deleted</option>
            <option value="MILESTONE_REVIEW">Milestone Reviews</option>
            <option value="SECURITY_ALERT">Security Notices</option>
            <option value="LEVEL_UP">Level Ups</option>
            <option value="XP_GAIN">XP Rewards</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400 border border-gray-200">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">No Notifications Match Filters</h4>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Try clearing your search keyword or relaxing filter criteria.'
                  : 'All platform notification streams are nominal.'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map(n => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                onClick={() => isUnread && onMarkNotificationRead(n.id)}
                className={`p-4 transition-all flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50/80 ${
                  isUnread ? 'bg-red-50/20 border-l-4 border-l-red-600' : 'opacity-85'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${getBadgeClass(n.type)}`}>
                    {getNotifIcon(n.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getBadgeClass(n.type)}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                          NEW
                        </span>
                      )}
                      {n.recipientRole && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          Role: {n.recipientRole}
                        </span>
                      )}
                      {n.recipientId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-500">
                          To User #{n.recipientId}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 mt-1">
                      {n.title}
                    </h4>

                    {n.body && (
                      <p className="text-xs text-gray-600 leading-relaxed break-words">
                        {n.body}
                      </p>
                    )}

                    <div className="flex items-center space-x-3 text-[11px] text-gray-400 font-mono pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isUnread ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkNotificationRead(n.id);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Mark as Read"
                    >
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium flex items-center space-x-1 px-2">
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                      <span className="hidden sm:inline">Read</span>
                    </span>
                  )}

                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
