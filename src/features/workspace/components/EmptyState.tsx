import React from 'react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Folder, FileText, Code, Zap, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateWorkspace: () => void;
  onCreateQuickStart: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateWorkspace, onCreateQuickStart }) => {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Code className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to API Workspace
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Create, edit, and manage your OpenAPI specifications in a powerful, intuitive environment.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={onCreateQuickStart}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Quick Start</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start with a pre-built template to get up and running quickly
              </p>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={onCreateWorkspace}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Folder className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Custom Workspace</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new workspace from scratch and organize your APIs
              </p>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </div>
          </Card>
        </div>

        {/* How it works */}
        <div className="space-y-6 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold text-foreground">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="font-medium text-foreground">1. Create Workspace</h3>
              <p className="text-sm text-muted-foreground">
                Organize your API projects in dedicated workspaces
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="font-medium text-foreground">2. Add API Specs</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage OpenAPI specifications in YAML or JSON
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Code className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="font-medium text-foreground">3. Edit & Document</h3>
              <p className="text-sm text-muted-foreground">
                Use the built-in editor and live documentation viewer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;