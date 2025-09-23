import React from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { LayoutDashboard, Settings, Users, Plus, MoreHorizontal } from 'lucide-react';
import { AppView } from './AppHeader';

/**
 * Quick Actions Component
 * 
 * Provides quick access to key actions and pages when breadcrumbs are not available.
 * Shows as a dropdown menu with essential navigation options.
 */

interface QuickActionsProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onCreateWorkspace: () => void;
  className?: string;
}

export function QuickActions({ currentView, onNavigate, onCreateWorkspace, className = '' }: QuickActionsProps) {
  const actions = [
    {
      id: 'dashboard',
      label: 'Workspace Dashboard',
      icon: LayoutDashboard,
      action: () => onNavigate('workspace-dashboard'),
      show: currentView !== 'workspace-dashboard',
    },
    {
      id: 'catalog',
      label: 'API Catalog',
      icon: Plus,
      action: () => onNavigate('catalog'),
      show: currentView !== 'catalog',
    },
    {
      id: 'create-workspace',
      label: 'Create Workspace',
      icon: Plus,
      action: onCreateWorkspace,
      show: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => console.log('Navigate to settings'),
      show: true,
    },
  ].filter(action => action.show);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className}`}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Quick actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={action.action}
            className="gap-2 cursor-pointer"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}