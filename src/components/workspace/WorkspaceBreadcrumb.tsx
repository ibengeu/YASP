import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { 
  Home, 
  ChevronRight,
  Globe,
  Users,
  Lock
} from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

interface WorkspaceBreadcrumbProps {
  currentPage?: string;
  onNavigate?: (path: string) => void;
}

export function WorkspaceBreadcrumb({ currentPage = 'catalog', onNavigate }: WorkspaceBreadcrumbProps) {
  const { currentWorkspace } = useWorkspace();

  if (!currentWorkspace) {
    return null;
  }

  const getVisibilityIcon = () => {
    switch (currentWorkspace.visibility) {
      case 'public':
        return <Globe className="h-3 w-3 text-green-600" />;
      case 'team':
        return <Users className="h-3 w-3 text-blue-600" />;
      default:
        return <Lock className="h-3 w-3 text-gray-600" />;
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const pageLabels = {
    catalog: 'API Catalog',
    dashboard: 'Dashboard',
    explorer: 'API Explorer',
    settings: 'Settings',
    members: 'Members',
    activity: 'Activity',
  };

  return (
    <div className="flex items-center gap-4 py-3 px-8 border-b border-border/30 bg-background/95 backdrop-blur-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => handleNavigate('dashboard')}
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            >
              <div 
                className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: currentWorkspace.color || '#007aff' }}
              >
                {currentWorkspace.icon || '📁'}
              </div>
              <span className="font-medium">{currentWorkspace.name}</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {currentPage !== 'dashboard' && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {pageLabels[currentPage as keyof typeof pageLabels] || currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2 ml-auto">
        {getVisibilityIcon()}
        <Badge variant="outline" className="text-xs capitalize">
          {currentWorkspace.visibility}
        </Badge>
        {currentWorkspace.isPersonal && (
          <Badge variant="secondary" className="text-xs">
            Personal
          </Badge>
        )}
      </div>
    </div>
  );
}