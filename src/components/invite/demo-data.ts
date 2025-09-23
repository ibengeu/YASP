import { Invitation, InviteAuditLog, InvitePolicy, InviteStats } from './types';

export const mockInvitations: Invitation[] = [
  {
    id: 'inv-001',
    inviterEmail: 'john.doe@company.com',
    inviterName: 'John Doe',
    inviteeEmail: 'alice.smith@company.com',
    scope: 'workspace',
    scopeId: 'ws-001',
    scopeName: 'API Development Team',
    role: 'contributor',
    status: 'pending',
    token: 'abc123def456',
    expiresAt: '2024-10-15T12:00:00Z',
    createdAt: '2024-10-08T10:30:00Z',
    updatedAt: '2024-10-08T10:30:00Z',
    message: 'Welcome to our API development workspace! Looking forward to collaborating.',
    metadata: {
      domainRestricted: true,
      requiresApproval: false
    }
  },
  {
    id: 'inv-002',
    inviterEmail: 'sarah.wilson@company.com',
    inviterName: 'Sarah Wilson',
    inviteeEmail: 'bob.johnson@external.com',
    scope: 'project',
    scopeId: 'proj-001',
    scopeName: 'Payment API Integration',
    role: 'viewer',
    status: 'accepted',
    token: 'def456ghi789',
    expiresAt: '2024-10-20T12:00:00Z',
    createdAt: '2024-10-05T14:15:00Z',
    updatedAt: '2024-10-06T09:22:00Z',
    acceptedAt: '2024-10-06T09:22:00Z',
    message: 'Please review our payment integration documentation.',
    metadata: {
      domainRestricted: false,
      requiresApproval: true,
      approvedBy: 'admin@company.com',
      approvedAt: '2024-10-05T16:00:00Z'
    }
  },
  {
    id: 'inv-003',
    inviterEmail: 'mike.brown@company.com',
    inviterName: 'Mike Brown',
    inviteeEmail: 'carol.davis@company.com',
    scope: 'workspace',
    scopeId: 'ws-002',
    scopeName: 'QA Testing',
    role: 'member',
    status: 'declined',
    token: 'ghi789jkl012',
    expiresAt: '2024-10-12T12:00:00Z',
    createdAt: '2024-10-03T11:45:00Z',
    updatedAt: '2024-10-04T08:30:00Z',
    declinedAt: '2024-10-04T08:30:00Z',
    message: 'Join our QA team to help test new API features.'
  },
  {
    id: 'inv-004',
    inviterEmail: 'admin@company.com',
    inviterName: 'System Admin',
    inviteeEmail: 'lisa.garcia@company.com',
    scope: 'platform',
    role: 'admin',
    status: 'expired',
    token: 'jkl012mno345',
    expiresAt: '2024-10-01T12:00:00Z',
    createdAt: '2024-09-24T09:00:00Z',
    updatedAt: '2024-10-01T12:00:00Z',
    message: 'Platform administrator access invitation.'
  },
  {
    id: 'inv-005',
    inviterEmail: 'team.lead@company.com',
    inviterName: 'Team Lead',
    inviteeEmail: 'david.kim@company.com',
    scope: 'workspace',
    scopeId: 'ws-001',
    scopeName: 'API Development Team',
    role: 'manager',
    status: 'cancelled',
    token: 'mno345pqr678',
    expiresAt: '2024-10-18T12:00:00Z',
    createdAt: '2024-10-07T16:20:00Z',
    updatedAt: '2024-10-08T11:15:00Z',
    cancelledAt: '2024-10-08T11:15:00Z',
    message: 'Invitation to join as workspace manager.'
  }
];

