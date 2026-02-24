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
          <Label htmlFor="name">Name</Label>
          {fieldSources.name === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">We pulled this from your spec. Feel free to edit it.</p>
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
          placeholder="e.g. Payments API"
          className={cn(
            fieldSources.name === 'inferred' && 'border-secondary focus-visible:ring-secondary',
            fieldSources.name === 'manual' && formValues.name && 'border-ring',
            errors.name && 'border-destructive'
          )}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="description">Description</Label>
          {fieldSources.description === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">We pulled this from your spec. Feel free to edit it.</p>
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
          placeholder="What does this API do?"
          className={cn(
            fieldSources.description === 'inferred' && 'border-secondary focus-visible:ring-secondary',
            fieldSources.description === 'manual' && formValues.description && 'border-ring',
            errors.description && 'border-destructive'
          )}
        />
        {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
      </div>

      {/* Version */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="version">Version</Label>
          {fieldSources.version === 'inferred' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Filled from spec
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">We pulled this from your spec. Feel free to edit it.</p>
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
          placeholder="e.g. 1.0.0"
          className={cn(
            fieldSources.version === 'inferred' && 'border-secondary focus-visible:ring-secondary',
            fieldSources.version === 'manual' && formValues.version && 'border-ring',
            errors.version && 'border-destructive'
          )}
        />
        {errors.version && <p className="text-xs text-destructive mt-1">{errors.version.message}</p>}
      </div>
    </div>
  );
}
