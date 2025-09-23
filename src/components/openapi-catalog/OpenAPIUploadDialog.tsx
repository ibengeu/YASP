/**
 * OpenAPI Upload Dialog Component
 * Handles uploading and registering new OpenAPI specifications
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { OpenAPIUploadDialogProps, OpenAPIUploadRequest, ValidationError, OpenAPISpec } from './types';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { demoValidationPolicies } from './demo-data';
import { toast } from 'sonner';

const SUPPORTED_FORMATS = ['.json', '.yaml', '.yml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function OpenAPIUploadDialog({
  open,
  onOpenChange,
  onSpecUploaded,
  workspaceId,
  initialData,
}: OpenAPIUploadDialogProps) {
  const { activeWorkspace, workspaces } = useWorkspace();
  const [uploadStep, setUploadStep] = useState<'select' | 'validate' | 'configure' | 'upload'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Partial<OpenAPIUploadRequest>>({
    workspaceId: workspaceId || activeWorkspace?.id,
    visibility: 'workspace',
    autoPublish: false,
    ...initialData,
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      toast.error('Unsupported file format. Please upload a .json, .yaml, or .yml file.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    
    // Read file content
    try {
      const content = await file.text();
      setFileContent(content);
      setUploadStep('validate');
      
      // Auto-detect format
      const format = fileExtension === '.json' ? 'json' : 'yaml';
      setFormData(prev => ({ ...prev, file, format }));
      
      // Start validation
      validateOpenAPISpec(content, format);
    } catch (error) {
      toast.error('Failed to read file content.');
      console.error('File read error:', error);
    }
  }, []);

  const validateOpenAPISpec = async (content: string, format: 'json' | 'yaml') => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const errors: ValidationError[] = [];

      // Basic format validation
      try {
        if (format === 'json') {
          JSON.parse(content);
        }
        // For YAML, we'd normally use a YAML parser here
      } catch (e) {
        errors.push({
          id: 'format-error',
          type: 'schema',
          severity: 'error',
          message: `Invalid ${format.toUpperCase()} format`,
          path: '/',
          rule: 'format-validation'
        });
      }

      // Check for OpenAPI version
      if (!content.includes('openapi') && !content.includes('swagger')) {
        errors.push({
          id: 'openapi-missing',
          type: 'schema',
          severity: 'error',
          message: 'Missing OpenAPI version declaration',
          path: '/openapi',
          rule: 'openapi-version-required'
        });
      }

      // Simulate policy validation
      const enabledPolicies = demoValidationPolicies.filter(p => p.enabled);
      
      if (enabledPolicies.some(p => p.type === 'naming') && Math.random() > 0.7) {
        errors.push({
          id: 'naming-warning',
          type: 'naming',
          severity: 'warning',
          message: 'Some operation IDs do not follow naming conventions',
          path: '/paths/*/operationId',
          rule: 'operation-id-naming'
        });
      }

      if (enabledPolicies.some(p => p.type === 'security') && Math.random() > 0.6) {
        errors.push({
          id: 'security-warning',
          type: 'security',
          severity: 'warning',
          message: 'Some endpoints lack security requirements',
          path: '/paths/*/security',
          rule: 'security-required'
        });
      }

      setValidationErrors(errors);
      
      // Move to configuration step if no critical errors
      const hasErrors = errors.some(e => e.severity === 'error');
      if (!hasErrors) {
        setTimeout(() => setUploadStep('configure'), 500);
      }
    } catch (error) {
      toast.error('Validation failed. Please try again.');
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.workspaceId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStep('upload');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create mock spec object
      const newSpec: OpenAPISpec = {
        id: `spec-${Date.now()}`,
        workspaceId: formData.workspaceId,
        title: formData.displayName || selectedFile.name.replace(/\.(json|yaml|yml)$/, ''),
        description: 'Uploaded OpenAPI specification',
        version: '1.0.0',
        servers: [],
        paths: {},
        tags: [],
        displayName: formData.displayName,
        category: formData.category,
        owner: { id: 'current-user', name: 'Current User', email: 'user@example.com' },
        ownerContact: formData.ownerContact,
        fileName: selectedFile.name,
        fileFormat: selectedFile.name.endsWith('.json') ? 'json' : 'yaml',
        fileSize: selectedFile.size,
        originalContent: fileContent,
        status: formData.autoPublish ? 'published' : 'draft',
        validationStatus: validationErrors.length === 0 ? 'valid' : 'warnings',
        validationErrors,
        versionHistory: [],
        currentVersionId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: formData.autoPublish ? new Date() : undefined,
        visibility: formData.visibility || 'workspace',
        permissions: {
          canView: [],
          canEdit: [],
          canDelete: [],
          canDownload: [],
          canManageVersions: []
        },
        downloadCount: 0,
        auditLogs: []
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('OpenAPI specification uploaded successfully!');
      onSpecUploaded(newSpec);
      handleClose();
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setUploadStep('select');
    setSelectedFile(null);
    setFileContent('');
    setValidationErrors([]);
    setUploadProgress(0);
    setFormData({
      workspaceId: workspaceId || activeWorkspace?.id,
      visibility: 'workspace',
      autoPublish: false,
      ...initialData,
    });
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (uploadStep) {
      case 'select':
        return selectedFile !== null;
      case 'validate':
        return !isValidating && !validationErrors.some(e => e.severity === 'error');
      case 'configure':
        return formData.workspaceId && formData.visibility;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (uploadStep) {
      case 'select':
        return 'Select OpenAPI Specification';
      case 'validate':
        return 'Validate Specification';
      case 'configure':
        return 'Configure Upload';
      case 'upload':
        return 'Uploading Specification';
      default:
        return 'Upload OpenAPI Spec';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            Upload and register a new OpenAPI specification to your workspace catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-1 ${uploadStep === 'select' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${uploadStep === 'select' ? 'bg-primary' : 'bg-muted'}`} />
              Select
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center gap-1 ${uploadStep === 'validate' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${uploadStep === 'validate' ? 'bg-primary' : 'bg-muted'}`} />
              Validate
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center gap-1 ${uploadStep === 'configure' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${uploadStep === 'configure' ? 'bg-primary' : 'bg-muted'}`} />
              Configure
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center gap-1 ${uploadStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${uploadStep === 'upload' ? 'bg-primary' : 'bg-muted'}`} />
              Upload
            </div>
          </div>

          {/* File Selection Step */}
          {uploadStep === 'select' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Click to upload</strong> or drag and drop your OpenAPI specification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON, YAML, and YML formats (max 10MB)
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="mt-4 cursor-pointer"
                />
              </div>

              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)}KB)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Validation Step */}
          {uploadStep === 'validate' && (
            <div className="space-y-4">
              {isValidating ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Validating OpenAPI specification...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {validationErrors.length === 0 ? (
                    <Alert className="border-success">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <AlertDescription>
                        Validation completed successfully! No issues found.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className={validationErrors.some(e => e.severity === 'error') ? 'border-destructive' : 'border-warning'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Found {validationErrors.filter(e => e.severity === 'error').length} errors and{' '}
                        {validationErrors.filter(e => e.severity === 'warning').length} warnings.
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {validationErrors.map((error) => (
                        <div key={error.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className={`mt-0.5 ${
                            error.severity === 'error' ? 'text-destructive' : 
                            error.severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                {error.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {error.type}
                              </Badge>
                            </div>
                            <p className="text-sm">{error.message}</p>
                            {error.path && (
                              <p className="text-xs text-muted-foreground font-mono">{error.path}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Configuration Step */}
          {uploadStep === 'configure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace</Label>
                  <Select 
                    value={formData.workspaceId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, workspaceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Authentication">Authentication</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (Optional)</Label>
                <Input
                  id="displayName"
                  placeholder="Enter a custom display name"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerContact">Owner Contact</Label>
                <Input
                  id="ownerContact"
                  type="email"
                  placeholder="Enter contact email"
                  value={formData.ownerContact || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerContact: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label>Visibility</Label>
                <RadioGroup
                  value={formData.visibility}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, visibility: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Private - Only you can access
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="workspace" id="workspace" />
                    <Label htmlFor="workspace" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Workspace - All workspace members can access
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoPublish"
                  checked={formData.autoPublish}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoPublish: !!checked }))}
                />
                <Label htmlFor="autoPublish" className="text-sm">
                  Auto-publish after upload (otherwise will be saved as draft)
                </Label>
              </div>
            </div>
          )}

          {/* Upload Step */}
          {uploadStep === 'upload' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="space-y-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress < 100 ? 'Uploading specification...' : 'Upload completed!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          {uploadStep === 'select' && (
            <Button disabled={!canProceed()} onClick={() => setUploadStep('validate')}>
              Next
            </Button>
          )}
          {uploadStep === 'validate' && (
            <Button disabled={!canProceed()} onClick={() => setUploadStep('configure')}>
              Continue
            </Button>
          )}
          {uploadStep === 'configure' && (
            <Button disabled={!canProceed()} onClick={handleUpload}>
              Upload Specification
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}