export const mockAuditLogs: InviteAuditLog[] = [
  {
    id: 'audit-001',
    inviteId: 'inv-001',
    action: 'created',
    performedBy: 'john.doe@company.com',
    performedAt: '2024-10-08T10:30:00Z',
    details: {
      newStatus: 'pending',
      metadata: {
        scope: 'workspace',
        role: 'contributor',
        expirationHours: 168
      }
    }
  },
  {
    id: 'audit-002',
    inviteId: 'inv-001',
    action: 'sent',
    performedBy: 'system',
    performedAt: '2024-10-08T10:31:00Z',
    details: {
      metadata: {
        emailTemplate: 'workspace-invitation',
        deliveryStatus: 'sent'
      }
    }
  },
  {
    id: 'audit-003',
    inviteId: 'inv-002',
    action: 'accepted',
    performedBy: 'bob.johnson@external.com',
    performedAt: '2024-10-06T09:22:00Z',
    details: {
      previousStatus: 'pending',
      newStatus: 'accepted',
      metadata: {
        acceptanceMethod: 'email-link',
        userAgent: 'Mozilla/5.0...'
      }
    }
  },
  {
    id: 'audit-004',
    inviteId: 'inv-003',
    action: 'declined',
    performedBy: 'carol.davis@company.com',
    performedAt: '2024-10-04T08:30:00Z',
    details: {
      previousStatus: 'pending',
      newStatus: 'declined',
      reason: 'Already have access through different workspace'
    }
  },
  {
    id: 'audit-005',
    inviteId: 'inv-005',
    action: 'cancelled',
    performedBy: 'team.lead@company.com',
    performedAt: '2024-10-08T11:15:00Z',
    details: {
      previousStatus: 'pending',
      newStatus: 'cancelled',
      reason: 'Role assignment changed, will send new invitation'
    }
  }
];

export const mockInvitePolicy: InvitePolicy = {
  id: 'policy-001',
  name: 'Standard Company Policy',
  defaultExpirationHours: 168, // 7 days
  domainRestrictions: ['company.com', 'partner.com'],
  maxInvitesPerUser: 10,
  maxInvitesPerTimeWindow: 50,
  timeWindowHours: 24,
  requireManualApproval: false,
  allowedRoles: ['owner', 'manager', 'contributor', 'member', 'viewer'],
  allowedScopes: ['workspace', 'project'],
  emailTemplates: {
    'workspace-invitation': 'You have been invited to join {workspace_name}...',
    'project-invitation': 'You have been invited to collaborate on {project_name}...',
    'platform-invitation': 'Welcome to our API platform...'
  },
  isActive: true,
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2024-10-01T00:00:00Z'
};

export const mockInviteStats: InviteStats = {
  total: 47,
  pending: 12,
  accepted: 28,
  declined: 4,
  expired: 2,
  cancelled: 1,
  byScope: {
    platform: 3,
    workspace: 32,
    project: 12
  },
  byRole: {
    admin: 3,
    owner: 5,
    manager: 8,
    contributor: 15,
    member: 12,
    viewer: 4
  },
  recentActivity: mockAuditLogs.slice(-5)
};

// Helper function to generate mock workspaces for scope selection
export const mockWorkspaces = [
  {
    id: 'ws-001',
    name: 'API Development Team',
    description: 'Core API development and architecture',
    icon: '🚀',
    color: '#0f62fe'
  },
  {
    id: 'ws-002',
    name: 'QA Testing',
    description: 'Quality assurance and testing workflows',
    icon: '🧪',
    color: '#24a148'
  },
  {
    id: 'ws-003',
    name: 'Documentation',
    description: 'API documentation and guides',
    icon: '📚',
    color: '#f1c21b'
  },
  {
    id: 'ws-004',
    name: 'External Partners',
    description: 'Collaboration with external partners',
    icon: '🤝',
    color: '#da1e28'
  }
];

// Helper function to generate mock projects for scope selection
export const mockProjects = [
  {
    id: 'proj-001',
    name: 'Payment API Integration',
    description: 'Stripe payment processing integration',
    workspaceId: 'ws-001',
    workspaceName: 'API Development Team'
  },
  {
    id: 'proj-002',
    name: 'Authentication Service',
    description: 'OAuth 2.0 and JWT authentication',
    workspaceId: 'ws-001',
    workspaceName: 'API Development Team'
  },
  {
    id: 'proj-003',
    name: 'User Management API',
    description: 'User profiles and permissions',
    workspaceId: 'ws-001',
    workspaceName: 'API Development Team'
  },
  {
    id: 'proj-004',
    name: 'Testing Automation',
    description: 'Automated API testing suite',
    workspaceId: 'ws-002',
    workspaceName: 'QA Testing'
  }
];

// Utility functions for working with mock data
export const getInvitationsByStatus = (status: string) => 
  mockInvitations.filter(invite => invite.status === status);

export const getInvitationsByScope = (scope: string) => 
  mockInvitations.filter(invite => invite.scope === scope);

export const getInvitationsByInviter = (inviterEmail: string) => 
  mockInvitations.filter(invite => invite.inviterEmail === inviterEmail);

export const getRecentInvitations = (days: number = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return mockInvitations.filter(invite => 
    new Date(invite.createdAt) >= cutoffDate
  );
};