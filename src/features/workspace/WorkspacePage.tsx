
import { useState, useEffect } from "react";
import WorkspaceHeader from "@/features/workspace/components/WorkspaceHeader.tsx";
import Sidebar from "@/features/workspace/components/Sidebar.tsx";
import ApiEditor from "@/features/workspace/components/ApiEditor.tsx";
import DocumentationViewer from "@/features/workspace/components/DocumentationViewer.tsx";
import EmptyState from "@/features/workspace/components/EmptyState.tsx";
import TemplateSelectionDialog from "@/features/workspace/components/TemplateSelectionDialog.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/core/components/ui/resizable";
import { QuickStartTemplate } from "@/features/workspace/templates/quick-start-templates";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  apiSpecs: ApiSpec[];
}

export interface ApiSpec {
  id: string;
  name: string;
  content: string;
  format: 'yaml' | 'json';
}

const Index = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('');
  const [activeSpec, setActiveSpec] = useState<string>('');
  const [viewMode, setViewMode] = useState<'editor' | 'docs' | 'split'>('split');
  
  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedWorkspaces = localStorage.getItem('yasp-workspaces');
      const savedActiveWorkspace = localStorage.getItem('yasp-active-workspace');
      const savedActiveSpec = localStorage.getItem('yasp-active-spec');
      const savedSidebarCollapsed = localStorage.getItem('yasp-sidebar-collapsed');
      
      if (savedWorkspaces) {
        setWorkspaces(JSON.parse(savedWorkspaces));
      }
      if (savedActiveWorkspace) {
        setActiveWorkspace(savedActiveWorkspace);
      }
      if (savedActiveSpec) {
        setActiveSpec(savedActiveSpec);
      }
      if (savedSidebarCollapsed) {
        setSidebarCollapsed(JSON.parse(savedSidebarCollapsed));
      }
    } catch (error) {
      console.error('Failed to load workspace data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('yasp-workspaces', JSON.stringify(workspaces));
    } catch (error) {
      console.error('Failed to save workspaces to localStorage:', error);
    }
  }, [workspaces]);

  useEffect(() => {
    try {
      localStorage.setItem('yasp-active-workspace', activeWorkspace);
    } catch (error) {
      console.error('Failed to save active workspace to localStorage:', error);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    try {
      localStorage.setItem('yasp-active-spec', activeSpec);
    } catch (error) {
      console.error('Failed to save active spec to localStorage:', error);
    }
  }, [activeSpec]);

  useEffect(() => {
    try {
      localStorage.setItem('yasp-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error);
    }
  }, [sidebarCollapsed]);

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentSpec = currentWorkspace?.apiSpecs.find(s => s.id === activeSpec);

  const updateSpecContent = (content: string) => {
    setWorkspaces(prev => prev.map(workspace =>
        workspace.id === activeWorkspace
            ? {
              ...workspace,
              apiSpecs: workspace.apiSpecs.map(spec =>
                  spec.id === activeSpec ? { ...spec, content } : spec
              )
            }
            : workspace
    ));
  };

  const addWorkspace = (name: string, description: string) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name,
      description,
      apiSpecs: []
    };
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspace(newWorkspace.id);
  };

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      addWorkspace(newWorkspaceName.trim(), newWorkspaceDesc.trim());
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setShowWorkspaceDialog(false);
    }
  };

  const handleTemplateSelect = (template: QuickStartTemplate) => {
    // Create workspace from template
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: template.workspace.name,
      description: template.workspace.description,
      apiSpecs: template.specs.map(spec => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        name: spec.name,
        format: spec.format,
        content: spec.content
      }))
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspace(newWorkspace.id);
    
    // Set first spec as active
    if (newWorkspace.apiSpecs.length > 0) {
      setActiveSpec(newWorkspace.apiSpecs[0].id);
    }
  };

  const addApiSpec = (name: string, format: 'yaml' | 'json') => {
    const newSpec: ApiSpec = {
      id: Date.now().toString(),
      name,
      format,
      content: format === 'yaml' ?
          `openapi: 3.0.0\ninfo:\n  title: ${name}\n  version: 1.0.0\npaths: {}` :
          `{"openapi":"3.0.0","info":{"title":"${name}","version":"1.0.0"},"paths":{}}`
    };

    setWorkspaces(prev => prev.map(workspace =>
        workspace.id === activeWorkspace
            ? { ...workspace, apiSpecs: [...workspace.apiSpecs, newSpec] }
            : workspace
    ));
    setActiveSpec(newSpec.id);
  };

  // Show empty state if no workspaces exist
  if (workspaces.length === 0) {
    return (
      <div className="h-screen">
        <EmptyState
          onCreateWorkspace={() => setShowWorkspaceDialog(true)}
          onCreateQuickStart={() => setShowTemplateDialog(true)}
        />
        
        {/* Template Selection Dialog */}
        <TemplateSelectionDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          onSelectTemplate={handleTemplateSelect}
        />
        
        {/* Custom Workspace Dialog */}
        <Dialog open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog}>
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
              <Button onClick={handleCreateWorkspace} className="w-full">
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 64 : 320; // 16 * 4 = 64px, 80 * 4 = 320px

  return (
      <div className="h-screen flex">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full z-10">
          <Sidebar
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onWorkspaceChange={setActiveWorkspace}
              onAddWorkspace={addWorkspace}
              currentWorkspace={currentWorkspace}
              activeSpec={activeSpec}
              onSpecChange={setActiveSpec}
              onAddSpec={addApiSpec}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main content area with left margin for sidebar */}
        <div className="flex-1 flex flex-col h-screen transition-all duration-300" style={{marginLeft: `${sidebarWidth}px`}}>
          {/* Fixed Header */}
          <div className="fixed top-0 right-0 z-10 transition-all duration-300" style={{left: `${sidebarWidth}px`}}>
            <WorkspaceHeader
                workspace={currentWorkspace}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
          </div>

          {/* Scrollable content area with top margin for header */}
          <div className="flex-1 mt-16 overflow-hidden h-full">
            {viewMode === 'editor' && currentSpec && (
                <ApiEditor
                    spec={currentSpec}
                    onContentChange={updateSpecContent}
                />
            )}

            {viewMode === 'docs' && currentSpec && (
                <DocumentationViewer spec={currentSpec} />
            )}

            {viewMode === 'split' && currentSpec && (
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <ApiEditor
                        spec={currentSpec}
                        onContentChange={updateSpecContent}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <DocumentationViewer spec={currentSpec} />
                  </ResizablePanel>
                </ResizablePanelGroup>
            )}

            {!currentSpec && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                      No API specification selected
                    </h2>
                    <p className="text-muted-foreground">
                      Create a new API spec or select an existing one from the sidebar
                    </p>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Index;