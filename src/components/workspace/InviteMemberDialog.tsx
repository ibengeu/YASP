import React from 'react';
import { InviteDialog } from '../invite/InviteDialog';
import { CreateInviteRequest, InviteRole } from '../invite/types';
import { useWorkspace } from './WorkspaceContext';
import { WorkspaceRole } from './types';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

/**
 * Workspace member invitation dialog using the comprehensive invite system
 * This provides a simplified interface for workspace-specific invitations
 * while leveraging the full invite infrastructure
 */
export function InviteMemberDialog({ 
  open, 
  onOpenChange, 
  workspaceId 
}: InviteMemberDialogProps) {
  const { inviteMember, currentWorkspace } = useWorkspace();

  // Map invite system roles to workspace roles
  const mapInviteRoleToWorkspaceRole = (inviteRole: InviteRole): WorkspaceRole => {
    const roleMapping: Record<InviteRole, WorkspaceRole> = {
      viewer: 'viewer',
      member: 'editor', // Map 'member' to 'editor' for workspace context
      contributor: 'editor',
      manager: 'admin',
      owner: 'admin', // In workspace context, both owner and admin map to admin
      admin: 'admin'
    };
    return roleMapping[inviteRole] || 'viewer';
  };

  const handleInviteCreated = async (invite: CreateInviteRequest) => {
    try {
      // Use the existing workspace invite method for consistency
      const workspaceRole = mapInviteRoleToWorkspaceRole(invite.role);
      await inviteMember(invite.inviteeEmail, workspaceRole, invite.message);
      
      toast.success('Workspace invitation sent successfully!');
    } catch (error) {
      toast.error('Failed to send workspace invitation');
      throw error; // Re-throw to let InviteDialog handle the error state
    }
  };

  return (
    <InviteDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultScope="workspace"
      defaultScopeId={workspaceId}
      onInviteCreated={handleInviteCreated}
    />
  );
}