/**
 * WorkflowToolbar - Top toolbar for workflow builder
 * Shows workflow name, run/stop/save buttons, back navigation
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Play, Square, Save, Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface WorkflowToolbarProps {
  workflow: WorkflowDocument;
  isRunning: boolean;
  onNameChange: (name: string) => void;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onSettingsChange: (updates: { serverUrl?: string; sharedAuth?: WorkflowAuth }) => void;
  onImport?: (workflow: Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>) => void;
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
}: WorkflowToolbarProps) {
  const navigate = useNavigate();
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
    // Reset file input so same file can be re-imported
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
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/catalog`)}
            className="text-xs text-muted-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>

          <div className="h-4 w-px bg-border" />

          <Input
            value={workflow.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-7 w-48 text-sm font-medium border-transparent hover:border-border focus:border-border"
            placeholder="Workflow name"
          />
        </div>

        <div className="flex items-center gap-2">
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
              className="text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleExport}
            title="Export workflow"
          >
            <Download className="w-4 h-4 text-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => fileInputRef.current?.click()}
            title="Import workflow"
          >
            <Upload className="w-4 h-4 text-foreground" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 text-foreground" />
          </Button>
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
