import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';
import {
  Settings,
  LogOut,
  User as UserIcon,
  Search,
  Plus,
  Menu,
  LayoutDashboard,
  ChevronDown,
  Bell,
  Users,
  Home,
  Globe,
  Command,
  Check,
  Lock,
  FileText,
  Moon,
  Sun,
} from 'lucide-react';
import { formatName, getInitials } from '../auth/utils';
import { User } from '../auth/types';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { NotificationSystem } from '../notifications/NotificationSystem';
import { InviteDialog } from '../invite/InviteDialog';
import { useCarbonTheme } from '../carbon/CarbonProvider';

/**
 * Carbon Design System Header Component
 * 
 * Follows Carbon header patterns with:
 * - Consistent 48px height (3rem)
 * - Global navigation structure
 * - Proper spacing and typography
 * - Responsive behavior with mobile menu
 * - Clear information hierarchy
 */

export type AppView = 
  | "landing"
  | "auth" 
  | "catalog"
  | "openapi-catalog"
  | "explorer"
  | "profile"
  | "carbon-demo"
  | "workspace-dashboard"
  | "invite-management";

interface AppHeaderProps {
  currentUser: User | null;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onCreateWorkspace: () => void;
  className?: string;
}

/**
 * Workspace Switcher Wrapper
 * 
 * Safely renders WorkspaceSwitcher only when workspace context is available
 */
function WorkspaceSwitcherWrapper({ currentView }: { currentView: AppView }) {
  // Only render for workspace views
  if (currentView !== 'workspace-dashboard' && currentView !== 'catalog' && currentView !== 'openapi-catalog' && currentView !== 'explorer') {
    return null;
  }

  try {
    return <WorkspaceSwitcher className="w-full" />;
  } catch (error) {
    // If workspace context is not available, don't render anything
    return null;
  }
}

/**
 * Enhanced Workspace Dropdown Component
 * 
 * Features:
 * - Search bar when >5 workspaces
 * - Flat list structure (no nesting)
 * - Visual emphasis for selected workspace
 * - Team vs Personal grouping
 * - Keyboard navigation for search
 * - Create Workspace button at bottom
 */
