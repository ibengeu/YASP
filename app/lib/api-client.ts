import { Invitation, InviteAuditLog, InvitePolicy, InviteStats } from '@/components/invite/types';
import { OpenAPISpec, CatalogStatistics } from '@/components/catalog/types';
import { Workspace, WorkspaceMember, WorkspaceActivity } from '@/components/workspace/types';
import { Notification } from '@/components/notifications/types';

const demoWorkspaces: Workspace[] = [
    {
        id: '1',
        name: 'Engineering',
        description: 'Main engineering workspace for core platform development.',
        icon: 'Rocket',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPersonal: false,
        visibility: 'team',
        type: 'team',
        settings: {
            allowComments: true,
            allowVersionHistory: true,
            requireApproval: false,
            defaultPermission: 'viewer'
        }
    },
    {
        id: '2',
        name: 'Product',
        description: 'Product management and design workspace.',
        icon: 'Coffee',
        ownerId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPersonal: false,
        visibility: 'team',
        type: 'team',
        settings: {
            allowComments: true,
            allowVersionHistory: true,
            requireApproval: false,
            defaultPermission: 'viewer'
        }
    }
];

const demoWorkspaceMembers: WorkspaceMember[] = [
    {
        id: 'm1',
        workspaceId: '1',
        userId: 'user-1',
        email: 'admin@yasp.dev',
        firstName: 'Admin',
        lastName: 'User',
        role: 'owner',
        joinedAt: new Date(),
        status: 'active'
    }
];

const demoWorkspaceActivity: WorkspaceActivity[] = [
    {
        id: 'a1',
        workspaceId: '1',
        userId: 'user-1',
        userName: 'Admin User',
        userAvatar: '',
        action: 'updated_workspace',
        resourceType: 'member',
        resourceId: '1',
        resourceName: 'Engineering',
        timestamp: new Date(),
        details: 'Updated workspace settings'
    }
];

