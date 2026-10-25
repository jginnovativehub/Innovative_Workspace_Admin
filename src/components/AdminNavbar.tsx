import React, { useState, useRef, useEffect } from 'react';
import { Shield, LogOut, RefreshCw, Bell, CheckCheck, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { User, NotificationItem } from '../types';

interface AdminNavbarProps {
  currentUser: User;
  onLogout: () => void;
  onRefreshAll: () => void;
  refreshing: boolean;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  currentUser,
  onLogout,
  onRefreshAll,
  refreshing,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    if (type?.includes('BLOCKER')) return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    if (type?.includes('APPROVED') || type?.includes('SUCCESS')) return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-red-500/20 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/25 ring-1 ring-white/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-red-200">
                JG INNOVATIVE HUB
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Enterprise Governance & Master Controls</p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={onRefreshAll}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-400' : ''}`} />
          </button>

          {/* Real-Time Live Notification Center */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500/40 text-slate-300 transition-colors"
              title="Admin Alerts & Live Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse ring-2 ring-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown HUD */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                {/* Header */}
                <div className="p-3.5 bg-slate-950/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live System Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center space-x-1 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-400 font-medium">All system logs nominal.</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">No unread platform notifications.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.readAt && onMarkNotificationRead(n.id)}
                        className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-800/60 ${
                          !n.readAt ? 'bg-red-950/20 border-l-2 border-red-500' : 'opacity-75'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          {getNotifIcon(n.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-white text-xs truncate">{n.title}</h5>
                              {!n.readAt && (
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-slate-300 text-[11px] mt-1 leading-relaxed break-words">{n.body}</p>
                            <span className="text-[10px] text-slate-500 font-mono block mt-1.5">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Tag */}
          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-white block leading-none">{currentUser.fullName}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{currentUser.email}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
