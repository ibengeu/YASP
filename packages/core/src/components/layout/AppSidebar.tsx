import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search, LayoutDashboard, FolderOpen, Star,
  ChevronDown, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_USER_PROFILE } from '@/lib/constants';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useThemeStore } from '@/stores/theme-store';
import { idbStorage } from '@/core/storage/idb-storage';
import { pressAnimation, staggerFadeIn } from '@/lib/animations';

export type SidebarView = 'workbench' | 'collections';

interface AppSidebarProps {
  onOpenCommandPalette: () => void;
  onSelectSpec: (specId: string) => void;
  onNavigate: (view: SidebarView) => void;
  activeView: SidebarView;
}

export function AppSidebar({
  onOpenCommandPalette,
  onSelectSpec,
  onNavigate,
  activeView,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [favorites, setFavorites] = useState<Array<{ id: string; title: string }>>([]);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const navItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const favoritesRef = useRef<(HTMLButtonElement | null)[]>([]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Stagger animate nav items on mount
  useEffect(() => {
    const validRefs = navItemsRef.current.filter((ref): ref is HTMLButtonElement => ref !== null);
    if (validRefs.length > 0) {
      staggerFadeIn(validRefs, 30);
    }
  }, []);

  // Stagger animate favorites when they change
  useEffect(() => {
    const validRefs = favoritesRef.current.filter((ref): ref is HTMLButtonElement => ref !== null);
    if (validRefs.length > 0) {
      staggerFadeIn(validRefs, 30);
    }
  }, [favorites]);

  const loadFavorites = async () => {
    try {
      const ids = await idbStorage.getFavoriteSpecIds();
      const specs: Array<{ id: string; title: string }> = [];
      for (const id of ids) {
        const spec = await idbStorage.getSpec(id);
        if (spec) specs.push({ id: spec.id, title: spec.title });
      }
      setFavorites(specs);
    } catch {
      // Silently fail — favorites are non-critical
    }
  };

  // Expose refresh for parent to call after toggling a favorite
  (AppSidebar as any).refreshFavorites = loadFavorites;

  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    pressAnimation(e.currentTarget);
  };

  const navItems = [
    {
      label: 'Search',
      icon: Search,
      onClick: onOpenCommandPalette,
      shortcut: '\u2318K',
    },
    {
      label: 'Workbench',
      icon: LayoutDashboard,
      onClick: () => {
        if (!location.pathname.startsWith('/catalog')) navigate('/catalog');
        onNavigate('workbench');
      },
      active: activeView === 'workbench',
    },
    {
      label: 'Collections',
      icon: FolderOpen,
      onClick: () => {
        if (!location.pathname.startsWith('/catalog')) navigate('/catalog');
        onNavigate('collections');
      },
      active: activeView === 'collections',
    },
  ];

  return (
    <aside className="w-[240px] border-r border-border/50 bg-gradient-to-b from-card to-card/80 backdrop-blur-xl flex flex-col h-full shrink-0">
      {/* Workspace Switcher */}
      <div className="p-3 border-b border-primary/10 bg-primary/5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            onMouseDown={handlePress}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                <span className="text-xs font-bold text-primary">
                  {(activeWorkspace?.name ?? 'W')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                {activeWorkspace?.name ?? 'Workspace'}
              </span>
            </div>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-all',
              showWorkspaceMenu && 'rotate-180'
            )} />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-primary/20 rounded-md shadow-lg z-50 py-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(ws.id);
                    setShowWorkspaceMenu(false);
                  }}
                  onMouseDown={handlePress}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm transition-all cursor-pointer',
                    ws.id === activeWorkspaceId
                      ? 'bg-primary/15 text-primary font-semibold border-l-2 border-primary'
                      : 'text-foreground hover:bg-primary/8'
                  )}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, index) => (
          <div key={item.label}>
            {/* Separator before Invite Team */}
            {index === navItems.length - 1 && (
              <div data-testid="sidebar-separator" className="my-2 mx-2 border-t border-primary/10" />
            )}
            <button
              ref={el => { navItemsRef.current[index] = el; }}
              type="button"
              onClick={item.onClick}
              onMouseDown={handlePress}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all cursor-pointer',
                item.active
                  ? 'bg-primary/15 text-primary font-semibold shadow-sm border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/8'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', item.active && 'text-primary')} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.shortcut && (
                <kbd className="text-xs text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          </div>
        ))}

        {/* Separator before Favorites */}
        <div data-testid="sidebar-separator" className="my-2 mx-2 border-t border-primary/10" />

        {/* Favorites Section */}
        <div className="pt-1">
          <div className="px-2.5 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          </div>
          {favorites.length === 0 ? (
            <p className="px-2.5 text-xs text-muted-foreground py-1 font-medium">
              Star specs to pin them here
            </p>
          ) : (
            <div className="space-y-0.5">
              {favorites.map((fav, idx) => {
                const colors = ['bg-amber-500', 'bg-green-500', 'bg-chart-1', 'bg-accent', 'bg-primary'];
                const dotColor = colors[idx % colors.length];
                return (
                  <button
                    ref={el => { favoritesRef.current[idx] = el; }}
                    key={fav.id}
                    type="button"
                    onClick={() => onSelectSpec(fav.id)}
                    onMouseDown={handlePress}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-foreground hover:text-primary hover:bg-primary/8 transition-all cursor-pointer group font-medium"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 shadow-sm`} />
                    <span className="truncate text-left">{fav.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-primary/10 bg-primary/3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 border border-primary/20">
            <span className="text-xs font-bold text-primary">
              {DEFAULT_USER_PROFILE.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {DEFAULT_USER_PROFILE.name}
            </p>
            <p className="text-xs text-primary/60 truncate font-medium">
              {DEFAULT_USER_PROFILE.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            onMouseDown={handlePress}
            className="text-primary/70 hover:text-primary transition-colors cursor-pointer p-1"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