function WorkspaceDropdown({ 
  currentView, 
  onCreateWorkspace 
}: { 
  currentView: AppView; 
  onCreateWorkspace: () => void; 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock workspace data - in real app this would come from context
  const mockWorkspaces = [
    { id: '1', name: 'Personal Workspace', type: 'personal', isSelected: true, icon: '👤', color: '#007aff' },
    { id: '2', name: 'Team Alpha', type: 'team', isSelected: false, icon: '🚀', color: '#28a745' },
    { id: '3', name: 'Project Beta', type: 'team', isSelected: false, icon: '⚡', color: '#dc3545' },
    { id: '4', name: 'Development', type: 'team', isSelected: false, icon: '🔧', color: '#6f42c1' },
    { id: '5', name: 'Marketing APIs', type: 'team', isSelected: false, icon: '📊', color: '#fd7e14' },
    { id: '6', name: 'Client Project X', type: 'team', isSelected: false, icon: '🎯', color: '#20c997' },
  ];

  const filteredWorkspaces = mockWorkspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const personalWorkspaces = filteredWorkspaces.filter(w => w.type === 'personal');
  const teamWorkspaces = filteredWorkspaces.filter(w => w.type === 'team');
  const selectedWorkspace = mockWorkspaces.find(w => w.isSelected);
  const showSearch = mockWorkspaces.length > 5;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showSearch]);

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // TODO: Focus first workspace item
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    // TODO: Implement workspace switching
    console.log('Switching to workspace:', workspaceId);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className="h-9 px-3 font-medium text-sm gap-1 cursor-pointer"
        >
          Workspaces
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        {/* Search Bar (if >5 workspaces) */}
        {showSearch && (
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 h-8 bg-background border-border cursor-text"
              />
            </div>
          </div>
        )}

        {/* Workspace List */}
        <div className="max-h-80 overflow-y-auto">
          {/* Personal Workspaces */}
          {personalWorkspaces.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Personal
                </span>
              </div>
              {personalWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace.id)}
                  className={`
                    mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${workspace.isSelected 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-secondary/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: workspace.color }}
                    >
                      {workspace.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${workspace.isSelected ? 'text-primary' : ''}`}>
                          {workspace.name}
                        </span>
                        {workspace.isSelected && (
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Separator */}
          {personalWorkspaces.length > 0 && teamWorkspaces.length > 0 && (
            <Separator className="my-2" />
          )}

          {/* Team Workspaces */}
          {teamWorkspaces.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Team
                </span>
              </div>
              {teamWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace.id)}
                  className={`
                    mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${workspace.isSelected 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-secondary/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: workspace.color }}
                    >
                      {workspace.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${workspace.isSelected ? 'text-primary' : ''}`}>
                          {workspace.name}
                        </span>
                        {workspace.isSelected && (
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredWorkspaces.length === 0 && searchQuery && (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <p className="text-sm">No workspaces found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>

        {/* Create Workspace Button */}
        <div className="border-t border-border p-2">
          <Button
            onClick={() => {
              onCreateWorkspace();
              setIsOpen(false);
            }}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-9 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onCreateWorkspace,
  className = '',
}: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { toggleTheme, isDark } = useCarbonTheme();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render header for unauthenticated pages
  if (!currentUser || currentView === 'landing' || currentView === 'auth') {
    return null;
  }

  const isCurrentView = (view: AppView) => currentView === view;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border bg-background ${className}`}>
      <div className="flex h-12 items-center gap-4 px-4 w-full max-w-none">
        
        {/* Left Zone: Brand and Navigation */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Brand */}
          <button 
            onClick={() => onNavigate('openapi-catalog')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center bg-primary rounded-sm">
              <span className="text-xs font-semibold text-primary-foreground">Y</span>
            </div>
            <span className="font-semibold text-sm hidden sm:inline">YASP</span>
          </button>
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0 cursor-pointer">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-4 pt-4">
                {/* Brand in mobile menu */}
                <button 
                  onClick={() => onNavigate('openapi-catalog')}
                  className="flex items-center gap-3 px-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center bg-primary rounded-sm">
                    <span className="text-xs font-semibold text-primary-foreground">Y</span>
                  </div>
                  <span className="font-semibold text-sm">YASP</span>
                </button>
                
                {/* Workspace Switcher for Mobile */}
                <div className="px-2">
                  <WorkspaceSwitcherWrapper currentView={currentView} />
                </div>
                
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-1">
                  {/* Navigation items can be added here if needed */}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Enhanced Workspaces Dropdown */}
            <WorkspaceDropdown 
              currentView={currentView}
              onCreateWorkspace={onCreateWorkspace}
            />
          </nav>
        </div>

        {/* Right Zone: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Invite Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
            className="h-8 px-3 font-medium text-sm gap-2 cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 rounded-sm cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationSystem />

          {/* User Menu with Settings and Upgrade */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm cursor-pointer"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={formatName(currentUser.firstName, currentUser.lastName)}
                  />
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                    {getInitials(currentUser.firstName, currentUser.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium text-xs">
                  {formatName(currentUser.firstName, currentUser.lastName)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>
              
              {/* Profile */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => onNavigate('profile')}
                  className="px-3 py-2 gap-2 cursor-pointer text-xs"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Profile Settings
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Settings & Management */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => onNavigate('invite-management')}
                  className="px-3 py-2 gap-2 cursor-pointer text-xs"
                >
                  <Users className="h-3.5 w-3.5" />
                  Invite Management
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate('carbon-demo')}
                  className="px-3 py-2 gap-2 cursor-pointer text-xs"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-3 py-2 gap-2 cursor-pointer text-xs text-warning focus:text-warning focus:bg-warning/10"
                >
                  <span className="h-3.5 w-3.5 flex items-center justify-center text-warning">⭐</span>
                  Upgrade Plan
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={onLogout}
                  className="px-3 py-2 gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Invite Dialog */}
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteCreated={(invite) => {
          console.log('Invite created:', invite);
          // In a real app, this would create the invite
        }}
      />
    </header>
  );
}