import { Shield, Moon, Sun, LayoutDashboard, Library, FileCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

const navModules = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'API governance metrics and insights',
  },
  {
    id: 'catalog',
    label: 'API Catalog',
    path: '/catalog',
    icon: Library,
    description: 'Browse and manage API specifications',
  },
  {
    id: 'policies',
    label: 'Policy Management',
    path: '/quality-rules',
    icon: FileCheck,
    description: 'Configure governance policies',
  },
];

/**
 * CommandDeck - Fixed navigation header
 * Features:
 * - Fixed header with z-index management
 * - Logo with Shield icon (YASP branding)
 * - Three modules: Dashboard, API Catalog, Policy Management
 * - Dark mode toggle button
 * - Active state indicators
 */
export function CommandDeck() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useThemeStore();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-card border-b border-border"
      style={{ zIndex: 'var(--z-navigation)' }}
    >
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-card-foreground tracking-tight">
              YASP
            </span>
          </div>

          {/* Navigation Modules */}
          <div className="hidden md:flex items-center gap-1">
            {navModules.map((module) => {
              const Icon = module.icon;
              const active = isActive(module.path);

              return (
                <button
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={module.description}
                >
                  <Icon className="w-4 h-4" />
                  {module.label}
                </button>
              );
            })}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-1 overflow-x-auto">
          {navModules.map((module) => {
            const Icon = module.icon;
            const active = isActive(module.path);

            return (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                {module.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
