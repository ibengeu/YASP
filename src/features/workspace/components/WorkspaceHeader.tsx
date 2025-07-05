import React from 'react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Code, FileText, SplitSquareHorizontal, Settings, Share } from 'lucide-react';
import {Workspace} from "@/features/workspace/WorkspacePage.tsx";

interface WorkspaceHeaderProps {
  workspace?: Workspace;
  viewMode: 'editor' | 'docs' | 'split';
  onViewModeChange: (mode: 'editor' | 'docs' | 'split') => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
                                                           workspace,
                                                           viewMode,
                                                           onViewModeChange
                                                         }) => {
  if (!workspace) {
    return (
        <div className="h-16 border-b border-border bg-card flex items-center px-6 w-full">
          <div className="text-lg font-semibold text-muted-foreground">
            Select a workspace to get started
          </div>
        </div>
    );
  }

  return (
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 w-full">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">
              {workspace.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {workspace.description}
            </p>
          </div>
          <Badge variant="secondary">
            {workspace.apiSpecs.length} API{workspace.apiSpecs.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
                size="sm"
                variant={viewMode === 'editor' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('editor')}
                className="h-8 px-3"
            >
              <Code className="h-4 w-4 mr-1" />
              Editor
            </Button>
            <Button
                size="sm"
                variant={viewMode === 'split' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('split')}
                className="h-8 px-3"
            >
              <SplitSquareHorizontal className="h-4 w-4 mr-1" />
              Split
            </Button>
            <Button
                size="sm"
                variant={viewMode === 'docs' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('docs')}
                className="h-8 px-3"
            >
              <FileText className="h-4 w-4 mr-1" />
              Docs
            </Button>
          </div>

          {/* Action Buttons */}
          <Button size="sm" variant="outline">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
  );
};

export default WorkspaceHeader;