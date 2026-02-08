/**
 * Import Specification Dialog
 * Upload YAML/JSON OpenAPI specs from file, URL, or paste
 *
 * Security: OWASP A03:2025 - Input validation for file uploads
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Link as LinkIcon, ClipboardPaste, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { idbStorage } from '@/core/storage/idb-storage';

interface ImportSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportSpecDialog({ open, onOpenChange }: ImportSpecDialogProps) {
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [url, setUrl] = useState('');

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
      await importSpec(content, file.name);
    } catch (error) {
      toast.error('Failed to read file');
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

    setIsImporting(true);
    try {
      await importSpec(pastedContent, 'Pasted Spec');
    } catch (error) {
      toast.error('Failed to import specification');
      console.error('Paste error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleUrlImport = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Mitigation for OWASP A10:2025 - SSRF: Validate URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        toast.error('Only HTTP and HTTPS URLs are allowed');
        return;
      }
    } catch {
      toast.error('Invalid URL');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.text();
      const fileName = url.split('/').pop() || 'Imported Spec';
      await importSpec(content, fileName);
    } catch (error) {
      toast.error('Failed to fetch specification from URL');
      console.error('URL import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const importSpec = async (content: string, fileName: string) => {
    try {
      // Parse to validate
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try YAML
        const yaml = await import('yaml');
        parsed = yaml.parse(content);
      }

      // Basic validation
      if (!parsed.openapi && !parsed.swagger) {
        throw new Error('Not a valid OpenAPI specification');
      }

      // Extract title from spec
      const title = parsed.info?.title || fileName.replace(/\.(yaml|yml|json)$/i, '');

      // Create spec in storage
      const newSpec = await idbStorage.createSpec({
        type: 'openapi',
        content,
        title,
        version: parsed.info?.version || '1.0.0',
        description: parsed.info?.description,
        metadata: {
          score: 0,
          tags: [],
          workspaceType: 'personal',
          syncStatus: 'offline',
          isDiscoverable: false,
        },
      });

      toast.success('Specification imported successfully');
      onOpenChange(false);
      navigate(`/editor/${newSpec.id}`);
    } catch (error) {
      throw new Error(`Invalid OpenAPI specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import OpenAPI Specification</DialogTitle>
          <DialogDescription>
            Upload a YAML or JSON file, paste content, or import from a URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-4">
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

          <TabsContent value="file" className="space-y-4">
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-12">
              <label className="cursor-pointer text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  YAML or JSON files (max 5MB)
                </p>
                <input
                  type="file"
                  accept=".yaml,.yml,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4">
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your OpenAPI specification here..."
              className="min-h-[300px] w-full rounded-md border border-border bg-background p-4 font-mono text-sm"
              disabled={isImporting}
            />
            <Button
              onClick={handlePaste}
              disabled={isImporting || !pastedContent.trim()}
              className="w-full"
            >
              <FileJson className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import Specification'}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Specification URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/openapi.yaml"
                className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm"
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of a publicly accessible OpenAPI specification
              </p>
            </div>
            <Button
              onClick={handleUrlImport}
              disabled={isImporting || !url.trim()}
              className="w-full"
            >
              <LinkIcon className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import from URL'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
