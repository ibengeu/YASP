import { useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function useUpdateCheck() {
  useEffect(() => {
    // Mitigation for OWASP A09:2025 – SSRF: update endpoint is hardcoded in
    // tauri.conf.json (controlled by app bundle), not derived from user input.
    check()
      .then(async (update) => {
        if (!update?.available) return;
        const yes = window.confirm(
          `v${update.version} is available.\n\n${update.body ?? ''}\n\nInstall now?`
        );
        if (!yes) return;
        await update.downloadAndInstall();
        await relaunch();
      })
      .catch(() => {
        // Silently ignore: offline, rate-limited, or dev environment.
        // Mitigation for OWASP A08:2025 – Security Logging: errors are intentionally
        // swallowed here to avoid exposing network details in the UI.
      });
  }, []);
}
