import { Shield, Moon, Sun, Library } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

const navModules = [
  {
    id: 'catalog',
    label: 'API Catalog',
    path: '/catalog',
    icon: Library,
    description: 'Browse and manage API specifications',
  },
];

/**
 * CommandDeck - Fixed navigation header
 * Features:
 * - Fixed header with z-index management
 * - Logo with Shield icon (YASP branding)
 * - API Catalog navigation
 * - Breadcrumbs for current page (e.g., API Catalog / Collection Name)
 * - Dark mode toggle button
 * - Active state indicators
 */
export function CommandDeck() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useThemeStore();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Determine if we should show breadcrumbs (on editor page)
  const isEditorPage = location.pathname.startsWith('/editor/');

  // Get collection name from URL or state (you'll need to pass this via state or context)
  // For now, we'll show a placeholder
  const getCollectionName = () => {
    // This will be updated when the editor passes the spec title
    return 'Collection';
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40"
    >
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo and Navigation Modules (Left Side) */}
          <div className="flex items-center gap-6">
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
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out',
                      active
                        ? 'bg-accent text-accent-foreground scale-[1.02]'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105'
                    )}
                    title={module.description}
                  >
                    <Icon className="w-4 h-4" />
                    {module.label}
                  </button>
                );
              })}
            </div>

            {/* Breadcrumbs - Show on editor page */}
            {isEditorPage && (
              <div className="hidden md:flex items-center gap-2 text-sm ml-2">
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium" id="editor-breadcrumb-title">
                  {getCollectionName()}
                </span>
              </div>
            )}
          </div>

          {/* Spacer to push dark mode toggle to the right */}
          <div className="flex-1" />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ease-out hover:scale-110 active:scale-95"
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
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap',
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
