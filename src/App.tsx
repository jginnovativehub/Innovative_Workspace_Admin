import React, { useState, useEffect } from 'react';
import { 
  Users, FolderKanban, Settings, FileSearch, 
  Shield, RefreshCw 
} from 'lucide-react';
import { adminApi } from './api';
import { User, Project, SystemConfig, AuditEvent, MongoStatus, NotificationItem } from './types';
import { AdminLogin } from './components/AdminLogin';
import { AdminNavbar } from './components/AdminNavbar';
import { UserManagementTab } from './components/tabs/UserManagementTab';
import { ProjectManagementTab } from './components/tabs/ProjectManagementTab';
import { SystemConfigTab } from './components/tabs/SystemConfigTab';
import { AuditLogTab } from './components/tabs/AuditLogTab';
import { LogoutModal } from './components/LogoutModal';
import { toast } from './context/ToastContext';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'USERS' | 'PROJECTS' | 'CONFIG' | 'AUDIT'>('USERS');

  // Core Data
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    });

    // 2. 5-Second polling sync to guarantee multi-tab data freshness
    const pollInterval = setInterval(async () => {
      try {
        const freshNotifs = await adminApi.getNotifications();
        setNotifications(freshNotifs);
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
      const [uData, pData, cfgData, audData, mStatus, notifsData] = await Promise.all([
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
        adminApi.getNotifications().catch(() => [])
      ]);
      setUsers(uData);
      setProjects(pData);
      setSystemConfig(cfgData);
      setAuditEvents(audData);
      setMongoStatus(mStatus);
      setNotifications(notifsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || now })));
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <AdminNavbar
        currentUser={currentUser}
        onLogout={() => setIsLogoutModalOpen(true)}
        onRefreshAll={loadAllAdminData}
        refreshing={refreshing}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      {/* Admin Module Navigation Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-red-400 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Control Center:</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'USERS'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. User Lifecycle ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PROJECTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'PROJECTS'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>2. Project Governance ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CONFIG')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'CONFIG'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>3. Operational Parameters</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                activeTab === 'AUDIT'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>4. Audit Trail ({auditEvents.length})</span>
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
          <AuditLogTab auditEvents={auditEvents} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 text-xs text-slate-500">
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
    </div>
  );
}
