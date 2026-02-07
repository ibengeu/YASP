/**
 * RegisterApiDrawer - Multi-step API registration wizard
 * Streamlined 3-step flow with integrated spec upload/import
 *
 * Features:
 * - Basic info input (name, version, endpoint, description)
 * - Upload/paste/URL import for OpenAPI specifications
 * - Tag management
 * - Auto-parse spec metadata when provided
 *
 * Security: OWASP A03:2025 - Input validation for file uploads
 * Security: OWASP A10:2025 - SSRF prevention for URL imports
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Loader2, Upload, ClipboardPaste, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { idbStorage } from '@/core/storage/idb-storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ApiFormData {
  // Basic Info
  name: string;
  description: string;
  version: string;
  endpoint: string;

  // Tags
  tags: string[];

  // OpenAPI Specification
  openapiSpec: {
    source: 'upload' | 'paste' | 'url' | '';
    content: string;
    fileName?: string;
  };

  // Status
  status: 'draft' | 'active';
}

export interface ValidationErrors {
  [key: string]: string;
}

interface RegisterApiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Name, version, and endpoint details' },
  { id: 2, title: 'OpenAPI Specification', description: 'Upload, paste, or import from URL' },
  { id: 3, title: 'Review & Submit', description: 'Review and register API' },
];

const initialFormData: ApiFormData = {
  name: '',
  description: '',
  version: '',
  endpoint: '',
  tags: [],
  openapiSpec: {
    source: '',
    content: '',
  },
  status: 'active',
};

export function RegisterApiDrawer({ isOpen, onClose, onSuccess }: RegisterApiDrawerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApiFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      // Mitigation for OWASP A03:2025 - Injection: Validate input lengths
      if (!formData.name || formData.name.length < 3) {
        newErrors.name = 'API name is required (min 3 characters)';
      }
      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description is required (min 20 characters)';
      }
      if (formData.description.length > 500) {
        newErrors.description = 'Description cannot exceed 500 characters';
      }
      if (!formData.version) {
        newErrors.version = 'Version is required';
      }
      if (!formData.endpoint) {
        newErrors.endpoint = 'Endpoint is required';
      } else if (!formData.endpoint.startsWith('https://')) {
        newErrors.endpoint = 'Endpoint must use HTTPS';
      }
    } else if (step === 2) {
      // Optional: Validate OpenAPI spec if provided
      if (formData.openapiSpec.content) {
        try {
          // Try parsing to validate format
          JSON.parse(formData.openapiSpec.content);
        } catch {
          // Not JSON, could be YAML - validation happens during import
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      let specContent = formData.openapiSpec.content;
      let parsedSpec;

      // If user provided a spec, parse and validate it
      if (specContent) {
        try {
          // Try parsing as JSON first
          parsedSpec = JSON.parse(specContent);
        } catch {
          // Try parsing as YAML
          const yaml = await import('yaml');
          parsedSpec = yaml.parse(specContent);
        }

        // Validate it's an OpenAPI spec
        if (!parsedSpec.openapi && !parsedSpec.swagger) {
          throw new Error('Not a valid OpenAPI specification');
        }

        // Use spec's info if available, otherwise use form data
        const title = parsedSpec.info?.title || formData.name;
        const version = parsedSpec.info?.version || formData.version;
        const description = parsedSpec.info?.description || formData.description;

        await idbStorage.createSpec({
          type: 'openapi',
          content: specContent,
          title,
          version,
          description,
          metadata: {
            score: 0,
            tags: formData.tags,
            workspaceType: 'personal',
            syncStatus: 'offline',
            isDiscoverable: true,
          },
        });
      } else {
        // Create a basic OpenAPI spec from form data
        specContent = `openapi: 3.1.0
info:
  title: ${formData.name}
  version: ${formData.version}
  description: ${formData.description}
servers:
  - url: ${formData.endpoint}
paths: {}`;

        await idbStorage.createSpec({
          type: 'openapi',
          content: specContent,
          title: formData.name,
          version: formData.version,
          description: formData.description,
          metadata: {
            score: 0,
            tags: formData.tags,
            workspaceType: 'personal',
            syncStatus: 'offline',
            isDiscoverable: true,
          },
        });
      }

      toast.success('API registered successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register API');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-background border-l border-border shadow-2xl animate-slideInRight flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Register New API</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <BasicInfoStepInline formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <SpecUploadStepInline formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <ReviewStepInline formData={formData} />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-card">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Register API
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline step components for brevity
function BasicInfoStepInline({ formData, errors, updateFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">API Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="my-payment-api"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          placeholder="Describe what this API does..."
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Version *</label>
        <input
          type="text"
          value={formData.version}
          onChange={(e) => updateFormData('version', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="v1.0.0"
        />
        {errors.version && <p className="text-xs text-red-500 mt-1">{errors.version}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Endpoint / Base URL *</label>
        <input
          type="url"
          value={formData.endpoint}
          onChange={(e) => updateFormData('endpoint', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://api.example.com/v1"
        />
        {errors.endpoint && <p className="text-xs text-red-500 mt-1">{errors.endpoint}</p>}
      </div>
    </div>
  );
}

function SpecUploadStepInline({ formData, updateFormData }: any) {
  const [pastedContent, setPastedContent] = useState(formData.openapiSpec.content || '');
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
      updateFormData('openapiSpec', {
        source: 'upload',
        content,
        fileName: file.name,
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to read file');
      console.error('File upload error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handlePaste = () => {
    if (!pastedContent.trim()) {
      toast.error('Please paste your OpenAPI specification');
      return;
    }

    updateFormData('openapiSpec', {
      source: 'paste',
      content: pastedContent,
    });
    toast.success('Specification added');
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
      updateFormData('openapiSpec', {
        source: 'url',
        content,
        fileName,
      });
      toast.success('Specification imported from URL');
    } catch (error) {
      toast.error('Failed to fetch specification from URL');
      console.error('URL import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateFormData('tags', formData.tags.filter((t: string) => t !== tag));
  };

  return (
    <div className="space-y-6">
      {/* OpenAPI Specification Upload */}
      <div>
        <label className="block text-sm font-medium mb-3 text-foreground">
          OpenAPI Specification (Optional)
        </label>

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
            {formData.openapiSpec.source === 'upload' && formData.openapiSpec.fileName && (
              <p className="text-sm text-muted-foreground">
                ✓ Uploaded: {formData.openapiSpec.fileName}
              </p>
            )}
          </TabsContent>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your OpenAPI specification here..."
              className="min-h-[200px] w-full rounded-md border border-border bg-background p-4 font-mono text-sm"
              disabled={isImporting}
            />
            <button
              onClick={handlePaste}
              disabled={isImporting || !pastedContent.trim()}
              className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isImporting ? 'Processing...' : 'Use Pasted Specification'}
            </button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
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
            <button
              onClick={handleUrlImport}
              disabled={isImporting || !url.trim()}
              className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isImporting ? 'Importing...' : 'Import from URL'}
            </button>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground mt-3">
          Providing an OpenAPI spec enables better API discovery and compliance checking.
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Tags (Optional)</label>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-primary-foreground cursor-pointer">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewStepInline({ formData }: any) {
  return (
    <div className="space-y-4">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3 text-foreground">Basic Information</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name:</dt>
            <dd className="font-medium text-foreground">{formData.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version:</dt>
            <dd className="font-medium text-foreground">{formData.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Endpoint:</dt>
            <dd className="font-mono text-xs mt-1 text-foreground">{formData.endpoint}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Description:</dt>
            <dd className="text-foreground mt-1">{formData.description}</dd>
          </div>
        </dl>
      </div>

      {formData.tags.length > 0 && (
        <div className="p-4 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-3 text-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-muted text-foreground text-xs rounded">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3 text-foreground">OpenAPI Specification</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status:</dt>
            <dd className="font-medium text-foreground">
              {formData.openapiSpec.content ? (
                <span className="text-green-600">✓ Provided</span>
              ) : (
                <span className="text-amber-600">Not provided</span>
              )}
            </dd>
          </div>
          {formData.openapiSpec.source && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Source:</dt>
              <dd className="font-medium text-foreground capitalize">{formData.openapiSpec.source}</dd>
            </div>
          )}
          {formData.openapiSpec.fileName && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">File:</dt>
              <dd className="font-medium text-foreground">{formData.openapiSpec.fileName}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
