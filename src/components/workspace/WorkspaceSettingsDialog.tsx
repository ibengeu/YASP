import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Settings, 
  Trash2, 
  Users, 
  Shield, 
  Loader2, 
  UserPlus,
  MoreVertical,
  Crown,
  Lock,
  Globe,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { motion } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';
import { Workspace, WorkspaceRole } from './types';
import { formatName, getInitials } from '../auth/utils';
import { toast } from 'sonner';
import { InviteMemberDialog } from './InviteMemberDialog';

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

const workspaceColors = [
  '#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de',
  '#5856d6', '#00c7be', '#ff2d92', '#6d6d6d', '#8e8e93'
];

const workspaceIcons = [
  '📁', '💼', '⚡', '🔥', '🚀', '💻', '📊', '🔧', '🎯', '💡',
  '🏢', '👥', '🛡️', '⭐', '❤️', '☕', '🎨', '📱', '🌍', '🔬'
];

export function WorkspaceSettingsDialog({ open, onOpenChange, workspace }: WorkspaceSettingsDialogProps) {
  const { 
    updateWorkspace, 
    deleteWorkspace, 
    workspaceMembers,
    updateMemberRole,
    removeMember,
    permissions,
    isLoading 
  } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007aff',
    icon: '📁',
    visibility: 'private' as 'private' | 'team' | 'public',
    settings: {
      allowComments: true,
      allowVersionHistory: true,
      requireApproval: false,
      defaultPermission: 'editor' as WorkspaceRole,
    },
  });

  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        description: workspace.description || '',
        color: workspace.color || '#007aff',
        icon: workspace.icon || '📁',
        visibility: workspace.visibility,
        settings: workspace.settings,
      });
    }
  }, [workspace]);

  const handleSaveGeneral = async () => {
    try {
      await updateWorkspace(workspace.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        visibility: formData.visibility,
      });
      toast.success('Workspace updated successfully');
    } catch (error) {
      toast.error('Failed to update workspace');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateWorkspace(workspace.id, {
        settings: formData.settings,
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(workspace.id);
      toast.success('Workspace deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete workspace');
    }
  };

  const handleMemberRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success('Member role updated');
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      toast.success('Member removed from workspace');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-600" />;
      case 'editor':
        return <Eye className="h-3 w-3 text-green-600" />;
      default:
        return <Users className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRoleColor = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return {
          icon: Globe,
          title: 'Public',
          description: 'Anyone can discover and view this workspace',
          color: 'text-green-600',
        };
      case 'team':
        return {
          icon: Users,
          title: 'Team',
          description: 'Only invited team members can access',
          color: 'text-blue-600',
        };
      default:
        return {
          icon: Lock,
          title: 'Private',
          description: 'Only you can access this workspace',
          color: 'text-gray-600',
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace Settings
          </DialogTitle>
          <DialogDescription>
            Manage your workspace configuration, members, and permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="flex-1 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="workspace-description">Description</Label>
                <Textarea
                  id="workspace-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <Label>Appearance</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Icon</Label>
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {workspaceIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`h-8 w-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                            formData.icon === icon 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Color</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {workspaceColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`h-8 w-8 rounded-md border-2 transition-all ${
                            formData.color === color 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon}
                  </div>
                  <div>
                    <div className="font-medium">{formData.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.description || 'No description'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-4">
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: 'private' | 'team' | 'public') => 
                    setFormData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['private', 'team', 'public'] as const).map((visibility) => {
                      const info = getVisibilityInfo(visibility);
                      return (
                        <SelectItem key={visibility} value={visibility}>
                          <div className="flex items-center gap-2">
                            <info.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{info.title}</div>
                              <div className="text-xs text-muted-foreground">{info.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-fit">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workspace
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the workspace
                        and all its data, including APIs, collections, and member access.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteWorkspace}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Workspace
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button onClick={handleSaveGeneral} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="flex-1 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Team Members</h3>
                <p className="text-sm text-muted-foreground">
                  Manage who has access to this workspace
                </p>
              </div>
              {permissions.canInviteMembers && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {workspaceMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {formatName(member.firstName, member.lastName)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`${getRoleColor(member.role)} flex items-center gap-1`}
                          >
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </Badge>

                          {permissions.canManageMembers && member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleMemberRoleChange(member.id, 'admin')}
                                  disabled={member.role === 'admin'}
                                >
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMemberRoleChange(member.id, 'editor')}
                                  disabled={member.role === 'editor'}
                                >
                                  Make Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMemberRoleChange(member.id, 'viewer')}
                                  disabled={member.role === 'viewer'}
                                >
                                  Make Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collaboration Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-comments">Allow Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Let team members comment on APIs and collections
                      </p>
                    </div>
                    <Switch
                      id="allow-comments"
                      checked={formData.settings.allowComments}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowComments: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="version-history">Version History</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep track of changes to APIs and documentation
                      </p>
                    </div>
                    <Switch
                      id="version-history"
                      checked={formData.settings.allowVersionHistory}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowVersionHistory: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-approval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require approval before publishing changes
                      </p>
                    </div>
                    <Switch
                      id="require-approval"
                      checked={formData.settings.requireApproval}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, requireApproval: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Default Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>New Member Default Role</Label>
                    <Select
                      value={formData.settings.defaultPermission}
                      onValueChange={(value: WorkspaceRole) => 
                        setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, defaultPermission: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                        <SelectItem value="editor">Editor - Can view and edit</SelectItem>
                        <SelectItem value="admin">Admin - Can manage members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          workspaceId={workspace.id}
        />
      </DialogContent>
    </Dialog>
  );
}