import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@yasp/core/components/ui/dialog';
import { Button } from '@yasp/core/components/ui/button';
import type { UpdateState } from '../hooks/useUpdateCheck';

export function UpdateDialog({ state }: { state: UpdateState }) {
  const { update, open, isDownloading, dismiss, install } = state;

  if (!update) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Update available — v{update.version}</DialogTitle>
          <DialogDescription>
            A new version of YASP is ready to install.
          </DialogDescription>
        </DialogHeader>

        {update.body && (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto rounded border border-slate-100 p-3">
            {update.body}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={dismiss} disabled={isDownloading}>
            Later
          </Button>
          <Button onClick={install} disabled={isDownloading}>
            {isDownloading ? 'Installing…' : 'Install & Restart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
