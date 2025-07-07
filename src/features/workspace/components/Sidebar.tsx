import React, { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Plus, FileText, Folder, ChevronLeft, ChevronRight } from 'lucide-react';
import { Workspace } from '../WorkspacePage';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspace: string;
  onWorkspaceChange: (id: string) => void;
  onAddWorkspace: (name: string, description: string) => void;
  currentWorkspace?: Workspace;
  activeSpec: string;
  onSpecChange: (id: string) => void;
  onAddSpec: (name: string, format: 'yaml' | 'json') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onAddWorkspace,
  currentWorkspace,
  activeSpec,
  onSpecChange,
  onAddSpec,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecFormat, setNewSpecFormat] = useState<'yaml' | 'json'>('yaml');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);

  const handleAddWorkspace = () => {
    if (newWorkspaceName.trim()) {
      onAddWorkspace(newWorkspaceName.trim(), newWorkspaceDesc.trim());
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setWorkspaceDialogOpen(false);
    }
  };

  const handleAddSpec = () => {
    if (newSpecName.trim()) {
      onAddSpec(newSpecName.trim(), newSpecFormat);
      setNewSpecName('');
      setSpecDialogOpen(false);
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} h-screen bg-card border-r border-border flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-card-foreground mb-1">API Hub</h1>
            <p className="text-sm text-muted-foreground">Workspace Manager</p>
          </div>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Workspaces */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Workspaces
            </h2>
            <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workspace-name">Name</Label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <Label htmlFor="workspace-desc">Description</Label>
                  <Textarea
                    id="workspace-desc"
                    value={newWorkspaceDesc}
                    onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    placeholder="Enter workspace description"
                  />
                </div>
                <Button onClick={handleAddWorkspace} className="w-full">
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className={`p-3 cursor-pointer transition-colors ${
                activeWorkspace === workspace.id
                  ? 'bg-accent border-accent-foreground/20'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onWorkspaceChange(workspace.id)}
            >
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-card-foreground">
                    {workspace.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {workspace.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </div>
      )}

      {/* Collapsed workspace icons */}
      {isCollapsed && (
        <div className="p-2 border-b border-border">
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <Button
                key={workspace.id}
                variant={activeWorkspace === workspace.id ? "default" : "ghost"}
                size="sm"
                className="w-full h-10 p-2"
                onClick={() => onWorkspaceChange(workspace.id)}
                title={workspace.name}
              >
                <Folder className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* API Specifications */}
      {currentWorkspace && !isCollapsed && (
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              API Specs
            </h2>
            <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Specification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="spec-name">Name</Label>
                    <Input
                      id="spec-name"
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      placeholder="Enter API spec name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spec-format">Format</Label>
                    <Select value={newSpecFormat} onValueChange={(value: 'yaml' | 'json') => setNewSpecFormat(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yaml">YAML</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddSpec} className="w-full">
                    Create API Spec
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2">
            {currentWorkspace.apiSpecs.map((spec) => (
              <Card
                key={spec.id}
                className={`p-3 cursor-pointer transition-colors ${
                  activeSpec === spec.id
                    ? 'bg-accent border-accent-foreground/20'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onSpecChange(spec.id)}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-card-foreground">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-muted-foreground uppercase">
                      {spec.format}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            {currentWorkspace.apiSpecs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No API specs yet</p>
                <p className="text-xs text-muted-foreground">Click + to create one</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;