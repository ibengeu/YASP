export type InviteScope = 'platform' | 'workspace' | 'project';

export type InviteRole = 
  | 'admin' 
  | 'owner' 
  | 'member' 
  | 'viewer' 
  | 'contributor' 
  | 'manager';

export type InviteStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'expired' 
  | 'cancelled';

export interface Invitation {
  id: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  scope: InviteScope;
  scopeId?: string; // workspace/project ID if applicable
  scopeName?: string; // workspace/project name
  role: InviteRole;
  status: InviteStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  message?: string;
  metadata?: {
    domainRestricted?: boolean;
    requiresApproval?: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
}

export interface InvitePolicy {
  id: string;
  name: string;
  defaultExpirationHours: number;
  domainRestrictions: string[];
  maxInvitesPerUser: number;
  maxInvitesPerTimeWindow: number;
  timeWindowHours: number;
  requireManualApproval: boolean;
  allowedRoles: InviteRole[];
  allowedScopes: InviteScope[];
  emailTemplates: {
    [key: string]: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InviteAuditLog {
  id: string;
  inviteId: string;
  action: 'created' | 'sent' | 'resent' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  performedBy: string;
  performedAt: string;
  details?: {
    previousStatus?: InviteStatus;
    newStatus?: InviteStatus;
    reason?: string;
    metadata?: Record<string, any>;
  };
}

export interface CreateInviteRequest {
  inviteeEmail: string;
  scope: InviteScope;
  scopeId?: string;
  role: InviteRole;
  expirationHours?: number;
  message?: string;
  requireApproval?: boolean;
}

export interface BulkInviteRequest {
  invitations: CreateInviteRequest[];
  useTemplate?: string;
  sendImmediately?: boolean;
}

export interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  byScope: Record<InviteScope, number>;
  byRole: Record<InviteRole, number>;
  recentActivity: InviteAuditLog[];
}

// Permission helpers
export const ROLE_PERMISSIONS = {
  admin: ['manage_platform', 'manage_workspaces', 'manage_users', 'view_all', 'edit_all'],
  owner: ['manage_workspace', 'manage_members', 'manage_settings', 'view_all', 'edit_all'],
  manager: ['manage_members', 'manage_projects', 'view_all', 'edit_all'],
  contributor: ['create_projects', 'edit_own', 'view_all'],
  member: ['view_all', 'comment'],
  viewer: ['view_all']
} as const;

export const SCOPE_HIERARCHY = {
  platform: ['admin'],
  workspace: ['admin', 'owner', 'manager', 'contributor', 'member', 'viewer'],
  project: ['owner', 'manager', 'contributor', 'member', 'viewer']
} as const;

// Role display configuration
export const ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    description: 'Full platform access and user management',
    color: 'destructive',
    icon: '👑'
  },
  owner: {
    label: 'Owner',
    description: 'Full workspace/project control',
    color: 'primary',
    icon: '🔑'
  },
  manager: {
    label: 'Manager',
    description: 'Manage members and projects',
    color: 'warning',
    icon: '👨‍💼'
  },
  contributor: {
    label: 'Contributor',
    description: 'Create and edit content',
    color: 'success',
    icon: '✏️'
  },
  member: {
    label: 'Member',
    description: 'Standard access and collaboration',
    color: 'secondary',
    icon: '👤'
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    color: 'muted',
    icon: '👁️'
  }
} as const;

// Scope display configuration
export const SCOPE_CONFIG = {
  platform: {
    label: 'Platform',
    description: 'Access to the entire platform',
    icon: '🌐'
  },
  workspace: {
    label: 'Workspace',
    description: 'Access to a specific workspace',
    icon: '📁'
  },
  project: {
    label: 'Project',
    description: 'Access to a specific project',
    icon: '📊'
  }
} as const;