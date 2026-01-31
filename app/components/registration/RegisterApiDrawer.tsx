/**
 * RegisterApiDrawer - Multi-step API registration wizard
 * Following reference platform's 4-step registration flow
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { idbStorage } from '@/core/storage/idb-storage';

export interface ApiFormData {
  // Basic Info
  name: string;
  description: string;
  type: 'REST' | 'GraphQL' | 'gRPC' | 'AsyncAPI' | '';
  version: string;
  endpoint: string;
  
  // Ownership
  owner: string;
  team: string;
  tags: string[];
  
  // Documentation
  documentationUrl: string;
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
  { id: 1, title: 'Basic Information', description: 'Name, type, and endpoint details' },
  { id: 2, title: 'Ownership & Organization', description: 'Owner, team, and tags' },
  { id: 3, title: 'Documentation', description: 'OpenAPI spec and docs (optional)' },
  { id: 4, title: 'Review & Submit', description: 'Final review' },
];

const initialFormData: ApiFormData = {
  name: '',
  description: '',
  type: '',
  version: '',
  endpoint: '',
  owner: '',
  team: '',
  tags: [],
  documentationUrl: '',
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
      if (!formData.name || formData.name.length < 3) {
        newErrors.name = 'API name is required (min 3 characters)';
      }
      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description is required (min 20 characters)';
      }
      if (formData.description.length > 500) {
        newErrors.description = 'Description cannot exceed 500 characters';
      }
      if (!formData.type) {
        newErrors.type = 'API type is required';
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
      if (!formData.owner) {
        newErrors.owner = 'Owner is required';
      }
      if (!formData.team) {
        newErrors.team = 'Team is required';
      }
      if (formData.tags.length === 0) {
        newErrors.tags = 'At least one tag is required';
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
      // Create OpenAPI spec content
      const specContent = formData.openapiSpec.content || `openapi: 3.1.0
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

      toast.success('API registered successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register API');
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
        <div className="flex-shrink-0 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-card-foreground">Register New API</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
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
            <OwnershipStepInline formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <DocumentationStepInline formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 4 && (
            <ReviewStepInline formData={formData} />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-muted/30">
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
        <label className="block text-sm font-medium mb-2">API Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
          placeholder="my-payment-api"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
          rows={4}
          placeholder="Describe what this API does..."
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Type *</label>
          <select
            value={formData.type}
            onChange={(e) => updateFormData('type', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-card"
          >
            <option value="">Select...</option>
            <option value="REST">REST</option>
            <option value="GraphQL">GraphQL</option>
            <option value="gRPC">gRPC</option>
            <option value="AsyncAPI">AsyncAPI</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Version *</label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => updateFormData('version', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-card"
            placeholder="v1.0.0"
          />
          {errors.version && <p className="text-xs text-red-500 mt-1">{errors.version}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Endpoint / Base URL *</label>
        <input
          type="url"
          value={formData.endpoint}
          onChange={(e) => updateFormData('endpoint', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
          placeholder="https://api.example.com/v1"
        />
        {errors.endpoint && <p className="text-xs text-red-500 mt-1">{errors.endpoint}</p>}
      </div>
    </div>
  );
}

function OwnershipStepInline({ formData, errors, updateFormData }: any) {
  const [tagInput, setTagInput] = useState('');

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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Owner *</label>
        <input
          type="email"
          value={formData.owner}
          onChange={(e) => updateFormData('owner', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
          placeholder="owner@company.com"
        />
        {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Team *</label>
        <select
          value={formData.team}
          onChange={(e) => updateFormData('team', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
        >
          <option value="">Select...</option>
          <option value="Platform Engineering">Platform Engineering</option>
          <option value="Payments Team">Payments Team</option>
          <option value="User Services">User Services</option>
          <option value="Data Team">Data Team</option>
        </select>
        {errors.team && <p className="text-xs text-red-500 mt-1">{errors.team}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags *</label>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-primary-foreground">×</button>
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
            className="flex-1 px-3 py-2 border border-border rounded-md bg-card"
            placeholder="Type tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Add
          </button>
        </div>
        {errors.tags && <p className="text-xs text-red-500 mt-1">{errors.tags}</p>}
      </div>
    </div>
  );
}

function DocumentationStepInline({ formData, errors, updateFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Documentation URL (Optional)</label>
        <input
          type="url"
          value={formData.documentationUrl}
          onChange={(e) => updateFormData('documentationUrl', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card"
          placeholder="https://docs.example.com/api/v1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">OpenAPI Specification (Optional)</label>
        <textarea
          value={formData.openapiSpec.content}
          onChange={(e) => updateFormData('openapiSpec', { ...formData.openapiSpec, content: e.target.value, source: 'paste' })}
          className="w-full px-3 py-2 border border-border rounded-md bg-card font-mono text-sm"
          rows={12}
          placeholder="Paste your OpenAPI spec here (YAML or JSON)..."
        />
        <p className="text-xs text-muted-foreground mt-2">
          Providing an OpenAPI spec enables better API discovery and compliance checking.
        </p>
      </div>
    </div>
  );
}

function ReviewStepInline({ formData }: any) {
  return (
    <div className="space-y-4">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Basic Information</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name:</dt>
            <dd className="font-medium">{formData.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Type:</dt>
            <dd className="font-medium">{formData.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Version:</dt>
            <dd className="font-medium">{formData.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Endpoint:</dt>
            <dd className="font-mono text-xs mt-1">{formData.endpoint}</dd>
          </div>
        </dl>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Ownership</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Owner:</dt>
            <dd className="font-medium">{formData.owner}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Team:</dt>
            <dd className="font-medium">{formData.team}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground mb-2">Tags:</dt>
            <dd className="flex flex-wrap gap-1">
              {formData.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-muted text-xs rounded">{tag}</span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Documentation</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Documentation URL:</dt>
            <dd className="font-medium">{formData.documentationUrl || 'Not provided'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">OpenAPI Spec:</dt>
            <dd className="font-medium">{formData.openapiSpec.content ? 'Provided' : 'Not provided'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
