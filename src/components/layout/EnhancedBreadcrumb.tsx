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
  Lock,
  FileText,
  Code,
  Settings as SettingsIcon,
  Activity,
  User as UserIcon
} from 'lucide-react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { AppView } from './AppHeader';

interface BreadcrumbPath {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  view?: AppView;
  href?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

interface EnhancedBreadcrumbProps {
  currentView: AppView;
  currentApi?: {
    id: string;
    title: string;
    version: string;
  };
  currentEndpoint?: {
    id: string;
    path: string;
    method: string;
  };
  onNavigate: (view: AppView) => void;
  className?: string;
}

/**
 * Enhanced Breadcrumb Component
 * 
 * Provides comprehensive navigation context with:
 * - Multi-level hierarchy support
 * - Context-aware path building
 * - Workspace information display
 * - Smart navigation handling
 */
export function EnhancedBreadcrumb({
  currentView,
  currentApi,
  currentEndpoint,
  onNavigate,
  className = '',
}: EnhancedBreadcrumbProps) {
  const { currentWorkspace } = useWorkspace();

  if (!currentWorkspace) {
    return null;
  }

  const getVisibilityIcon = () => {
    switch (currentWorkspace.visibility) {
      case 'public':
        return <Globe className="h-3 w-3 text-success" />;
      case 'team':
        return <Users className="h-3 w-3 text-primary" />;
      default:
        return <Lock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const buildBreadcrumbPath = (): BreadcrumbPath[] => {
    const paths: BreadcrumbPath[] = [
      {
        id: 'workspace',
        label: currentWorkspace.name,
        icon: Home,
        view: 'workspace-dashboard',
      },
    ];

    // Add page-specific paths
    switch (currentView) {
      case 'workspace-dashboard':
        // Dashboard is the root, no additional paths needed
        break;

      case 'catalog':
        paths.push({
          id: 'catalog',
          label: 'API Catalog',
          icon: FileText,
          view: 'catalog',
        });
        break;

      case 'explorer':
        paths.push({
          id: 'catalog',
          label: 'API Catalog',
          icon: FileText,
          view: 'catalog',
        });
        
        if (currentApi) {
          paths.push({
            id: 'api',
            label: currentApi.title,
            icon: Code,
            badge: {
              text: `v${currentApi.version}`,
              variant: 'outline',
            },
          });

          if (currentEndpoint) {
            paths.push({
              id: 'endpoint',
              label: `${currentEndpoint.method.toUpperCase()} ${currentEndpoint.path}`,
              badge: {
                text: currentEndpoint.method.toUpperCase(),
                variant: currentEndpoint.method === 'GET' ? 'default' : 
                         currentEndpoint.method === 'POST' ? 'secondary' :
                         currentEndpoint.method === 'PUT' ? 'outline' : 'destructive',
              },
            });
          }
        }
        break;

      case 'profile':
        paths.push({
          id: 'profile',
          label: 'Profile Settings',
          icon: UserIcon,
        });
        break;

      case 'carbon-demo':
        paths.push({
          id: 'carbon-demo',
          label: 'Design System',
          icon: SettingsIcon,
          badge: {
            text: 'Demo',
            variant: 'secondary',
          },
        });
        break;

      default:
        break;
    }

    return paths;
  };

  const breadcrumbPaths = buildBreadcrumbPath();
  const isLastItem = (index: number) => index === breadcrumbPaths.length - 1;

  const handlePathClick = (path: BreadcrumbPath, index: number) => {
    if (path.view && !isLastItem(index)) {
      onNavigate(path.view);
    }
  };

  return (
    <div className={`border-b border-border bg-background/95 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between py-4 px-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbPaths.map((path, index) => (
              <React.Fragment key={path.id}>
                <BreadcrumbItem>
                  {isLastItem(index) ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {path.icon && <path.icon className="h-4 w-4" />}
                      <span className="font-medium">{path.label}</span>
                      {path.badge && (
                        <Badge variant={path.badge.variant} className="text-xs">
                          {path.badge.text}
                        </Badge>
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => handlePathClick(path, index)}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    >
                      {path.icon && <path.icon className="h-4 w-4" />}
                      {index === 0 ? (
                        // Workspace root with icon
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: currentWorkspace.color || '#0f62fe' }}
                          >
                            {currentWorkspace.icon || '📁'}
                          </div>
                          <span className="font-medium">{path.label}</span>
                        </div>
                      ) : (
                        <span className="font-medium">{path.label}</span>
                      )}
                      {path.badge && (
                        <Badge variant={path.badge.variant} className="text-xs">
                          {path.badge.text}
                        </Badge>
                      )}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                
                {!isLastItem(index) && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Workspace Metadata */}
        <div className="flex items-center gap-2">
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
    </div>
  );
}