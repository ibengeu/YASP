/**
 * Application Provider
 * Wraps app with core providers and services initialization
 *
 * Architecture: Initializes DI container and core services
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { CommandPalette, useCommandPalette } from '@/components/command-palette';
import { container } from '@/core/di/container';
import { idbStorage } from '@/core/storage/idb-storage';
import { eventDispatcher } from '@/core/events/event-dispatcher';
import { createLoggingMiddleware } from '@/core/events/middleware/logging-middleware';
import { pluginRegistry } from '@/plugins/core/plugin-registry';

export function AppProvider({ children }: { children: ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  useEffect(() => {
    // Initialize core services
    const initializeServices = async () => {
      try {
        // Register core services in DI container
        container.registerInstance('storage', idbStorage);
        container.registerInstance('events', eventDispatcher);

        // Initialize storage
        await idbStorage.init();

        // Setup event middleware
        eventDispatcher.use(createLoggingMiddleware());

        // Initialize plugin system
        await pluginRegistry.init({
          storage: idbStorage,
          events: eventDispatcher,
          http: null, // TODO: Initialize HTTP client
          config: null, // TODO: Load config
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
          setShowGenerateDialog(true);
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
