/**
 * CreatePolicyDrawer - Multi-step policy creation wizard
 * Following reference platform's 3-step policy creation flow
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PolicyFormData {
  // Basic Info
  name: string;
  description: string;
  category: 'Documentation' | 'Security' | 'Schema' | 'Versioning' | 'Best Practices' | '';
  severity: 'error' | 'warning' | 'info' | '';

  // Configuration
  scope: 'all' | 'specific';
  affectedApis: string[];

  // Status
  enabled: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

interface CreatePolicyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (policy: any) => void;
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Policy name, category, and severity' },
  { id: 2, title: 'Configuration', description: 'Scope and affected APIs' },
  { id: 3, title: 'Review', description: 'Final review and activation' },
];

const initialFormData: PolicyFormData = {
  name: '',
  description: '',
  category: '',
  severity: '',
  scope: 'all',
  affectedApis: [],
  enabled: true,
};

export function CreatePolicyDrawer({ isOpen, onClose, onSuccess }: CreatePolicyDrawerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
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

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.name || formData.name.length < 3) {
        newErrors.name = 'Policy name is required (min 3 characters)';
      }
      if (!formData.description || formData.description.length < 10) {
        newErrors.description = 'Description is required (min 10 characters)';
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
      if (!formData.severity) {
        newErrors.severity = 'Severity is required';
      }
    } else if (step === 2) {
      if (formData.scope === 'specific' && formData.affectedApis.length === 0) {
        newErrors.affectedApis = 'At least one API must be selected for specific scope';
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
      // In real app, would call API to create policy
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPolicy = {
        id: `pol-${Date.now()}`,
        ...formData,
      };

      toast.success('Policy created successfully');
      onSuccess?.(newPolicy);
      onClose();
    } catch (error) {
      console.error('Policy creation error:', error);
      toast.error('Failed to create policy');
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
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl animate-slideInRight flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create New Policy</h2>
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
                {idx < STEPS.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <BasicInfoStep formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <ConfigurationStep formData={formData} errors={errors} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <ReviewStep formData={formData} />
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Policy
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

// Step 1: Basic Information
function BasicInfoStep({ formData, errors, updateFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Policy Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="API Must Have Description"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="Describe what this policy enforces..."
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => updateFormData('category', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="Documentation">Documentation</option>
            <option value="Security">Security</option>
            <option value="Schema">Schema</option>
            <option value="Versioning">Versioning</option>
            <option value="Best Practices">Best Practices</option>
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Severity <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.severity}
            onChange={(e) => updateFormData('severity', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity}</p>}
        </div>
      </div>
    </div>
  );
}

// Step 2: Configuration
function ConfigurationStep({ formData, errors, updateFormData }: any) {
  const mockApis = [
    { id: '1', name: 'E-Commerce API' },
    { id: '2', name: 'Payment API' },
    { id: '3', name: 'User Service API' },
  ];

  const toggleApi = (apiId: string) => {
    const newAffectedApis = formData.affectedApis.includes(apiId)
      ? formData.affectedApis.filter((id: string) => id !== apiId)
      : [...formData.affectedApis, apiId];
    updateFormData('affectedApis', newAffectedApis);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Scope <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50">
            <input
              type="radio"
              name="scope"
              value="all"
              checked={formData.scope === 'all'}
              onChange={(e) => updateFormData('scope', e.target.value)}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-sm">All APIs</div>
              <div className="text-xs text-muted-foreground">Apply this policy to all registered APIs</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50">
            <input
              type="radio"
              name="scope"
              value="specific"
              checked={formData.scope === 'specific'}
              onChange={(e) => updateFormData('scope', e.target.value)}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-sm">Specific APIs</div>
              <div className="text-xs text-muted-foreground">Select which APIs this policy applies to</div>
            </div>
          </label>
        </div>
      </div>

      {formData.scope === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Affected APIs <span className="text-red-500">*</span>
          </label>
          <div className="border border-border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
            {mockApis.map((api) => (
              <label key={api.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.affectedApis.includes(api.id)}
                  onChange={() => toggleApi(api.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{api.name}</span>
              </label>
            ))}
          </div>
          {errors.affectedApis && <p className="text-xs text-red-500 mt-1">{errors.affectedApis}</p>}
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => updateFormData('enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <div className="text-sm font-medium">Enable policy immediately</div>
            <div className="text-xs text-muted-foreground">Start enforcing this policy as soon as it is created</div>
          </div>
        </label>
      </div>
    </div>
  );
}

// Step 3: Review
function ReviewStep({ formData }: any) {
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
            <dt className="text-muted-foreground">Category:</dt>
            <dd className="font-medium text-foreground">{formData.category}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Severity:</dt>
            <dd className="font-medium text-foreground capitalize">{formData.severity}</dd>
          </div>
          <div className="pt-2 border-t border-border">
            <dt className="text-muted-foreground mb-1">Description:</dt>
            <dd className="text-foreground text-xs">{formData.description}</dd>
          </div>
        </dl>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3 text-foreground">Configuration</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Scope:</dt>
            <dd className="font-medium text-foreground capitalize">{formData.scope === 'all' ? 'All APIs' : 'Specific APIs'}</dd>
          </div>
          {formData.scope === 'specific' && (
            <div className="pt-2 border-t border-border">
              <dt className="text-muted-foreground mb-1">Affected APIs:</dt>
              <dd className="text-foreground text-xs">{formData.affectedApis.length} API(s) selected</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status:</dt>
            <dd className={`font-medium ${formData.enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
              {formData.enabled ? 'Enabled' : 'Disabled'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          This policy will be {formData.enabled ? 'immediately enforced' : 'created as disabled'} and apply to{' '}
          {formData.scope === 'all' ? 'all registered APIs' : `${formData.affectedApis.length} selected API(s)`}.
        </p>
      </div>
    </div>
  );
}
