import React, { useState, useRef, useEffect } from 'react';
import { Shield, LogOut, RefreshCw, Bell, CheckCheck, AlertCircle, Info, CheckCircle2, Trophy } from 'lucide-react';
import { User, NotificationItem } from '../types';
import logoImg from '../assets/logo.png';

interface AdminNavbarProps {
  currentUser: User;
  onLogout: () => void;
  onRefreshAll: () => void;
  refreshing: boolean;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number | string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenLeaderboard: () => void;
  onOpenNotificationsCenter?: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  currentUser,
  onLogout,
  onRefreshAll,
  refreshing,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenLeaderboard,
  onOpenNotificationsCenter
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
    if (type?.includes('BLOCKER')) return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
    if (type?.includes('APPROVED') || type?.includes('SUCCESS')) return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0 border border-gray-200 overflow-hidden">
            <img src={logoImg} alt="Innovative Hub" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-xs sm:text-base text-gray-900 tracking-tight truncate">
                INNOVATIVE HUB
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 shrink-0">
                ADMIN
              </span>
            </div>
            <p className="hidden sm:block text-xs text-gray-500 truncate">Platform Governance & Master Controls</p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Refresh Button */}
          <button
            onClick={onRefreshAll}
            disabled={refreshing}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
          </button>

          {/* Hall of Fame / Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-colors shadow-xs"
            title="Innovation Hall of Fame & Badges"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Hall of Fame</span>
          </button>

          {/* Real-Time Live Notification Center */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-red-300 text-gray-700 transition-colors"
              title="Admin Alerts & Live Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown HUD */}
            {showNotifications && (
              <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:top-auto sm:absolute sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100">
                {/* Header */}
                <div className="p-3.5 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Live System Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center space-x-1 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-700 font-medium">All system logs nominal.</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">No unread platform notifications.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.readAt && onMarkNotificationRead(n.id)}
                        className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-gray-50 ${
                          !n.readAt ? 'bg-red-50/50 border-l-2 border-red-600' : 'opacity-80'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          {getNotifIcon(n.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-gray-900 text-xs truncate">{n.title}</h5>
                              {!n.readAt && (
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-gray-600 text-[11px] mt-1 leading-relaxed break-words">{n.body}</p>
                            <span className="text-[10px] text-gray-400 font-mono block mt-1.5">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer with link to full center */}
                <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenNotificationsCenter?.();
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center justify-center space-x-1.5 w-full py-0.5 hover:underline cursor-pointer"
                  >
                    <span>View All in Notifications Center →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Tag */}
          <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-7 h-7 rounded-md bg-red-100 text-red-700 border border-red-200 flex items-center justify-center text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-gray-900 block leading-none">{currentUser.fullName}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">{currentUser.email}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-700 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
