export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isPersonal: boolean;
  visibility: 'private' | 'team' | 'public';
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowComments: boolean;
  allowVersionHistory: boolean;
  requireApproval: boolean;
  defaultPermission: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: WorkspaceRole;
  joinedAt: Date;
  invitedBy?: string;
  status: 'active' | 'pending' | 'inactive';
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
}

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: WorkspaceAction;
  resourceType?: 'api' | 'collection' | 'environment' | 'member';
  resourceId?: string;
  resourceName?: string;
  details?: string;
  timestamp: Date;
}

export type WorkspaceAction = 
  | 'created_workspace'
  | 'updated_workspace'
  | 'deleted_workspace'
  | 'added_member'
  | 'removed_member'
  | 'updated_member_role'
  | 'added_api'
  | 'updated_api'
  | 'deleted_api'
  | 'created_collection'
  | 'updated_collection'
  | 'deleted_collection'
  | 'added_comment'
  | 'created_environment'
  | 'updated_environment'
  | 'deleted_environment';

export interface WorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canCreateResources: boolean;
  canInviteMembers: boolean;
}

// Utility type for workspace context
export interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  permissions: WorkspacePermissions;
  isLoading: boolean;
  error: string | null;
  currentUser: any | null;
  
  // Actions
  createWorkspace: (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  
  // Member management
  inviteMember: (email: string, role: WorkspaceRole, message?: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: WorkspaceRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  
  // Permissions
  getUserPermissions: (userId: string, workspaceId: string) => WorkspacePermissions;
}

// Helper functions for role permissions
export const getRolePermissions = (role: WorkspaceRole): WorkspacePermissions => {
  switch (role) {
    case 'owner':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canManageSettings: true,
        canCreateResources: true,
        canInviteMembers: true,
      };
    case 'admin':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canManageSettings: false,
        canCreateResources: true,
        canInviteMembers: true,
      };
    case 'editor':
      return {
        canView: true,
        canEdit: true,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
        canCreateResources: true,
        canInviteMembers: false,
      };
    case 'viewer':
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
        canCreateResources: false,
        canInviteMembers: false,
      };
    default:
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
        canCreateResources: false,
        canInviteMembers: false,
      };
  }
};

export const canPerformAction = (userRole: WorkspaceRole, action: keyof WorkspacePermissions): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions[action];
};