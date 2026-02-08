/**
 * Command Palette Component
 * Global keyboard shortcut interface (Cmd+K)
 * Linear-inspired quick actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles,
  Settings,
  Home,
  Plus,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateAI?: () => void;
  onNewSpec?: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  open,
  onOpenChange,
  onGenerateAI,
  onNewSpec,
}: CommandPaletteProps) {
  const navigate = useNavigate();

  // Define all available commands
  const navigationCommands: Command[] = [
    {
      id: 'nav-home',
      label: 'Go to Library',
      icon: <Home className="h-4 w-4" />,
      shortcut: '⌘H',
      action: () => {
        navigate('/');
        onOpenChange(false);
      },
      keywords: ['home', 'library', 'dashboard'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        navigate('/settings');
        onOpenChange(false);
      },
      keywords: ['settings', 'preferences', 'config'],
    },
  ];

  const actionCommands: Command[] = [
    {
      id: 'action-generate',
      label: 'Generate with AI',
      icon: <Sparkles className="h-4 w-4" />,
      shortcut: '⌘G',
      action: () => {
        onGenerateAI?.();
        onOpenChange(false);
      },
      keywords: ['generate', 'ai', 'create', 'catalyst'],
    },
    {
      id: 'action-new',
      label: 'New Specification',
      icon: <Plus className="h-4 w-4" />,
      shortcut: '⌘N',
      action: () => {
        onNewSpec?.();
        onOpenChange(false);
      },
      keywords: ['new', 'create', 'spec', 'specification'],
    },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Quick actions and navigation"
    >
      <CommandInput
        placeholder="Type a command or search..."
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          {actionCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Cmd+G to trigger generate (when palette is closed)
      if (e.key === 'g' && (e.metaKey || e.ctrlKey) && !open) {
        e.preventDefault();
        // Return action type for parent component to handle
        return 'generate-ai';
      }

      // Cmd+N to trigger new spec (when palette is closed)
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !open) {
        e.preventDefault();
        return 'new-spec';
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  return { open, setOpen };
}
