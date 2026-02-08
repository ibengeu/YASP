/**
 * ReviewStep - Step 3 of API Registration Wizard
 *
 * Final review of all registration details before submission.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RegistrationFormData } from '@/features/registration/schemas/registration-schema';

export interface ReviewStepProps {
  formData: RegistrationFormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Review your API details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">API Name</p>
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
            <p className="text-sm font-medium text-muted-foreground">Endpoint / Base URL</p>
            <p className="text-sm font-mono text-xs">{formData.endpoint || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAPI Specification</CardTitle>
          <CardDescription>Specification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Source</p>
            <p className="text-sm capitalize">
              {formData.openapiSpec?.source ? (
                <Badge variant="secondary">{formData.openapiSpec.source}</Badge>
              ) : (
                'No specification provided'
              )}
            </p>
          </div>
          {formData.openapiSpec?.fileName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">File Name</p>
              <p className="text-sm font-mono text-xs">{formData.openapiSpec.fileName}</p>
            </div>
          )}
          {formData.openapiSpec?.content && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Specification Size</p>
              <p className="text-sm">{(formData.openapiSpec.content.length / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {formData.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Organization and categorization</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>API registration status</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {formData.status}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
