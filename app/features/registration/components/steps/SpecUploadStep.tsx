/**
 * SpecUploadStep - Step 1 of API Registration Wizard
 *
 * Allows users to upload, paste, or import OpenAPI specifications.
 * Includes auto-inference, loading states, and skip option.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  ClipboardPaste,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';
import type { InferredData } from '@/features/registration/utils/spec-inference';
import type { UseFormSetValue } from 'react-hook-form';

export interface SpecUploadStepProps {
  formData: RegistrationFormData;
  setValue: UseFormSetValue<RegistrationFormData>;
  onSpecParsed: (content: string, sourceUrl?: string) => Promise<void>;
  inferredData: InferredData | null;
  isParsingSpec: boolean;
  onSkip?: () => void;
}

export function SpecUploadStep({
  formData,
  setValue,
  onSpecParsed,
  inferredData,
  isParsingSpec,
  onSkip,
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
      toast.success('Specification uploaded and analyzed successfully');
    } catch (error) {
      toast.error('Failed to read file. Please ensure it\'s a valid YAML or JSON file.');
      console.error('File upload error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handlePaste = async () => {
    if (!pastedContent.trim()) {
      toast.error('Please paste your OpenAPI specification');
      return;
    }

    setValue('openapiSpec', {
      source: 'paste',
      content: pastedContent,
    });
    await onSpecParsed(pastedContent);
  };

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Mitigation for OWASP A10:2025 - SSRF: Validate URL format client-side before sending to server
    try {
      new URL(url);
    } catch {
      toast.error('Invalid URL format. Please enter a valid URL starting with https://');
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
        toast.error(result.error || 'Failed to fetch specification from URL');
        return;
      }

      const fileName = url.split('/').pop() || 'Imported Spec';
      setValue('openapiSpec', {
        source: 'url',
        content: result.content,
        fileName,
      });
      await onSpecParsed(result.content, url);
      toast.success('Specification fetched and analyzed successfully');
    } catch (error) {
      toast.error('Failed to fetch specification from URL. Please check the URL and try again.');
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

  return (
    <div className="space-y-6">
      {/* Onboarding Helper */}
      {!inferredData && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                What is an OpenAPI Specification?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                An OpenAPI spec is a standard format (YAML or JSON) that describes your API's structure.
                Upload yours and we'll auto-fill your API name, version, description, endpoints, and authentication details—saving you time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isParsingSpec && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing OpenAPI specification...</span>
        </div>
      )}

      {/* OpenAPI Specification Upload */}
      <div>
        <Label className="block mb-3">OpenAPI Specification (Optional)</Label>

        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="gap-2">
              <Upload className="h-4 w-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Paste
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8">
              <label className="cursor-pointer text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
                <p className="mt-1 text-xs text-muted-foreground">YAML, YML, or JSON files (max 5MB)</p>
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
              placeholder="Paste your OpenAPI specification here (YAML or JSON)"
              rows={10}
              className="font-mono text-xs"
            />
            <Button type="button" onClick={handlePaste} disabled={!pastedContent.trim()}>
              Analyze Specification
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.yaml"
                disabled={isImporting}
              />
              <Button type="button" onClick={handleUrlImport} disabled={!url.trim() || isImporting}>
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground mt-3">
          Providing an OpenAPI spec enables better API discovery and compliance checking.
        </p>

        {/* Spec Analysis Card */}
        {inferredData && (
          <Card className="mt-4 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Specification Analysis
              </CardTitle>
              <CardDescription>
                Auto-filled {inferredData.fieldsPopulated}/{inferredData.totalFields} fields •{' '}
                <Badge
                  variant={
                    inferredData.confidence === 'high'
                      ? 'default'
                      : inferredData.confidence === 'medium'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="capitalize"
                >
                  {inferredData.confidence} confidence
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📋</span>
                  <span>
                    {inferredData.endpointCount} endpoint
                    {inferredData.endpointCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🔐</span>
                  <span>{inferredData.auth?.type || 'No auth'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🌐</span>
                  <span>
                    {inferredData.servers.length} server{inferredData.servers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">🏷️</span>
                  <span>
                    {inferredData.tags.length} tag{inferredData.tags.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {inferredData.validationIssues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {inferredData.validationIssues.length} validation issue
                      {inferredData.validationIssues.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {inferredData.validationIssues.slice(0, 3).map((issue, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {issue.message}
                      </li>
                    ))}
                    {inferredData.validationIssues.length > 3 && (
                      <li className="text-xs text-muted-foreground italic">
                        ... and {inferredData.validationIssues.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tags */}
      <div>
        <Label className="block mb-2">Tags (Optional)</Label>
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
            placeholder="Type tag and press Enter"
          />
          <Button type="button" onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      {/* Skip Option */}
      {!inferredData && onSkip && (
        <div className="mt-6 text-center border-t pt-4">
          <Button
            type="button"
            variant="link"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip spec upload and enter details manually →
          </Button>
        </div>
      )}
    </div>
  );
}
