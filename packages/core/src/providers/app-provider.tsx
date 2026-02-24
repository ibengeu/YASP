/**
 * Application Provider
 * Wraps app with core providers and services initialization
 *
 * Architecture: Initializes DI container and core services
 */

import { useEffect, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { CommandPalette, useCommandPalette } from '@/components/command-palette';
import { container } from '@/core/di/container';
import { idbStorage } from '@/core/storage/idb-storage';
import { eventDispatcher } from '@/core/events/event-dispatcher';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { createLoggingMiddleware } from '@/core/events/middleware/logging-middleware';
import { pluginRegistry } from '@/plugins/core/plugin-registry';

export function AppProvider({ children }: { children: ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  useEffect(() => {
    // Initialize core services
    const initializeServices = async () => {
      try {
        // Register core services in DI container
        container.registerInstance('storage', idbStorage);
        container.registerInstance('events', eventDispatcher);

        // Initialize storage
        await idbStorage.init();

        // Ensure default workspace exists
        await useWorkspaceStore.getState().ensureDefaultWorkspace(idbStorage);

        // Setup event middleware
        eventDispatcher.use(createLoggingMiddleware());

        // Initialize plugin system
        await pluginRegistry.init({
          storage: idbStorage,
          events: eventDispatcher,
          http: null,
          config: null,
          logger: console,
        });

        console.log('[YASP] Core services initialized successfully');
      } catch (error) {
        console.error('[YASP] Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      idbStorage.close();
      eventDispatcher.clear();
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        onGenerateAI={() => {
          // Emit event for dashboard to handle
          eventDispatcher.emit('command:generate-ai', {});
        }}
        onNewSpec={() => {
          // Emit event for dashboard to handle
          eventDispatcher.emit('command:new-spec', {});
        }}
      />
    </ThemeProvider>
  );
}
