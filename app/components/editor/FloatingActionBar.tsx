import { useState, useRef, useEffect } from 'react';
import { BookOpen, FileCode, Maximize2, Minimize2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { animate } from 'animejs';

// Mitigation for OWASP A04:2025 – Insecure Design: Component follows secure design patterns
// with proper state management and event handling

interface FloatingActionBarProps {
  activeTab: 'editor' | 'docs';
  isMaximized: boolean;
  isSaving: boolean;
  hasChanges?: boolean;
  onTabChange: (tab: 'editor' | 'docs') => void;
  onToggleMaximize: () => void;
  onSave: () => void;
}

/**
 * FloatingActionBar Component
 * Mobile-first vertical FAB anchored to bottom-right corner
 * Provides thumb-friendly access to Editor/Docs tabs and context actions
 *
 * Features:
 * - Collapsed/expanded states with smooth animations
 * - Keyboard navigation (Escape, Enter, Arrow keys)
 * - Focus management and accessibility
 */
export function FloatingActionBar({
  activeTab,
  isMaximized,
  isSaving,
  hasChanges = true,
  onTabChange,
  onToggleMaximize,
  onSave,
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandedViaKeyboard = useRef(false);

  // Expand menu
  const expand = () => {
    setIsExpanded(true);

    // Animate menu items with stagger
    if (menuRef.current) {
      const menuButtons = menuRef.current.querySelectorAll('.fab-menu-item');
      animate(menuButtons, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.8, 1],
        duration: 300,
        delay: (_, index) => index * 50,
        easing: 'cubicBezier(0.4, 0.0, 0.2, 1)',
      });
    }
  };

  // Collapse menu
  const collapse = () => {
    if (menuRef.current) {
      const menuButtons = menuRef.current.querySelectorAll('.fab-menu-item');
      const menuButtonsArray = Array.from(menuButtons);
      animate(menuButtons, {
        opacity: [1, 0],
        translateY: [0, 20],
        scale: [1, 0.8],
        duration: 200,
        delay: (_, index) => (menuButtonsArray.length - 1 - index) * 30,
        easing: 'cubicBezier(0.4, 0.0, 1, 1)',
        onComplete: () => {
          setIsExpanded(false);
          // Return focus to primary button
          primaryButtonRef.current?.focus();
        },
      });
    } else {
      setIsExpanded(false);
      primaryButtonRef.current?.focus();
    }
  };

  // Handle hover to expand
  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Expand after a short delay
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isExpanded) {
        expand();
      }
    }, 200);
  };

  // Handle mouse leave to collapse
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Collapse after a short delay
    hoverTimeoutRef.current = setTimeout(() => {
      if (isExpanded) {
        collapse();
      }
    }, 300);
  };

  // Handle primary button click (still works for touch devices)
  const handlePrimaryClick = () => {
    if (isSaving) return;

    expandedViaKeyboard.current = true; // Mark as keyboard interaction
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle menu item click
  const handleMenuItemClick = (action: () => void) => {
    action();
    collapse();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const menuItems = menuItemsRef.current.filter((item): item is HTMLButtonElement => item !== null);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % menuItems.length;
      menuItems[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + menuItems.length) % menuItems.length;
      menuItems[prevIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      collapse();
    }
  };

  // Handle global Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        collapse();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Focus first menu item on expand (only for keyboard navigation, not hover)
  useEffect(() => {
    if (isExpanded && expandedViaKeyboard.current && menuItemsRef.current[0]) {
      setTimeout(() => {
        menuItemsRef.current[0]?.focus();
      }, 50);
    }
    // Reset the flag when collapsing
    if (!isExpanded) {
      expandedViaKeyboard.current = false;
    }
  }, [isExpanded]);

  return (
    <>
      {/* FAB Container */}
      <div
        ref={containerRef}
        className="fixed bottom-8 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Expanded Menu */}
        {isExpanded && (
          <div
            ref={menuRef}
            id="fab-menu"
            role="menu"
            aria-orientation="vertical"
            className="flex flex-col gap-2"
          >
            {/* Primary Action - Save */}
            <Button
              ref={(el) => {
                menuItemsRef.current[0] = el;
              }}
              variant="default"
              size="default"
              role="menuitem"
              aria-label="Save Changes"
              disabled={!hasChanges}
              className="fab-menu-item min-w-[110px] sm:min-w-[120px] h-12 justify-start gap-2 shadow-lg cursor-pointer"
              onClick={() => handleMenuItemClick(onSave)}
              onKeyDown={(e) => handleKeyDown(e, 0)}
            >
              <Save className="w-4 h-4" />
              {hasChanges ? 'Save' : 'No Changes'}
            </Button>

            {/* Docs Tab */}
            <Button
              ref={(el) => {
                menuItemsRef.current[1] = el;
              }}
              variant="secondary"
              size="default"
              role="menuitem"
              aria-label="Switch to Documentation"
              className={cn(
                'fab-menu-item min-w-[110px] sm:min-w-[120px] h-12 justify-start gap-2 shadow-lg',
                activeTab === 'docs' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleMenuItemClick(() => onTabChange('docs'))}
              onKeyDown={(e) => handleKeyDown(e, 1)}
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </Button>

            {/* Editor Tab */}
            <Button
              ref={(el) => {
                menuItemsRef.current[2] = el;
              }}
              variant="secondary"
              size="default"
              role="menuitem"
              aria-label="Switch to Editor"
              className={cn(
                'fab-menu-item min-w-[110px] sm:min-w-[120px] h-12 justify-start gap-2 shadow-lg',
                activeTab === 'editor' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleMenuItemClick(() => onTabChange('editor'))}
              onKeyDown={(e) => handleKeyDown(e, 2)}
            >
              <FileCode className="w-4 h-4" />
              Editor
            </Button>

            {/* Maximize Toggle */}
            <Button
              ref={(el) => {
                menuItemsRef.current[3] = el;
              }}
              variant="secondary"
              size="default"
              role="menuitem"
              aria-label={isMaximized ? 'Minimize Editor' : 'Expand Editor'}
              className="fab-menu-item min-w-[110px] sm:min-w-[120px] h-12 justify-start gap-2 shadow-lg cursor-pointer"
              onClick={() => handleMenuItemClick(onToggleMaximize)}
              onKeyDown={(e) => handleKeyDown(e, 3)}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isMaximized ? 'Minimize' : 'Expand'}
            </Button>
          </div>
        )}

        {/* Primary Action Button */}
        <Button
          ref={primaryButtonRef}
          size="icon"
          disabled={isSaving}
          aria-label={
            isSaving
              ? 'Saving...'
              : isExpanded
              ? 'Close menu'
              : 'Save Changes'
          }
          aria-haspopup="menu"
          aria-expanded={isExpanded}
          aria-controls="fab-menu"
          className={cn(
            'w-14 h-14 rounded-full shadow-2xl transition-transform cursor-pointer',
            isExpanded && 'rotate-45'
          )}
          onClick={handlePrimaryClick}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
        </Button>
      </div>
    </>
  );
}
