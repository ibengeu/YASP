/**
 * ExtractionEditor - Pill + popover for editing variable extractions
 * Shows extraction name as badge; click opens editor with JSONPath + live preview
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariableExtraction } from '../types/workflow.types';
import { previewExtraction, validateJsonPath } from '../services/variable-extraction';

interface ExtractionEditorProps {
  extraction: VariableExtraction;
  lastResponseBody?: any;
  onUpdate?: (updates: Partial<VariableExtraction>) => void;
  onRemove: () => void;
}

export function ExtractionEditor({
  extraction,
  lastResponseBody,
  onUpdate,
  onRemove,
}: ExtractionEditorProps) {
  const [name, setName] = useState(extraction.name);
  const [jsonPath, setJsonPath] = useState(extraction.jsonPath);
  const [open, setOpen] = useState(!extraction.name); // Auto-open if new

  const validation = jsonPath ? validateJsonPath(jsonPath) : { valid: false, error: 'Enter a JSONPath' };
  const preview = lastResponseBody && jsonPath && validation.valid
    ? previewExtraction(lastResponseBody, jsonPath)
    : null;

  const handleSave = () => {
    onUpdate?.({ name, jsonPath });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono',
          'bg-primary/10 text-primary border border-ring/20',
          'hover:bg-primary/20 transition-colors cursor-pointer',
          !extraction.name && 'border-dashed'
        )}>
          {extraction.name || 'new var'}
          <X
            className="w-2.5 h-2.5 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Variable Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="e.g. auth_token"
              className="h-7 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">JSONPath Expression</Label>
            <Input
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              placeholder="$.data.access_token"
              className={cn(
                'h-7 text-xs font-mono mt-1',
                jsonPath && !validation.valid && 'border-destructive'
              )}
            />
            {jsonPath && !validation.valid && (
              <p className="text-xs text-destructive mt-0.5">{validation.error}</p>
            )}
          </div>

          {/* Live preview */}
          {preview && (
            <div className="bg-muted rounded-md p-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              {preview.error ? (
                <p className="text-xs text-destructive mt-0.5">{preview.error}</p>
              ) : (
                <pre className="text-xs font-mono text-foreground mt-0.5 truncate">
                  {typeof preview.value === 'object'
                    ? JSON.stringify(preview.value)
                    : String(preview.value)}
                </pre>
              )}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name || !jsonPath || !validation.valid}
            className="w-full text-xs"
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
