import { useState, useEffect, useCallback } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateState {
  update: Update | null;
  isDownloading: boolean;
  open: boolean;
  dismiss: () => void;
  install: () => Promise<void>;
}

export function useUpdateCheck(): UpdateState {
  const [update, setUpdate] = useState<Update | null>(null);
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // OWASP A09:2025 – SSRF: update endpoint is hardcoded in tauri.conf.json
    // (controlled by the app bundle), never derived from user input.
    check()
      .then((u) => {
        if (u?.available) {
          setUpdate(u);
          setOpen(true);
        }
      })
      .catch(() => {
        // OWASP A08:2025 – Security Logging: errors intentionally swallowed here
        // to avoid exposing network details (offline / rate-limited / dev env).
      });
  }, []);

  const dismiss = useCallback(() => setOpen(false), []);

  const install = useCallback(async () => {
    if (!update) return;
    setIsDownloading(true);
    await update.downloadAndInstall();
    await relaunch();
  }, [update]);

  return { update, isDownloading, open, dismiss, install };
}
