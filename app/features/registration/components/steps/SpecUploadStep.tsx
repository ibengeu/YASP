/**
 * SpecUploadStep - Spec upload section of the registration form
 *
 * Allows users to upload, paste, or fetch OpenAPI specifications.
 * Auto-parses on upload, paste blur, and URL fetch.
 * Spec is required for registration.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  ClipboardPaste,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';

import type { UseFormSetValue } from 'react-hook-form';

export interface SpecUploadStepProps {
  formData: RegistrationFormData;
  setValue: UseFormSetValue<RegistrationFormData>;
  onSpecParsed: (content: string, sourceUrl?: string) => Promise<void>;
  isParsingSpec: boolean;
}

export function SpecUploadStep({
  formData,
  setValue,
  onSpecParsed,
  isParsingSpec,
}: SpecUploadStepProps) {
  const [pastedContent, setPastedContent] = useState('');
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mitigation for OWASP A03:2025 - Injection: Validate file type
    if (!file.name.match(/\.(yaml|yml|json)$/i)) {
      toast.error('Invalid file type. Please upload a YAML or JSON file.');
      return;
    }

    // Mitigation for OWASP A03:2025 - Injection: Limit file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsImporting(true);
    try {
      const content = await file.text();
      setValue('openapiSpec', {
        source: 'upload',
        content,
        fileName: file.name,
      });
      await onSpecParsed(content);
    } catch (error) {
      toast.error("Couldn't read that file. Make sure it's valid YAML or JSON.");
      console.error('File upload error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Auto-parse when user pastes content from clipboard.
   */
  const handleClipboardPaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted.trim()) return;

    // The onChange will fire after paste, but we need the full content
    // Combine existing content with pasted text at cursor position
    const target = e.target as HTMLTextAreaElement;
    const before = target.value.substring(0, target.selectionStart);
    const after = target.value.substring(target.selectionEnd);
    const fullContent = before + pasted + after;

    setPastedContent(fullContent);
    setValue('openapiSpec', {
      source: 'paste',
      content: fullContent,
    });
    await onSpecParsed(fullContent);
  }, [setValue, onSpecParsed]);

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Mitigation for OWASP A10:2025 - SSRF: Validate URL format client-side before sending to server
    try {
      new URL(url);
    } catch {
      toast.error('That doesn\u2019t look like a valid URL. Use https:// or http://localhost.');
      return;
    }

    setIsImporting(true);
    try {
      // Fetch via server-side proxy to bypass CORS restrictions
      // Mitigation for OWASP A09:2025 (SSRF): Server validates URL before fetching
      const response = await fetch('/api/fetch-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to fetch spec from that URL');
        return;
      }

      const fileName = url.split('/').pop() || 'Imported Spec';
      setValue('openapiSpec', {
        source: 'url',
        content: result.content,
        fileName,
      });
      await onSpecParsed(result.content, url);
    } catch (error) {
      toast.error("Couldn't reach that URL. Please check it and try again.");
      console.error('URL import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setValue('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      'tags',
      formData.tags.filter((t) => t !== tag)
    );
  };

  const hasSpec = !!formData.openapiSpec?.content;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isParsingSpec && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Reading your spec...</span>
        </div>
      )}

      {/* Spec Upload */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Label>API Spec</Label>
          {hasSpec && (
            <Badge variant="secondary" className="text-xs bg-success/10 text-success">
              Uploaded
            </Badge>
          )}
        </div>

        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="gap-1.5 text-xs sm:text-sm">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardPaste className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              Paste
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5 text-xs sm:text-sm">
              <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 sm:p-8">
              <label className="cursor-pointer text-center">
                <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                <p className="mt-2 text-xs sm:text-sm font-medium">Drop your file here, or click to browse</p>
                <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">YAML or JSON · max 5 MB</p>
                <input
                  type="file"
                  accept=".yaml,.yml,.json"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <Textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              onPaste={handleClipboardPaste}
              placeholder="Paste your spec here — we'll read it automatically"
              rows={8}
              className="font-mono text-[11px] sm:text-xs"
            />
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.yaml"
                disabled={isImporting}
                className="flex-1"
              />
              <Button type="button" onClick={handleUrlImport} disabled={!url.trim() || isImporting} className="shrink-0">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {!hasSpec && (
          <p className="text-xs text-muted-foreground mt-3">
            Upload, paste, or fetch your OpenAPI spec. We'll use it to fill in the details below.
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <Label className="block mb-2">Tags</Label>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Type and press Enter to add"
            className="flex-1"
          />
          <Button type="button" onClick={addTag} className="shrink-0">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
