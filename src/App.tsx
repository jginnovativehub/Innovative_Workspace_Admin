import React, { useState, useEffect } from 'react';
import { 
  Users, FolderKanban, Settings, FileSearch, 
  Shield, RefreshCw, Lock, Trophy, Bell, CalendarCheck 
} from 'lucide-react';
import { adminApi } from './api';
import { User, Project, SystemConfig, AuditEvent, MongoStatus, NotificationItem, LeaderboardUser, Badge } from './types';
import { AdminLogin } from './components/AdminLogin';
import { AdminNavbar } from './components/AdminNavbar';
import { UserManagementTab } from './components/tabs/UserManagementTab';
import { ProjectManagementTab } from './components/tabs/ProjectManagementTab';
import { SystemConfigTab } from './components/tabs/SystemConfigTab';
import { AuditLogTab } from './components/tabs/AuditLogTab';
import { PersonalProjectTracker } from './components/PersonalProjectTracker';
import { HallOfFameTab } from './components/tabs/HallOfFameTab';
import { NotificationsTab } from './components/tabs/NotificationsTab';
import { AttendanceTab } from './components/tabs/AttendanceTab';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LogoutModal } from './components/LogoutModal';
import { toast } from './context/ToastContext';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'USERS' | 'PROJECTS' | 'CONFIG' | 'AUDIT' | 'PERSONAL_PROJECTS' | 'HALL_OF_FAME' | 'NOTIFICATIONS' | 'ATTENDANCE'>('USERS');

  // Core Data
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [mongoStatus, setMongoStatus] = useState<MongoStatus>({
    connected: false,
    dbName: null,
    message: 'Local Persistent Document Engine Active (MongoDB Atlas Ready)',
    hasConfiguredUri: false
  });

  useEffect(() => {
    checkAdminSession();
  }, []);

  // Real-Time Notification Stream & Fast Polling Synchronization
  useEffect(() => {
    if (!currentUser) return;

    // 1. Real-Time SSE Stream
    const closeStream = adminApi.createNotificationStream((newNotif: NotificationItem) => {
      setNotifications(prev => {
        if (prev.some(n => String(n.id) === String(newNotif.id) || (n._id && newNotif._id && String(n._id) === String(newNotif._id)))) return prev;
        return [newNotif, ...prev];
      });
    });

    // 2. 5-Second polling sync to guarantee multi-tab data freshness
    const pollInterval = setInterval(async () => {
      try {
        const freshNotifs = await adminApi.getNotifications();
        setNotifications(prev => {
          // Robust merge: if a notification was marked read in local state, NEVER let background poll revert it to unread!
          return freshNotifs.map(fn => {
            const existing = prev.find(p => String(p.id) === String(fn.id) || (p._id && fn._id && String(p._id) === String(fn._id)));
            if (existing && existing.readAt && !fn.readAt) {
              return { ...fn, readAt: existing.readAt };
            }
            return fn;
          });
        });
      } catch (err) {
        // Continue silently on transient network hiccup
      }
    }, 5000);

    return () => {
      closeStream();
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  const checkAdminSession = async () => {
    const token = localStorage.getItem('jg_admin_token');
    if (token) {
      try {
        const user = await adminApi.getCurrentUser();
        setCurrentUser(user);
        await loadAllAdminData();
      } catch (err) {
        console.error('Admin session invalid:', err);
        adminApi.logout();
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setIsInitializing(false);
  };

  const loadAllAdminData = async () => {
    setRefreshing(true);
    try {
      const [uData, pData, cfgData, audData, mStatus, notifsData, lbData, bgData] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getProjects().catch(() => []),
        adminApi.getConfig().catch(() => ({
          id: 1,
          reportingWeekStart: 'Monday',
          reportingDeadlineDay: 'Friday',
          reportingDeadlineTime: '17:00',
          companyTimezone: 'Asia/Kolkata',
          maxFileSizeMb: 25,
          retentionDays: 365
        })),
        adminApi.getAuditEvents().catch(() => []),
        adminApi.getMongoStatus().catch(() => ({
          connected: false,
          dbName: null,
          message: 'Local Persistent Document Engine Active',
          hasConfiguredUri: false
        })),
        adminApi.getNotifications().catch(() => []),
        adminApi.getLeaderboard().catch(() => []),
        adminApi.getBadges().catch(() => [])
      ]);
      setUsers(uData);
      setProjects(pData);
      setSystemConfig(cfgData);
      setAuditEvents(audData);
      setMongoStatus(mStatus);
      setNotifications(notifsData);
      setLeaderboard(lbData);
      setBadges(bgData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkNotificationRead = async (id: number | string) => {
    try {
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => 
        (String(n.id) === String(id) || (n._id && String(n._id) === String(id))) 
          ? { ...n, readAt: n.readAt || now } 
          : n
      ));
      await adminApi.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || now })));
      await adminApi.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    setCurrentUser(null);
    toast.info('You have safely exited the Admin Console.', 'Session Terminated');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-600">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
          <span>Initializing JG Innovative Hub Administrator Console...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AdminLogin
        onLoginSuccess={user => {
          setCurrentUser(user);
          loadAllAdminData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <AdminNavbar
        currentUser={currentUser}
        onLogout={() => setIsLogoutModalOpen(true)}
        onRefreshAll={loadAllAdminData}
        refreshing={refreshing}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenNotificationsCenter={() => setActiveTab('NOTIFICATIONS')}
      />


      {/* Admin Module Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-red-700 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Control Center:</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'USERS'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. User Lifecycle ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PROJECTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'PROJECTS'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>2. Project Governance ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CONFIG')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'CONFIG'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>3. Operational Parameters</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'AUDIT'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>4. Audit Trail ({auditEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PERSONAL_PROJECTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'PERSONAL_PROJECTS'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>5. Personal Projects</span>
            </button>

            <button
              onClick={() => setActiveTab('HALL_OF_FAME')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'HALL_OF_FAME'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>6. Hall of Fame</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border relative ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>7. Notifications ({notifications.length})</span>
              {notifications.some(n => !n.readAt) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'ATTENDANCE'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>8. Attendance & Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {activeTab === 'USERS' && (
          <UserManagementTab users={users} onUserMutated={loadAllAdminData} />
        )}

        {activeTab === 'PROJECTS' && (
          <ProjectManagementTab projects={projects} users={users} onProjectMutated={loadAllAdminData} />
        )}

        {activeTab === 'CONFIG' && systemConfig && (
          <SystemConfigTab config={systemConfig} onConfigSaved={loadAllAdminData} />
        )}

        {activeTab === 'AUDIT' && (
          <AuditLogTab auditEvents={auditEvents} onAuditEventsChanged={loadAllAdminData} />
        )}

        {activeTab === 'PERSONAL_PROJECTS' && currentUser && (
          <PersonalProjectTracker currentUser={currentUser} />
        )}

        {activeTab === 'HALL_OF_FAME' && currentUser && (
          <HallOfFameTab
            leaderboard={leaderboard}
            badges={badges}
            currentUser={currentUser}
            allUsers={users}
          />
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <NotificationsTab
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            onRefresh={loadAllAdminData}
            onDeleteNotification={(id) => {
              setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
            }}
          />
        )}

        {activeTab === 'ATTENDANCE' && (
          <AttendanceTab
            users={users}
            onUserMutated={loadAllAdminData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-4 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>&copy; 2026 JG INNOVATIVE HUB PVT. LTD. All rights reserved.</span>
        </div>
      </footer>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        currentUser={currentUser}
      />

      {/* Innovation Hall of Fame & Badges Modal */}
      {currentUser && (
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          leaderboard={leaderboard}
          badges={badges}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

