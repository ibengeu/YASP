import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Settings,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  FileText,
  Plus,
  Home,
  Search,
} from 'lucide-react';
import { formatName, getInitials } from '../auth/utils';
import { User } from '../auth/types';

/**
 * Carbon Design System Navigation Components
 * 
 * Following Carbon navigation patterns:
 * - Header with global navigation
 * - Side panel navigation (when needed)
 * - User profile menu
 * - Consistent spacing and interaction patterns
 */

interface CarbonHeaderProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onCreateWorkspace: () => void;
}

export function CarbonHeader({ 
  currentUser, 
  onNavigate, 
  onLogout, 
  onCreateWorkspace 
}: CarbonHeaderProps) {
  if (!currentUser) return null;

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">A</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg">API Platform</h1>
            </div>
          </div>
          
          {/* Primary Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="md"
              onClick={() => onNavigate('workspace-dashboard')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => onNavigate('catalog')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              API Catalog
            </Button>
          </nav>
        </div>

        {/* Actions and User Menu */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Create Action */}
          <Button
            variant="primary"
            size="md"
            onClick={onCreateWorkspace}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={formatName(currentUser.firstName, currentUser.lastName)}
                  />
                  <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
                    {getInitials(currentUser.firstName, currentUser.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="font-medium">
                  {formatName(currentUser.firstName, currentUser.lastName)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
              
              <div className="py-2">
                <DropdownMenuItem
                  onClick={() => onNavigate('workspace-dashboard')}
                  className="px-4 py-3 gap-3"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate('catalog')}
                  className="px-4 py-3 gap-3"
                >
                  <FileText className="h-4 w-4" />
                  API Catalog
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onCreateWorkspace}
                  className="px-4 py-3 gap-3"
                >
                  <Plus className="h-4 w-4" />
                  Create Workspace
                  <Badge variant="outline" className="ml-auto">New</Badge>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="py-2">
                <DropdownMenuItem
                  onClick={() => onNavigate('profile')}
                  className="px-4 py-3 gap-3"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate('carbon-demo')}
                  className="px-4 py-3 gap-3"
                >
                  <Settings className="h-4 w-4" />
                  Carbon Demo
                  <Badge variant="secondary" className="ml-auto">Beta</Badge>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="py-2">
                <DropdownMenuItem
                  onClick={onLogout}
                  className="px-4 py-3 gap-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/**
 * Carbon Side Navigation Component
 * For more complex navigation structures
 */
interface CarbonSideNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active?: boolean;
    onClick?: () => void;
    badge?: string;
  }>;
  className?: string;
}

export function CarbonSideNav({ items, className }: CarbonSideNavProps) {
  return (
    <nav className={`w-64 border-r border-border bg-background h-full ${className || ''}`}>
      <div className="p-4">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Button
                variant={item.active ? "secondary" : "ghost"}
                size="md"
                className="w-full justify-start gap-3 h-12 px-4"
                onClick={item.onClick}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="outline" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/**
 * Carbon Breadcrumb Component
 * Following Carbon breadcrumb patterns
 */
interface CarbonBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
  }>;
  className?: string;
}

export function CarbonBreadcrumb({ items, className }: CarbonBreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className || ''}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-muted-foreground">/</span>
          )}
          {item.current ? (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}