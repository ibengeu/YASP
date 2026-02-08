/**
 * RegisterApiDrawer - API Registration Wizard
 *
 * Composable wizard architecture with:
 * - Reusable Wizard components (Wizard, WizardProgress, WizardStepContainer, WizardNavigation)
 * - Extracted step components (SpecUploadStep, BasicInfoStep, ReviewStep)
 * - Wizard state machine (useWizard hook)
 * - Better code organization and reusability
 *
 * Features:
 * - Type-safe form validation with Zod
 * - Auto-inference from OpenAPI specs
 * - Strict URL validation (SSRF prevention)
 * - Enhanced UX with badges, tooltips, and loading states
 * - Persistent analysis summary
 * - Three-step workflow: Specification → Basic Info → Review
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Wizard, WizardProgress, WizardStepContainer } from '@/components/wizard/Wizard';
import { useWizard } from '@/features/registration/hooks/useWizard';
import { SpecUploadStep } from '@/features/registration/components/steps/SpecUploadStep';
import { BasicInfoStep } from '@/features/registration/components/steps/BasicInfoStep';
import { ReviewStep } from '@/features/registration/components/steps/ReviewStep';
import { PersistentAnalysisSummary } from '@/features/registration/components/PersistentAnalysisSummary';
import {
  registrationSchema,
  type RegistrationFormData,
} from '@/features/registration/schemas/registration-schema';
import { inferAllData, type InferredData } from '@/features/registration/utils/spec-inference';
import { generateStubSpec } from '@/features/registration/utils/generate-stub-spec';
import { patchSpecServers } from '@/features/registration/utils/patch-spec-servers';

interface RegisterApiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  {
    id: 1,
    title: 'OpenAPI Specification',
    description: 'Provide your OpenAPI spec to auto-fill API details'
  },
  {
    id: 2,
    title: 'Basic Information',
    description: 'Review auto-filled details and add any missing information'
  },
  {
    id: 3,
    title: 'Review & Register',
    description: 'Confirm your API details before registering'
  },
] as const;

export function RegisterApiDrawer({ isOpen, onClose, onSuccess }: RegisterApiDrawerProps) {
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
      if (step === 2) {
        // Validate Basic Information step
        const isValid = await trigger(['name', 'description', 'version', 'endpoint']);
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

      // Validate OpenAPI format
      if (!parsed.openapi && !parsed.swagger) {
        throw new Error('Not a valid OpenAPI specification');
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
      let specContent = data.openapiSpec?.content || '';

      // Patch spec content: replace relative server URLs with resolved absolute URLs
      // so that editor and Try It Out get correct URLs when re-parsing stored content
      if (specContent && inferredData?.servers) {
        specContent = patchSpecServers(specContent, inferredData.servers);
      }

      // If no spec provided, generate stub spec with a health-check endpoint
      // Gap 2 fix: paths: {} breaks Try It Out; generateStubSpec adds GET /
      if (!specContent) {
        const yaml = await import('yaml');
        const stubSpec = generateStubSpec({
          name: data.name,
          version: data.version,
          description: data.description,
          endpoint: data.endpoint,
        });
        specContent = yaml.stringify(stubSpec);
      }

      // Create OpenAPI document with enhanced metadata
      await idbStorage.createSpec({
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
    <Drawer open={isOpen}  onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-xl">
        {/* Wizard Provider wraps everything to make context available */}
        <Wizard state={wizard.state} actions={wizard.actions} steps={wizard.steps} className="h-full flex flex-col">
          {/* Header */}
          <DrawerHeader className="border-b">
            <DrawerTitle>Register New API</DrawerTitle>
            <DrawerDescription>
              Add your API to the catalog by providing an OpenAPI specification or entering details manually.
              We'll auto-fill as much as we can from your spec.
            </DrawerDescription>
            <div className="text-xs text-muted-foreground mt-2">
              Step {wizard.state.currentStep} of {STEPS.length}: {STEPS[wizard.state.currentStep - 1].description}
            </div>

            {/* Progress steps */}
            <WizardProgress className="mt-6" />
          </DrawerHeader>

          {/* Persistent Analysis Summary */}
          {inferredData && (
            <PersistentAnalysisSummary
              inferredData={inferredData}
              currentStep={wizard.state.currentStep}
              className="border-b px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
            />
          )}

          {/* Wizard Content */}
          <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Step 1: OpenAPI Specification */}
              <WizardStepContainer step={1}>
                <SpecUploadStep
                  formData={formData}
                  setValue={setValue}
                  onSpecParsed={handleSpecParsed}
                  inferredData={inferredData}
                  isParsingSpec={isParsingSpec}
                  onSkip={wizard.actions.goToNext}
                />
              </WizardStepContainer>

              {/* Step 2: Basic Information */}
              <WizardStepContainer step={2}>
                <BasicInfoStep
                  register={register}
                  errors={errors}
                  fieldSources={fieldSources}
                  setFieldSources={setFieldSources}
                  watch={watch}
                />
              </WizardStepContainer>

              {/* Step 3: Review & Submit */}
              <WizardStepContainer step={3}>
                <ReviewStep formData={formData} />
              </WizardStepContainer>
            </div>

            {/* Footer Navigation */}
            <DrawerFooter className="border-t">
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
                      Register API
                    </>
                  ) : (
                    `Next: ${STEPS[wizard.state.currentStep]?.title || 'Continue'}`
                  )}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </Wizard>
      </DrawerContent>
    </Drawer>
  );
}
