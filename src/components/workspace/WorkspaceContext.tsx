import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace, WorkspaceMember, WorkspacePermissions, WorkspaceContextValue, getRolePermissions } from './types';
import { demoWorkspaces, demoWorkspaceMembers, getUserWorkspaces, getUserRole } from './demo-data';
import { User } from '../auth/types';

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
  currentUser: User | null;
}

export function WorkspaceProvider({ children, currentUser }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspaces when user changes
  useEffect(() => {
    if (currentUser) {
      let userWorkspaces = getUserWorkspaces(currentUser.id);
      
      // If user doesn't have a personal workspace, create one
      let personalWorkspace = userWorkspaces.find(ws => ws.isPersonal && ws.ownerId === currentUser.id);
      if (!personalWorkspace) {
        personalWorkspace = {
          id: `ws_personal_${currentUser.id}`,
          name: 'Personal Workspace',
          description: 'Your personal workspace for individual projects and experiments',
          color: '#007aff',
          icon: '👤',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: currentUser.id,
          isPersonal: true,
          visibility: 'private',
          settings: {
            allowComments: true,
            allowVersionHistory: true,
            requireApproval: false,
            defaultPermission: 'editor',
          },
        };
        userWorkspaces = [personalWorkspace, ...userWorkspaces];
      }
      
      setWorkspaces(userWorkspaces);
      
      // Set personal workspace as default if no workspace is selected
      if (personalWorkspace && !currentWorkspace) {
        setCurrentWorkspace(personalWorkspace);
      }
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setWorkspaceMembers([]);
    }
  }, [currentUser]);

  // Load workspace members when current workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      const members = demoWorkspaceMembers.filter(
        member => member.workspaceId === currentWorkspace.id && member.status === 'active'
      );
      setWorkspaceMembers(members);
    } else {
      setWorkspaceMembers([]);
    }
  }, [currentWorkspace]);

  // Calculate permissions for current user in current workspace
  const permissions: WorkspacePermissions = React.useMemo(() => {
    if (!currentUser || !currentWorkspace) {
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

    const userRole = getUserRole(currentUser.id, currentWorkspace.id);
    if (!userRole) {
      // Public workspace - viewer permissions
      if (currentWorkspace.visibility === 'public') {
        return getRolePermissions('viewer');
      }
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

    return getRolePermissions(userRole as any);
  }, [currentUser, currentWorkspace]);

  const createWorkspace = async (data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newWorkspace: Workspace = {
        ...data,
        id: `ws_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWorkspaces(prev => {
        const updated = [...prev, newWorkspace];
        // Automatically switch to the newly created workspace
        setTimeout(() => setCurrentWorkspace(newWorkspace), 50);
        return updated;
      });
      return newWorkspace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkspace = async (id: string, data: Partial<Workspace>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setWorkspaces(prev => prev.map(ws => 
        ws.id === id 
          ? { ...ws, ...data, updatedAt: new Date() }
          : ws
      ));
      
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(prev => prev ? { ...prev, ...data, updatedAt: new Date() } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkspaces(prev => prev.filter(ws => ws.id !== id));
      
      if (currentWorkspace?.id === id) {
        // Switch to personal workspace or first available
        const remainingWorkspaces = workspaces.filter(ws => ws.id !== id);
        const personalWorkspace = remainingWorkspaces.find(ws => ws.isPersonal && ws.ownerId === currentUser?.id);
        setCurrentWorkspace(personalWorkspace || remainingWorkspaces[0] || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string): Promise<void> => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  const inviteMember = async (email: string, role: any, message?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send an invitation email
      console.log(`Invitation sent to ${email} with role ${role}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: any): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setWorkspaceMembers(prev => prev.map(member =>
        member.id === memberId ? { ...member, role } : member
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setWorkspaceMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPermissions = (userId: string, workspaceId: string): WorkspacePermissions => {
    const userRole = getUserRole(userId, workspaceId);
    if (!userRole) {
      return getRolePermissions('viewer'); // Default for public workspaces
    }
    return getRolePermissions(userRole as any);
  };

  const value: WorkspaceContextValue = {
    currentWorkspace,
    workspaces,
    workspaceMembers,
    permissions,
    isLoading,
    error,
    currentUser,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    getUserPermissions,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}