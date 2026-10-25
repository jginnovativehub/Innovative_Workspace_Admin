export type UserRole = 'ADMIN' | 'CEO' | 'COO' | 'EMPLOYEE';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  active: boolean;
  xp: number;
  level: number;
  streakCount: number;
  avatarTitle: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Project {
  id: number;
  _id?: string;
  code: string;
  name: string;
  title?: string;
  objective: string;
  description?: string;
  scope?: string;
  deliverables?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED' | 'DRAFT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate: string;
  targetDate?: string;
  targetEndDate?: string;
  ownerId?: number;
  ownerName?: string;
  leadId?: number;
  leadName?: string;
  members?: any[];
  milestones?: any[];
  milestonesCount?: number;
  tasksCount?: number;
  completedMilestones?: number;
  completedTasks?: number;
  progressPercentage?: number;
  progressPercent?: number;
  isArchived?: boolean;
}

export interface SystemConfig {
  id: number;
  reportingWeekStart: string;
  reportingDeadlineDay: string;
  reportingDeadlineTime: string;
  companyTimezone: string;
  maxFileSizeMb: number;
  retentionDays: number;
}

export interface AuditEvent {
  id: number;
  actorId: number | null;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: number;
  beforeSummary: string | null;
  afterSummary: string | null;
  reason: string | null;
  timestamp: string;
}

export interface MongoStatus {
  connected: boolean;
  dbName: string | null;
  message: string;
  hasConfiguredUri: boolean;
}

export interface NotificationItem {
  id: number;
  recipientId?: number;
  recipientRole?: string;
  type: string;
  title: string;
  body: string;
  targetType?: string;
  targetId?: number;
  readAt?: string;
  createdAt: string;
}


