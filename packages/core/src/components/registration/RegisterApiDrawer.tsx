/**
 * RegisterApiDrawer - API Registration Wizard
 *
 * Two-step wizard:
 * - Step 1 (Details): Spec upload + basic info form fields
 * - Step 2 (Preview): Review all details before registering
 *
 * Security: OWASP A03:2025 - Input validation
 * Security: OWASP A10:2025 - SSRF prevention
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { idbStorage } from '@/core/storage/idb-storage';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { incrementAction } from '@/lib/action-tracker';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Wizard, WizardStepContainer } from '@/components/wizard/Wizard';
import { useWizard } from '@/features/registration/hooks/useWizard';
import { SpecUploadStep } from '@/features/registration/components/steps/SpecUploadStep';
import { BasicInfoStep } from '@/features/registration/components/steps/BasicInfoStep';
import { ReviewStep } from '@/features/registration/components/steps/ReviewStep';
import {
  registrationSchema,
  type RegistrationFormData,
} from '@/features/registration/schemas/registration-schema';
import { inferAllData, type InferredData } from '@/features/registration/utils/spec-inference';
import { patchSpecServers } from '@/features/registration/utils/patch-spec-servers';

interface RegisterApiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  {
    id: 1,
    title: 'Configuration',
    description: 'Configure your API specification and endpoint'
  },
  {
    id: 2,
    title: 'Finalize',
    description: 'Review and add your API to the catalog'
  },
] as const;

export function RegisterApiDrawer({ isOpen, onClose, onSuccess }: RegisterApiDrawerProps) {
  const { activeWorkspaceId, addSpecToWorkspace } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingSpec, setIsParsingSpec] = useState(false);

  // Spec inference state
  const [inferredData, setInferredData] = useState<InferredData | null>(null);
  const [fieldSources, setFieldSources] = useState<Record<string, 'manual' | 'inferred'>>({});
  const [specSourceUrl, setSpecSourceUrl] = useState<string | undefined>(undefined);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
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
    },
  });

  const formData = watch();

  // Wizard state machine
  const wizard = useWizard<number>({
    steps: STEPS,
    initialStep: 1,
    validateStep: async (step) => {
      if (step === 1) {
        // Validate all form fields before moving to preview
        const isValid = await trigger(['name', 'version', 'endpoint', 'openapiSpec.content']);
        return isValid;
      }
      return true;
    },
  });

  // Reset form when drawer closes
  // Note: We intentionally omit wizard.actions from deps to avoid infinite loops
  // The reset function is stable and memoized, so it's safe to call
  useEffect(() => {
    if (!isOpen) {
      reset();
      setInferredData(null);
      setFieldSources({});
      setSpecSourceUrl(undefined);
      wizard.actions.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reset]);

  /**
   * Parse OpenAPI spec and auto-fill form fields
   * Mitigation for Gap 0: Reduce redundant manual data entry
   */
  const handleSpecParsed = async (specContent: string, sourceUrl?: string) => {
    setIsParsingSpec(true);
    setSpecSourceUrl(sourceUrl);
    try {
      // Parse YAML/JSON
      let parsed;
      try {
        parsed = JSON.parse(specContent);
      } catch {
        const yaml = await import('yaml');
        parsed = yaml.parse(specContent);
      }

      // Validate API format (OpenAPI or AsyncAPI)
      if (!parsed.openapi && !parsed.swagger && !parsed.asyncapi) {
        throw new Error('Not a valid OpenAPI or AsyncAPI specification');
      }

      // Infer all data — sourceUrl enables resolution of relative server URLs
      const inferred = inferAllData(parsed, sourceUrl);
      setInferredData(inferred);

      // Auto-fill form fields only if not manually filled
      const updatedSources: Record<string, 'manual' | 'inferred'> = {};

      if (inferred.name && !fieldSources.name && !formData.name) {
        setValue('name', inferred.name);
        updatedSources.name = 'inferred';
      }
      if (inferred.version && !fieldSources.version && !formData.version) {
        setValue('version', inferred.version);
        updatedSources.version = 'inferred';
      }
      if (inferred.description && !fieldSources.description && !formData.description) {
        setValue('description', inferred.description);
        updatedSources.description = 'inferred';
      }
      if (inferred.primaryServerUrl && !fieldSources.endpoint && !formData.endpoint) {
        setValue('endpoint', inferred.primaryServerUrl);
        updatedSources.endpoint = 'inferred';
      }
      if (inferred.tags.length > 0 && !fieldSources.tags && formData.tags.length === 0) {
        setValue('tags', inferred.tags);
        updatedSources.tags = 'inferred';
      }

      setFieldSources((prev) => ({ ...prev, ...updatedSources }));

      // Show success toast
      toast.success(
        `Successfully analyzed specification: auto-filled ${inferred.fieldsPopulated} of ${inferred.totalFields} fields`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to parse specification: ${error.message}`
          : 'Failed to parse specification. Please ensure it\'s valid OpenAPI format.'
      );
    } finally {
      setIsParsingSpec(false);
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      let specContent = data.openapiSpec.content;

      // Patch spec content: ensure the user's endpoint is in the servers array
      // so that Try It Out gets correct URLs when re-parsing stored content
      specContent = patchSpecServers(specContent, inferredData?.servers ?? [], data.endpoint);

      // Create OpenAPI document with enhanced metadata
      const createdSpec = await idbStorage.createSpec({
        type: 'openapi',
        content: specContent,
        title: data.name,
        version: data.version,
        description: data.description,
        metadata: {
          score: 0,
          tags: data.tags,
          workspaceType: 'personal',
          syncStatus: 'synced',
          isDiscoverable: false,
          // Source URL for auditing and future re-fetch
          sourceUrl: specSourceUrl,
          // Enhanced metadata from spec inference
          servers: inferredData?.servers,
          defaultAuth: inferredData?.auth || undefined,
          inferredFields: Object.keys(fieldSources).filter((key) => fieldSources[key] === 'inferred'),
          specQuality: inferredData
            ? {
                confidence: inferredData.confidence,
                endpointCount: inferredData.endpointCount,
                hasAuth: inferredData.auth !== null,
                hasMultipleServers: inferredData.servers.length > 1,
                validationIssues: inferredData.validationIssues.length,
              }
            : undefined,
        },
      });

      // Add to active workspace
      if (activeWorkspaceId) {
        await addSpecToWorkspace(idbStorage, activeWorkspaceId, createdSpec.id);
      }

      // Track action for lead capture gate
      incrementAction();

      toast.success('API registered successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to register API: ${error.message}`
          : 'Failed to register API. Please try again.'
      );
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        {/* Wizard Provider wraps everything to make context available */}
        <Wizard state={wizard.state} actions={wizard.actions} steps={wizard.steps} className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">
                  Add an API
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-0.5">
                  {STEPS[wizard.state.currentStep - 1].description}
                </SheetDescription>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`h-1.5 rounded-full transition-all ${
                      step.id === wizard.state.currentStep
                        ? 'w-4 bg-primary'
                        : step.id < wizard.state.currentStep
                        ? 'w-4 bg-secondary'
                        : 'w-4 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </SheetHeader>

          {/* Wizard Content */}
          <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {/* Step 1: Details — spec upload + all form fields */}
              <WizardStepContainer step={1}>
                <div className="space-y-8">
                  <SpecUploadStep
                    formData={formData}
                    setValue={setValue}
                    register={register}
                    errors={errors}
                    onSpecParsed={handleSpecParsed}
                    isParsingSpec={isParsingSpec}
                    fieldSources={fieldSources}
                    setFieldSources={setFieldSources}
                  />
                  <BasicInfoStep
                    register={register}
                    errors={errors}
                    fieldSources={fieldSources}
                    setFieldSources={setFieldSources}
                    watch={watch}
                  />
                </div>
              </WizardStepContainer>

              {/* Step 2: Preview & Submit */}
              <WizardStepContainer step={2}>
                <ReviewStep formData={formData} />
              </WizardStepContainer>
            </div>

            {/* Footer Navigation */}
            <SheetFooter className="border-t border-border px-4 sm:px-6 py-4">
              <div className="flex justify-between gap-3 w-full">
                {wizard.state.canGoBack ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={wizard.actions.goToBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type={wizard.state.isLastStep ? 'submit' : 'button'}
                  onClick={wizard.state.isLastStep ? undefined : wizard.actions.goToNext}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering API...
                    </>
                  ) : wizard.state.isLastStep ? (
                    <>
                      <Save className="h-4 w-4" />
                      Add to catalog
                    </>
                  ) : (
                    'Preview'
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Wizard>
      </SheetContent>
    </Sheet>
  );
}
