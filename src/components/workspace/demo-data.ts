import { Workspace, WorkspaceMember, WorkspaceActivity } from './types';

export const demoWorkspaces: Workspace[] = [
  {
    id: 'ws_personal_001',
    name: 'My Personal Workspace',
    description: 'Personal projects and experiments',
    color: '#007aff',
    icon: '👤',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    ownerId: 'user_001',
    isPersonal: true,
    visibility: 'private',
    settings: {
      allowComments: true,
      allowVersionHistory: true,
      requireApproval: false,
      defaultPermission: 'editor',
    },
  },
  {
    id: 'ws_team_001',
    name: 'Frontend Team APIs',
    description: 'APIs used by the frontend development team',
    color: '#34c759',
    icon: '💻',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
    ownerId: 'user_001',
    isPersonal: false,
    visibility: 'team',
    settings: {
      allowComments: true,
      allowVersionHistory: true,
      requireApproval: true,
      defaultPermission: 'viewer',
    },
  },
  {
    id: 'ws_project_001',
    name: 'E-commerce Platform',
    description: 'APIs for the new e-commerce platform project',
    color: '#ff9500',
    icon: '🛒',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-23'),
    ownerId: 'user_002',
    isPersonal: false,
    visibility: 'team',
    settings: {
      allowComments: true,
      allowVersionHistory: true,
      requireApproval: false,
      defaultPermission: 'editor',
    },
  },
  {
    id: 'ws_public_001',
    name: 'Open Source APIs',
    description: 'Publicly available APIs for the community',
    color: '#af52de',
    icon: '🌍',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-21'),
    ownerId: 'user_003',
    isPersonal: false,
    visibility: 'public',
    settings: {
      allowComments: true,
      allowVersionHistory: false,
      requireApproval: true,
      defaultPermission: 'viewer',
    },
  },
];

export const demoWorkspaceMembers: WorkspaceMember[] = [
  // Frontend Team APIs members
  {
    id: 'member_001',
    workspaceId: 'ws_team_001',
    userId: 'user_001',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: undefined,
    role: 'owner',
    joinedAt: new Date('2024-01-10'),
    status: 'active',
  },
  {
    id: 'member_002',
    workspaceId: 'ws_team_001',
    userId: 'user_004',
    email: 'sarah.wilson@company.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    avatar: undefined,
    role: 'admin',
    joinedAt: new Date('2024-01-12'),
    invitedBy: 'user_001',
    status: 'active',
  },
  {
    id: 'member_003',
    workspaceId: 'ws_team_001',
    userId: 'user_005',
    email: 'mike.chen@company.com',
    firstName: 'Mike',
    lastName: 'Chen',
    avatar: undefined,
    role: 'editor',
    joinedAt: new Date('2024-01-15'),
    invitedBy: 'user_001',
    status: 'active',
  },
  {
    id: 'member_004',
    workspaceId: 'ws_team_001',
    userId: 'user_006',
    email: 'emily.brown@company.com',
    firstName: 'Emily',
    lastName: 'Brown',
    avatar: undefined,
    role: 'viewer',
    joinedAt: new Date('2024-01-18'),
    invitedBy: 'user_004',
    status: 'active',
  },
  // E-commerce Platform members
  {
    id: 'member_005',
    workspaceId: 'ws_project_001',
    userId: 'user_002',
    email: 'jane.smith@company.com',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: undefined,
    role: 'owner',
    joinedAt: new Date('2024-01-05'),
    status: 'active',
  },
  {
    id: 'member_006',
    workspaceId: 'ws_project_001',
    userId: 'user_001',
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: undefined,
    role: 'admin',
    joinedAt: new Date('2024-01-08'),
    invitedBy: 'user_002',
    status: 'active',
  },
  {
    id: 'member_007',
    workspaceId: 'ws_project_001',
    userId: 'user_007',
    email: 'alex.johnson@company.com',
    firstName: 'Alex',
    lastName: 'Johnson',
    avatar: undefined,
    role: 'editor',
    joinedAt: new Date('2024-01-10'),
    invitedBy: 'user_002',
    status: 'active',
  },
];

export const demoWorkspaceActivity: WorkspaceActivity[] = [
  {
    id: 'activity_001',
    workspaceId: 'ws_team_001',
    userId: 'user_005',
    userName: 'Mike Chen',
    action: 'added_api',
    resourceType: 'api',
    resourceId: 'api_001',
    resourceName: 'User Authentication API',
    details: 'Added new API for user authentication',
    timestamp: new Date('2024-01-23T10:30:00Z'),
  },
  {
    id: 'activity_002',
    workspaceId: 'ws_team_001',
    userId: 'user_004',
    userName: 'Sarah Wilson',
    action: 'added_member',
    resourceType: 'member',
    resourceId: 'member_004',
    resourceName: 'Emily Brown',
    details: 'Invited Emily Brown as viewer',
    timestamp: new Date('2024-01-22T14:15:00Z'),
  },
  {
    id: 'activity_003',
    workspaceId: 'ws_project_001',
    userId: 'user_007',
    userName: 'Alex Johnson',
    action: 'updated_api',
    resourceType: 'api',
    resourceId: 'api_002',
    resourceName: 'Product Catalog API',
    details: 'Updated endpoint documentation',
    timestamp: new Date('2024-01-22T09:45:00Z'),
  },
  {
    id: 'activity_004',
    workspaceId: 'ws_team_001',
    userId: 'user_001',
    userName: 'John Doe',
    action: 'created_collection',
    resourceType: 'collection',
    resourceId: 'collection_001',
    resourceName: 'Authentication Flows',
    details: 'Created new collection for auth workflows',
    timestamp: new Date('2024-01-21T16:20:00Z'),
  },
  {
    id: 'activity_005',
    workspaceId: 'ws_project_001',
    userId: 'user_002',
    userName: 'Jane Smith',
    action: 'updated_workspace',
    details: 'Updated workspace settings',
    timestamp: new Date('2024-01-21T11:10:00Z'),
  },
];

// Helper function to get user's workspaces
export const getUserWorkspaces = (userId: string): Workspace[] => {
  return demoWorkspaces.filter(workspace => {
    if (workspace.isPersonal && workspace.ownerId === userId) {
      return true;
    }
    
    if (!workspace.isPersonal) {
      const isMember = demoWorkspaceMembers.some(
        member => member.workspaceId === workspace.id && member.userId === userId && member.status === 'active'
      );
      return isMember || workspace.visibility === 'public';
    }
    
    return false;
  });
};

// Helper function to get workspace members
export const getWorkspaceMembers = (workspaceId: string): WorkspaceMember[] => {
  return demoWorkspaceMembers.filter(member => 
    member.workspaceId === workspaceId && member.status === 'active'
  );
};

// Helper function to get user's role in workspace
export const getUserRole = (userId: string, workspaceId: string): string | null => {
  const member = demoWorkspaceMembers.find(
    member => member.workspaceId === workspaceId && member.userId === userId && member.status === 'active'
  );
  return member?.role || null;
};

// Helper function to get workspace activity
export const getWorkspaceActivity = (workspaceId: string, limit: number = 10): WorkspaceActivity[] => {
  return demoWorkspaceActivity
    .filter(activity => activity.workspaceId === workspaceId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};