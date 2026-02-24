/**
 * WorkflowToolbar - Glass-morphism top toolbar for workflow builder
 * Status dot with glow, editable title, last-run timestamp, Test + Run Flow buttons,
 * overflow dropdown menu with save/export/import/settings
 */

import { useState, useRef } from 'react';
import { Play, Square, Save, Settings, Download, Upload, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { WorkflowDocument, WorkflowAuth } from '../types/workflow.types';
import { exportWorkflow, importWorkflow } from '../services/workflow-io';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface WorkflowToolbarProps {
  workflow: WorkflowDocument;
  isRunning: boolean;
  onNameChange: (name: string) => void;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onSettingsChange: (updates: { serverUrl?: string; sharedAuth?: WorkflowAuth }) => void;
  onImport?: (workflow: Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>) => void;
  lastRunAt?: string;
}

function formatLastRun(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export function WorkflowToolbar({
  workflow,
  isRunning,
  onNameChange,
  onRun,
  onStop,
  onSave,
  onSettingsChange,
  onImport,
  lastRunAt,
}: WorkflowToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportWorkflow(workflow);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importWorkflow(reader.result as string);
        onImport?.(imported);
        toast.success('Workflow imported');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import workflow');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [serverUrl, setServerUrl] = useState(workflow.serverUrl);
  const [authType, setAuthType] = useState<WorkflowAuth['type']>(
    workflow.sharedAuth?.type || 'none'
  );
  const [authToken, setAuthToken] = useState(workflow.sharedAuth?.token || '');
  const [authApiKey, setAuthApiKey] = useState(workflow.sharedAuth?.apiKey || '');

  const handleSaveSettings = () => {
    const auth: WorkflowAuth = { type: authType };
    if (authType === 'bearer') auth.token = authToken;
    if (authType === 'api-key') auth.apiKey = authApiKey;
    onSettingsChange({ serverUrl, sharedAuth: auth });
    setShowSettings(false);
  };

  return (
    <>
      <div className="h-14 px-6 border-b border-border/50 bg-card/30 backdrop-blur flex items-center justify-between shrink-0">
        {/* Left section: status dot + editable name */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-2 h-2 rounded-full shrink-0',
            isRunning
              ? 'bg-primary animate-pulse'
              : 'bg-muted-foreground/30'
          )} />

          <Input
            value={workflow.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-7 w-64 text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-border"
            placeholder="Workflow name"
          />
        </div>

        {/* Right section: last run + Test + Run/Stop + overflow menu */}
        <div className="flex items-center gap-3">
          {/* Last run timestamp */}
          {lastRunAt && (
            <>
              <span className="text-xs text-muted-foreground font-mono hidden lg:block">
                <span>Last run:</span>{' '}
                <span className="text-foreground">{formatLastRun(lastRunAt)}</span>
              </span>
              <div className="h-4 w-px bg-border hidden lg:block" />
            </>
          )}

          {/* Test button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRun}
            disabled={workflow.steps.length === 0 || isRunning}
            className="text-xs border-border/50 bg-card/50 hover:bg-muted"
          >
            Test
          </Button>

          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="text-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onRun}
              disabled={workflow.steps.length === 0}
              className="text-xs bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/5 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Flow
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSave}>
                <Save className="w-3.5 h-3.5" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" />
                Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="w-3.5 h-3.5" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Settings</DialogTitle>
            <DialogDescription>Configure server URL and shared authentication</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs mb-2">Server URL</Label>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <Label className="text-xs mb-2">Shared Auth</Label>
              <Select
                value={authType}
                onValueChange={(v) => setAuthType(v as WorkflowAuth['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {authType === 'bearer' && (
              <div>
                <Label className="text-xs mb-2">Token</Label>
                <Input
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter bearer token"
                />
              </div>
            )}
            {authType === 'api-key' && (
              <div>
                <Label className="text-xs mb-2">API Key</Label>
                <Input
                  value={authApiKey}
                  onChange={(e) => setAuthApiKey(e.target.value)}
                  placeholder="Enter API key"
                />
              </div>
            )}
            <Button onClick={handleSaveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
