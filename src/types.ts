export type UserRole = 'ADMIN' | 'CEO' | 'COO' | 'EMPLOYEE';

export interface Badge {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
  awardedAt?: string;
  reason?: string;
}

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
  badges?: Badge[];
  createdAt: string;
  lastLogin?: string;
}

export interface LeaderboardUser {
  id: number;
  fullName: string;
  role: string;
  department: string;
  xp: number;
  level: number;
  streakCount: number;
  avatarTitle: string;
  completedTasksCount: number;
  badgesCount: number;
  rank: number;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  sequence: number;
  ownerId?: number;
  ownerName?: string;
  reviewerId?: number;
  reviewerName?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'BLOCKED' | 'SUBMITTED_FOR_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED_COMPLETED' | 'CANCELLED';
  startDate: string;
  dueDate: string;
  acceptanceCriteria: string;
  acceptedAt?: string;
  evidenceNotes?: string;
  evidenceUrl?: string;
  xpReward: number;
  projectName?: string;
  predecessorIds?: number[];
  tasks?: any[];
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

export interface PersonalTask {
  id: string | number;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: string;
}

export interface PersonalMilestone {
  id: string | number;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export interface PersonalProject {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  startDate?: string;
  targetDate?: string;
  milestones: PersonalMilestone[];
  tasks: PersonalTask[];
  notes?: string;
  completedMilestones?: number;
  completedTasks?: number;
  totalMilestones?: number;
  totalTasks?: number;
  progressPercentage?: number;
  createdAt: string;
  updatedAt?: string;
}