const mockInvitations: Invitation[] = [
    {
        id: 'inv-1',
        inviterEmail: 'admin@yasp.dev',
        inviterName: 'Admin',
        inviteeEmail: 'newuser@example.com',
        scope: 'workspace',
        scopeId: '1',
        role: 'member',
        status: 'pending',
        token: 'tok-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const mockInvitePolicy: InvitePolicy = {
    id: 'pol-1',
    name: 'Default Policy',
    defaultExpirationHours: 48,
    domainRestrictions: [],
    maxInvitesPerUser: 50,
    maxInvitesPerTimeWindow: 100,
    timeWindowHours: 24,
    requireManualApproval: false,
    allowedRoles: ['member', 'viewer'],
    allowedScopes: ['workspace'],
    emailTemplates: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const mockInviteStats: InviteStats = {
    total: 10,
    pending: 5,
    accepted: 3,
    declined: 1,
    expired: 1,
    cancelled: 0,
    byScope: { platform: 0, workspace: 10, project: 0 },
    byRole: { admin: 0, owner: 0, manager: 0, contributor: 0, member: 8, viewer: 2 },
    recentActivity: []
};

const demoOpenAPISpecs: OpenAPISpec[] = [
    {
        id: 'spec-1',
        workspaceId: '1',
        title: 'Payment Gateway API',
        description: 'Core payment processing API supporting multiple providers.',
        version: 'v1.2.0',
        servers: [{ url: 'https://api.payments.yasp.dev', description: 'Production' }],
        paths: {},
        tags: [],
        fileName: 'payments.yaml',
        fileFormat: 'yaml',
        fileSize: 124000,
        originalContent: '{"openapi": "3.0.0", "info": {"title": "Payment API", "version": "1.0.0"}, "paths": {}}',
        status: 'published',
        validationStatus: 'valid',
        validationErrors: [],
        versionHistory: [],
        currentVersionId: 'v1',
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'workspace',
        permissions: { canView: [], canEdit: [], canDelete: [], canDownload: [], canManageVersions: [] },
        downloadCount: 0,
        lastDownloadedAt: undefined,
        owner: {
            id: 'user-1',
            email: 'admin@yasp.dev',
            firstName: 'Admin',
            lastName: 'User',
            avatar: '',
            role: 'owner',
            emailVerified: true,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        },
        auditLogs: []
    }
];

const demoCatalogStatistics: CatalogStatistics = {
    totalSpecs: 1,
    specsByStatus: { draft: 0, validating: 0, validation_failed: 0, pending_approval: 0, published: 1, archived: 0, deprecated: 0 },
    specsByValidation: { pending: 0, validating: 0, valid: 1, invalid: 0, warnings: 0 },
    specsByWorkspace: [{ workspaceId: '1', name: 'Engineering', count: 1 }],
    recentActivity: [],
    topDownloaded: [],
    validationIssues: { total: 0, byType: {}, bySeverity: { error: 0, warning: 0, info: 0 } }
};

class ApiClient {
    private simulateDelay<T>(data: T, ms = 800): Promise<T> {
        return new Promise((resolve) => setTimeout(() => resolve(data), ms));
    }

    async getInvitations(): Promise<Invitation[]> {
        return this.simulateDelay(mockInvitations);
    }

    async getInviteStats(): Promise<InviteStats> {
        return this.simulateDelay(mockInviteStats);
    }

    async getInvitePolicy(): Promise<InvitePolicy> {
        return this.simulateDelay(mockInvitePolicy);
    }

    async getInviteAuditLogs(): Promise<InviteAuditLog[]> {
        return this.simulateDelay([]);
    }

    async sendInvitation(data: any): Promise<void> {
        await this.simulateDelay(null, 1200);
        console.log('API: Invitation sent', data);
    }

    async getWorkspaces(): Promise<Workspace[]> {
        return this.simulateDelay(demoWorkspaces);
    }

    async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
        return this.simulateDelay(demoWorkspaceMembers.filter(m => m.workspaceId === workspaceId));
    }

    async getWorkspaceActivity(workspaceId: string, limit = 10): Promise<WorkspaceActivity[]> {
        return this.simulateDelay(demoWorkspaceActivity.filter(a => a.workspaceId === workspaceId).slice(0, limit));
    }

    async getApiSpecs(workspaceId?: string): Promise<OpenAPISpec[]> {
        let specs = demoOpenAPISpecs;
        if (workspaceId) {
            specs = specs.filter(s => s.workspaceId === workspaceId);
        }
        return this.simulateDelay(specs);
    }

    async addApiSpec(data: Partial<OpenAPISpec>): Promise<OpenAPISpec> {
        const newSpec: OpenAPISpec = {
            id: `spec-${Date.now()}`,
            workspaceId: data.workspaceId || '1',
            owner: {
                id: 'user-1',
                email: 'admin@yasp.dev',
                firstName: 'Admin',
                lastName: 'User',
                avatar: '',
                role: 'owner',
                emailVerified: true,
                twoFactorEnabled: false,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            },
            title: data.title || 'Untitled API',
            description: data.description || '',
            version: data.version || '1.0.0',
            servers: data.servers || [],
            paths: data.paths || {},
            tags: data.tags || [],
            fileName: data.fileName || 'spec.json',
            fileFormat: data.fileFormat || 'json',
            fileSize: data.fileSize || 0,
            originalContent: data.originalContent || '',
            status: data.status || 'draft',
            validationStatus: 'pending',
            validationErrors: [],
            versionHistory: [],
            currentVersionId: 'v1',
            createdAt: new Date(),
            updatedAt: new Date(),
            visibility: data.visibility || 'workspace',
            permissions: { canView: [], canEdit: [], canDelete: [], canDownload: [], canManageVersions: [] },
            downloadCount: 0,
            auditLogs: []
        };
        demoOpenAPISpecs.push(newSpec);
        return this.simulateDelay(newSpec);
    }

    async getCatalogStats(): Promise<CatalogStatistics> {
        return this.simulateDelay(demoCatalogStatistics);
    }

    async getNotifications(): Promise<Notification[]> {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                type: 'success',
                title: 'API Updated Successfully',
                message: 'Payment Service API v2.1.0 has been updated with new endpoints.',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                read: false,
                actionUrl: '/catalog',
                actionLabel: 'View API'
            },
            {
                id: '2',
                type: 'warning',
                title: 'Workspace Storage Warning',
                message: 'Your workspace is approaching its storage limit (85% used).',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                read: false,
                actionUrl: '/settings',
                actionLabel: 'Manage Storage'
            }
        ];
        return this.simulateDelay(mockNotifications);
    }
}

export const apiClient = new ApiClient();
