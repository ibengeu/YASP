
import { useState } from "react";
import WorkspaceHeader from "@/features/workspace/components/WorkspaceHeader.tsx";
import Sidebar from "@/features/workspace/components/Sidebar.tsx";
import ApiEditor from "@/features/workspace/components/ApiEditor.tsx";
import DocumentationViewer from "@/features/workspace/components/DocumentationViewer.tsx";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/core/components/ui/resizable";

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
          />
        </div>

        {/* Main content area with left margin for sidebar */}
        <div className="flex-1 flex flex-col ml-80 h-screen">
          {/* Fixed Header */}
          <div className="fixed top-0 right-0 z-10" style={{left: '320px'}}>
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