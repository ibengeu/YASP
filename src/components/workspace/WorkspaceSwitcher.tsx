import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  Users, 
  Lock,
  Globe,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import { WorkspaceSettingsDialog } from './WorkspaceSettingsDialog';
import { Workspace } from './types';

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { 
    currentWorkspace, 
    workspaces, 
    permissions,
    switchWorkspace 
  } = useWorkspace();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showWorkspacesDialog, setShowWorkspacesDialog] = useState(false);

  const handleWorkspaceSelect = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
  };

  const getVisibilityIcon = (workspace: Workspace) => {
    switch (workspace.visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />;
      case 'team':
        return <Users className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = (workspace: Workspace) => {
    switch (workspace.visibility) {
      case 'public':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'team':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!currentWorkspace) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          className="w-full justify-between h-10 px-3 border-border/50 hover:bg-secondary/50 cursor-default"
          disabled
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-gray-200 text-gray-500 flex-shrink-0">
              👤
            </div>
            <div className="min-w-0 text-left">
              <div className="font-medium truncate text-muted-foreground">No Workspace</div>
            </div>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 px-3 border-border/50 hover:bg-secondary/50 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="h-6 w-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: currentWorkspace.color || '#007aff' }}
              >
                {currentWorkspace.icon || '📁'}
              </div>
              <div className="min-w-0 text-left">
                <div className="font-medium truncate">{currentWorkspace.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {getVisibilityIcon(currentWorkspace)}
                  <span className="capitalize">{currentWorkspace.visibility}</span>
                  {currentWorkspace.isPersonal && (
                    <>
                      <span>•</span>
                      <span>Personal</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className="w-80 rounded-xl border-border/50 card-shadow-lg p-0"
        >
          {/* Current Workspace Header */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: currentWorkspace.color || '#007aff' }}
                >
                  {currentWorkspace.icon || '📁'}
                </div>
                <span className="font-medium text-sm">{currentWorkspace.name}</span>
              </div>
              {permissions.canManageSettings && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsDialog(true)}
                  className="h-7 w-7 p-0 hover:bg-secondary/50"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Workspace List */}
          <div className="max-h-60 overflow-y-auto overflow-x-hidden">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                className={`p-4 cursor-pointer rounded-none hover:bg-secondary/50 focus:bg-secondary/50 ${
                  workspace.id === currentWorkspace.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div 
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: workspace.color || '#007aff' }}
                  >
                    {workspace.icon || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate text-sm">{workspace.name}</span>
                      {workspace.id === currentWorkspace.id && (
                        <Badge variant="secondary" className="text-xs py-0 px-1.5 shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {getVisibilityIcon(workspace)}
                      <span className="capitalize">{workspace.visibility}</span>
                      {workspace.isPersonal && (
                        <>
                          <span>•</span>
                          <span>Personal</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-border/30" />
          
          {/* Actions */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={() => setShowCreateDialog(true)}
              className="p-3 cursor-pointer rounded-lg hover:bg-secondary/50 focus:bg-secondary/50 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </DropdownMenuItem>
            
            {workspaces.length > 3 && (
              <DropdownMenuItem
                onClick={() => setShowWorkspacesDialog(true)}
                className="p-3 cursor-pointer rounded-lg hover:bg-secondary/50 focus:bg-secondary/50 text-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Workspaces
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      {permissions.canManageSettings && (
        <WorkspaceSettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          workspace={currentWorkspace}
        />
      )}

      {/* All Workspaces Dialog */}
      <Dialog open={showWorkspacesDialog} onOpenChange={setShowWorkspacesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-8">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">All Workspaces</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <motion.div
                  key={workspace.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card 
                    className={`cursor-pointer transition-all border-border/50 hover:border-primary/30 hover:card-shadow-sm ${
                      workspace.id === currentWorkspace.id ? 'border-primary/50 bg-primary/5' : 'hover:bg-secondary/30'
                    }`}
                    onClick={() => {
                      handleWorkspaceSelect(workspace.id);
                      setShowWorkspacesDialog(false);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: workspace.color || '#007aff' }}
                        >
                          {workspace.icon || '📁'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium truncate text-base">{workspace.name}</h4>
                            {workspace.id === currentWorkspace.id && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          {workspace.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {workspace.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getVisibilityColor(workspace)}`}>
                              {getVisibilityIcon(workspace)}
                              <span className="capitalize">{workspace.visibility}</span>
                            </div>
                            {workspace.isPersonal && (
                              <Badge variant="outline" className="text-xs">
                                Personal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}