/**
 * BasicInfoStep - Step 2 of API Registration Wizard
 *
 * Collects basic API information with enhanced visual feedback
 * for auto-filled fields and validation states.
 */

import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';

export interface BasicInfoStepProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  fieldSources: Record<string, 'manual' | 'inferred'>;
  setFieldSources: React.Dispatch<React.SetStateAction<Record<string, 'manual' | 'inferred'>>>;
  watch: UseFormWatch<RegistrationFormData>;
}

export function BasicInfoStep({ register, errors, fieldSources, setFieldSources, watch }: BasicInfoStepProps) {
  const formValues = watch();

  return (
    <div className="space-y-4">
      {/* API Name */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="name">API Name *</Label>
          {fieldSources.name === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Auto-filled from your spec. You can edit if needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Input
          id="name"
          {...register('name', {
            onChange: () => setFieldSources((prev) => ({ ...prev, name: 'manual' })),
          })}
          placeholder="my-payment-api"
          className={cn(
            fieldSources.name === 'inferred' && 'border-emerald-500 focus-visible:ring-emerald-500',
            fieldSources.name === 'manual' && formValues.name && 'border-blue-500',
            errors.name && 'border-destructive'
          )}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="description">Description *</Label>
          {fieldSources.description === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Auto-filled from your spec. You can edit if needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Textarea
          id="description"
          {...register('description', {
            onChange: () => setFieldSources((prev) => ({ ...prev, description: 'manual' })),
          })}
          rows={4}
          placeholder="Describe what this API does..."
          className={cn(
            fieldSources.description === 'inferred' && 'border-emerald-500 focus-visible:ring-emerald-500',
            fieldSources.description === 'manual' && formValues.description && 'border-blue-500',
            errors.description && 'border-destructive'
          )}
        />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
      </div>

      {/* Version */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="version">Version *</Label>
          {fieldSources.version === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Auto-filled from your spec. You can edit if needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Input
          id="version"
          {...register('version', {
            onChange: () => setFieldSources((prev) => ({ ...prev, version: 'manual' })),
          })}
          placeholder="v1.0.0"
          className={cn(
            fieldSources.version === 'inferred' && 'border-emerald-500 focus-visible:ring-emerald-500',
            fieldSources.version === 'manual' && formValues.version && 'border-blue-500',
            errors.version && 'border-destructive'
          )}
        />
        {errors.version && <p className="text-xs text-destructive mt-1">{errors.version.message}</p>}
      </div>

      {/* Base URL */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="endpoint">Base URL *</Label>
          {fieldSources.endpoint === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Auto-filled from your spec. You can edit if needed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Input
          id="endpoint"
          type="url"
          {...register('endpoint', {
            onChange: () => setFieldSources((prev) => ({ ...prev, endpoint: 'manual' })),
          })}
          placeholder="https://api.example.com"
          className={cn(
            fieldSources.endpoint === 'inferred' && 'border-emerald-500 focus-visible:ring-emerald-500',
            fieldSources.endpoint === 'manual' && formValues.endpoint && 'border-blue-500',
            errors.endpoint && 'border-destructive'
          )}
        />
        <p className="text-xs text-muted-foreground mt-1">Your API's root URL without any path</p>
        {errors.endpoint && <p className="text-xs text-destructive mt-1">{errors.endpoint.message}</p>}
      </div>
    </div>
  );
}
