/**
 * ReviewStep - Step 2 of API Registration Wizard
 *
 * Final review of all registration details before submission.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';

export interface ReviewStepProps {
  formData: RegistrationFormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-sm">{formData.name || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{formData.description || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Version</p>
            <p className="text-sm">{formData.version || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Base URL</p>
            <p className="text-sm font-mono text-xs">{formData.endpoint || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="capitalize mt-1">
              {formData.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spec</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">How it was added</p>
            <p className="text-sm capitalize">
              {formData.openapiSpec?.source ? (
                <Badge variant="secondary">{formData.openapiSpec.source}</Badge>
              ) : (
                'No spec provided'
              )}
            </p>
          </div>
          {formData.openapiSpec?.fileName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">File name</p>
              <p className="text-sm font-mono text-xs">{formData.openapiSpec.fileName}</p>
            </div>
          )}
          {formData.openapiSpec?.content && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Size</p>
              <p className="text-sm">{(formData.openapiSpec.content.length / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {formData.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
