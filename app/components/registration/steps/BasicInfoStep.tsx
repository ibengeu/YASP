import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import type { ApiFormData, ValidationErrors } from '../RegisterApiDrawer';

interface BasicInfoStepProps {
  formData: ApiFormData;
  errors: ValidationErrors;
  updateFormData: (field: string, value: any) => void;
}

export function BasicInfoStep({ formData, errors, updateFormData }: BasicInfoStepProps) {
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [isCheckingEndpoint, setIsCheckingEndpoint] = useState(false);
  const [endpointAvailable, setEndpointAvailable] = useState<boolean | null>(null);

  // Debounced name availability check
  useEffect(() => {
    if (!formData.name || errors.name || formData.name.length < 3) {
      setNameAvailable(null);
      return;
    }

    setIsCheckingName(true);
    const timer = setTimeout(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock result - in real app, check against API
      const isAvailable = !['payment-api', 'user-service', 'auth-api'].includes(formData.name);
      setNameAvailable(isAvailable);
      setIsCheckingName(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.name, errors.name]);

  // Debounced endpoint availability check
  useEffect(() => {
    if (!formData.endpoint || errors.endpoint || !formData.endpoint.startsWith('https://')) {
      setEndpointAvailable(null);
      return;
    }

    setIsCheckingEndpoint(true);
    const timer = setTimeout(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock result
      const isAvailable = !formData.endpoint.includes('existing');
      setEndpointAvailable(isAvailable);
      setIsCheckingEndpoint(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.endpoint, errors.endpoint]);

  // Auto-suggest name from endpoint
  const handleEndpointBlur = () => {
    if (formData.endpoint && !formData.name) {
      try {
        const url = new URL(formData.endpoint);
        const pathParts = url.pathname.split('/').filter(p => p);
        const suggestedName = pathParts[pathParts.length - 1] || url.hostname.split('.')[0];
        if (suggestedName && /^[a-z0-9-]+$/.test(suggestedName)) {
          updateFormData('name', suggestedName);
        }
      } catch (err) {
        // Invalid URL, ignore
      }
    }
  };

  return (
    <div className="space-y-6" role="form" aria-label="Basic API information">
      {/* API Name */}
      <div>
        <label
          htmlFor="api-name"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          API Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <div className="relative">
          <input
            id="api-name"
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value.toLowerCase())}
            placeholder="payment-processing-api"
            className={`w-full px-4 py-2.5 pr-10 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : nameAvailable === true
                ? 'border-green-500'
                : nameAvailable === false
                ? 'border-red-500'
                : 'border-border'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'api-name-error' : 'api-name-help'}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingName ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" aria-label="Checking availability" />
            ) : nameAvailable === true ? (
              <CheckCircle className="w-4 h-4 text-green-500" aria-label="Name available" />
            ) : nameAvailable === false ? (
              <AlertCircle className="w-4 h-4 text-red-500" aria-label="Name unavailable" />
            ) : null}
          </div>
        </div>
        {errors.name ? (
          <p id="api-name-error" className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {errors.name}
          </p>
        ) : nameAvailable === false ? (
          <p id="api-name-error" className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            This API name is already taken. Try adding a version suffix like "-v2"
          </p>
        ) : (
          <p id="api-name-help" className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Use kebab-case (lowercase with hyphens). Example: my-payment-api
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="api-description"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Description <span className="text-red-500" aria-label="required">*</span>
        </label>
        <textarea
          id="api-description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe what this API does, its purpose, and key functionality..."
          rows={4}
          className={`w-full px-4 py-2.5 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none ${
            errors.description
              ? 'border-red-500 focus:ring-red-500'
              : 'border-border'
          }`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'api-description-error' : 'api-description-help'}
        />
        <div className="flex items-center justify-between mt-1.5">
          {errors.description ? (
            <p id="api-description-error" className="text-xs text-red-500 flex items-start gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {errors.description}
            </p>
          ) : (
            <p id="api-description-help" className="text-xs text-muted-foreground">
              Minimum 20 characters, maximum 500 characters
            </p>
          )}
          <span
            className={`text-xs font-medium ${
              formData.description.length > 500
                ? 'text-red-500'
                : formData.description.length < 20
                ? 'text-muted-foreground'
                : 'text-green-500'
            }`}
            aria-live="polite"
          >
            {formData.description.length}/500
          </span>
        </div>
      </div>

      {/* Type and Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label
            htmlFor="api-type"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            API Type <span className="text-red-500" aria-label="required">*</span>
          </label>
          <select
            id="api-type"
            value={formData.type}
            onChange={(e) => updateFormData('type', e.target.value)}
            className={`w-full px-4 py-2.5 bg-card border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.type
                ? 'border-red-500 focus:ring-red-500'
                : 'border-border'
            }`}
            aria-invalid={!!errors.type}
            aria-describedby={errors.type ? 'api-type-error' : undefined}
          >
            <option value="">Select type...</option>
            <option value="REST">REST</option>
            <option value="GraphQL">GraphQL</option>
            <option value="gRPC">gRPC</option>
            <option value="AsyncAPI">AsyncAPI</option>
          </select>
          {errors.type && (
            <p id="api-type-error" className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {errors.type}
            </p>
          )}
        </div>

        {/* Version */}
        <div>
          <label
            htmlFor="api-version"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Version <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="api-version"
            type="text"
            value={formData.version}
            onChange={(e) => updateFormData('version', e.target.value)}
            placeholder="v1.0.0"
            className={`w-full px-4 py-2.5 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.version
                ? 'border-red-500 focus:ring-red-500'
                : 'border-border'
            }`}
            aria-invalid={!!errors.version}
            aria-describedby={errors.version ? 'api-version-error' : 'api-version-help'}
            autoComplete="off"
          />
          {errors.version ? (
            <p id="api-version-error" className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {errors.version}
            </p>
          ) : (
            <p id="api-version-help" className="mt-1.5 text-xs text-muted-foreground">
              Use semantic versioning (e.g., v1.0.0)
            </p>
          )}
        </div>
      </div>

      {/* Endpoint */}
      <div>
        <label
          htmlFor="api-endpoint"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          API Endpoint / Base URL <span className="text-red-500" aria-label="required">*</span>
        </label>
        <div className="relative">
          <input
            id="api-endpoint"
            type="url"
            value={formData.endpoint}
            onChange={(e) => updateFormData('endpoint', e.target.value)}
            onBlur={handleEndpointBlur}
            placeholder="https://api.example.com/v1"
            className={`w-full px-4 py-2.5 pr-10 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
              errors.endpoint
                ? 'border-red-500 focus:ring-red-500'
                : endpointAvailable === true
                ? 'border-green-500'
                : endpointAvailable === false
                ? 'border-red-500'
                : 'border-border'
            }`}
            aria-invalid={!!errors.endpoint}
            aria-describedby={errors.endpoint ? 'api-endpoint-error' : 'api-endpoint-help'}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingEndpoint ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" aria-label="Checking endpoint" />
            ) : endpointAvailable === true ? (
              <CheckCircle className="w-4 h-4 text-green-500" aria-label="Endpoint available" />
            ) : endpointAvailable === false ? (
              <AlertCircle className="w-4 h-4 text-red-500" aria-label="Endpoint in use" />
            ) : null}
          </div>
        </div>
        {errors.endpoint ? (
          <p id="api-endpoint-error" className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {errors.endpoint}
          </p>
        ) : endpointAvailable === false ? (
          <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            This endpoint is already registered. Endpoints must be unique.
          </p>
        ) : formData.endpoint && formData.endpoint.startsWith('http://') ? (
          <p className="mt-1.5 text-xs text-yellow-600 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            HTTP is not secure. Update to HTTPS: {formData.endpoint.replace('http://', 'https://')}
          </p>
        ) : (
          <p id="api-endpoint-help" className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Must be a valid HTTPS URL. HTTP is not permitted for security reasons.
          </p>
        )}
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Endpoint Uniqueness
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Endpoint uniqueness is scoped per version and environment. You can register the same base URL
              with different versions (e.g., /v1 and /v2) or environments (dev, staging, production).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
