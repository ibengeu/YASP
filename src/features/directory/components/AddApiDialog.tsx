import React, { useState } from 'react';
import { Upload, FileText, Link, Plus, X, ChevronRight } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { OpenApiDocument } from '@/common/openapi-spec';
import { useSpecContext } from '@/core/context/spec-context';

interface AddApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AddMethod = 'upload' | 'url' | 'manual';
type Step = 'method' | 'details';

export function AddApiDialog({ open, onOpenChange }: AddApiDialogProps) {
  const { saveSpec } = useSpecContext();
  // const navigate = useNavigate(); // For future use to navigate after successful creation

  console.log('AddApiDialog: Rendered with open =', open);

  const [formData, setFormData] = useState({
    title: '',
    version: '',
    description: '',
    category: '',
    tags: '',
    workspaceType: 'Personal' as const,
    author: '',
    specUrl: '',
    file: null as File | null,
    specContent: null as any
  });

  const [addMethod, setAddMethod] = useState<AddMethod>('upload');
  const [currentStep, setCurrentStep] = useState<Step>('method');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddApiDialog: Form submitted', { formData, addMethod });

    // Basic validation
    if (!formData.title || !formData.version || !formData.description) {
      console.error('AddApiDialog: Validation failed - missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('AddApiDialog: Validation passed, proceeding with save');

    setLoading(true);

    try {
      let specificationData: Partial<OpenApiDocument> = {};

      // Process based on add method
      if (addMethod === 'upload' && formData.file) {
        specificationData = await processUploadedFile(formData.file);
      } else if (addMethod === 'url' && formData.specUrl) {
        specificationData = await fetchSpecFromUrl(formData.specUrl);
      } else {
        // Manual creation - create basic OpenAPI structure
        specificationData = createBasicOpenApiSpec();
      }

      // Create the new specification document according to YASP's structure
      const newSpec: OpenApiDocument = {
        openapi: '3.1.0',
        info: {
          title: formData.title,
          version: formData.version,
          description: formData.description
        },
        paths: specificationData.paths || {},
        components: specificationData.components || {
          schemas: {},
          parameters: {},
          responses: {},
          headers: {},
          requestBodies: {},
          securitySchemes: {}
        },
        ...specificationData
      };

      console.log('AddApiDialog: Calling saveSpec with:', newSpec);
      await saveSpec(newSpec);
      console.log('AddApiDialog: saveSpec completed successfully');
      toast.success('API specification added successfully!');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding API specification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add API specification');
    } finally {
      setLoading(false);
    }
  };

  const processUploadedFile = async (file: File): Promise<Partial<OpenApiDocument>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsed;

          if (file.name.toLowerCase().endsWith('.json')) {
            parsed = JSON.parse(content);
          } else if (file.name.toLowerCase().endsWith('.yaml') || file.name.toLowerCase().endsWith('.yml')) {
            // For now, just try to parse as JSON - in a real app you'd use a YAML parser
            try {
              parsed = JSON.parse(content);
            } catch {
              reject(new Error('YAML parsing not yet implemented. Please use JSON format.'));
              return;
            }
          } else {
            reject(new Error('Unsupported file format. Please use JSON or YAML.'));
            return;
          }

          // Validate basic OpenAPI structure
          if (!parsed.openapi && !parsed.swagger) {
            reject(new Error('Invalid OpenAPI specification file.'));
            return;
          }

          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse specification file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  };

  const fetchSpecFromUrl = async (url: string): Promise<Partial<OpenApiDocument>> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch specification: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Received non-JSON response. YAML parsing not yet implemented.');
        }
      }

      // Validate basic OpenAPI structure
      if (!data.openapi && !data.swagger) {
        throw new Error('URL does not contain a valid OpenAPI specification.');
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch specification from URL.');
    }
  };

  const createBasicOpenApiSpec = (): Partial<OpenApiDocument> => {
    return {
      paths: {},
      components: {
        schemas: {},
        parameters: {},
        responses: {},
        headers: {},
        requestBodies: {},
        securitySchemes: {}
      }
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));

      // Extract title from filename if title is empty
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleMethodSelect = (method: AddMethod) => {
    setAddMethod(method);
    setCurrentStep('details');
  };

  const handleBack = () => {
    setCurrentStep('method');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      version: '',
      description: '',
      category: '',
      tags: '',
      workspaceType: 'Personal',
      author: '',
      specUrl: '',
      file: null,
      specContent: null
    });
    setCurrentStep('method');
    setAddMethod('upload');
  };

  const predefinedCategories = [
    'Authentication',
    'E-commerce',
    'Financial',
    'Communication',
    'Analytics',
    'Operations',
    'Content',
    'Location',
    'Storage',
    'Search',
    'Machine Learning',
    'General'
  ];

  const workspaceTypes = ['Personal', 'Team', 'Partner', 'Public'];

  const methodOptions = [
    {
      id: 'upload' as const,
      icon: Upload,
      title: 'Upload Specification',
      description: 'Import from OpenAPI JSON or YAML file',
      recommended: true
    },
    {
      id: 'url' as const,
      icon: Link,
      title: 'Import from URL',
      description: 'Fetch specification from remote URL'
    },
    {
      id: 'manual' as const,
      icon: FileText,
      title: 'Create Manually',
      description: 'Enter API details without specification'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-background border-0 shadow-lg">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              {currentStep === 'details' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={loading}
                  className="h-8 w-8 p-0 rounded-full hover:bg-secondary/50"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl tracking-tight">
                  {currentStep === 'method' ? 'Add New API' : 'API Details'}
                </DialogTitle>
                <DialogDescription className="mt-1 text-muted-foreground">
                  {currentStep === 'method'
                    ? 'Choose how you\'d like to add your API specification'
                    : 'Fill in the details for your API'
                  }
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-8 w-8 p-0 rounded-full hover:bg-secondary/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentStep === 'method' ? (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 space-y-4"
                >
                  {methodOptions.map((method) => {
                    const Icon = method.icon;
                    return (
                      <Card
                        key={method.id}
                        className="cursor-pointer transition-all duration-200 hover:bg-secondary/30 hover:shadow-sm border-border/50 group"
                        onClick={() => handleMethodSelect(method.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium tracking-tight">{method.title}</h4>
                                {method.recommended && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {method.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    {/* Method-specific content */}
                    {addMethod === 'upload' && (
                      <Card className="border-border/50">
                        <CardContent className="p-4">
                          <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                            <input
                              type="file"
                              accept=".json,.yaml,.yml"
                              onChange={handleFileChange}
                              className="hidden"
                              id="file-upload"
                              disabled={loading}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                              {formData.file ? (
                                <div className="space-y-1">
                                  <p className="font-medium text-primary">
                                    {formData.file.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Click to change file
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="font-medium">Drop your file here, or click to browse</p>
                                  <p className="text-sm text-muted-foreground">
                                    Supports JSON and YAML files
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {addMethod === 'url' && (
                      <Card className="border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <Label htmlFor="spec-url" className="text-sm font-medium">
                            Specification URL
                          </Label>
                          <Input
                            id="spec-url"
                            placeholder="https://api.example.com/openapi.json"
                            value={formData.specUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, specUrl: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                            disabled={loading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the URL to your OpenAPI specification file
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Common form fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">API Name *</Label>
                          <Input
                            id="title"
                            placeholder="My Awesome API"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                            disabled={loading}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="version">Version *</Label>
                          <Input
                            id="version"
                            placeholder="1.0.0"
                            value={formData.version}
                            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workspaceType">Workspace Type</Label>
                          <Select
                            value={formData.workspaceType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, workspaceType: value as any }))}
                            disabled={loading}
                          >
                            <SelectTrigger className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {workspaceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                            disabled={loading}
                          >
                            <SelectTrigger className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {predefinedCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          placeholder="authentication, users, v1"
                          value={formData.tags}
                          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                          className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your API does and its main features..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 resize-none"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {(formData.title || formData.description) && (
                      <Card className="border-border/50 bg-secondary/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium text-muted-foreground">Preview</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold tracking-tight">{formData.title || 'API Name'}</h4>
                              {formData.version && (
                                <Badge variant="outline" className="text-xs border-border/50">
                                  v{formData.version}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                                {formData.workspaceType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {formData.description || 'API description will appear here...'}
                            </p>
                            {formData.tags && (
                              <div className="flex flex-wrap gap-1">
                                {formData.tags.split(',').map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-border/50">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep === 'details' && (
            <div className="p-6 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-border/50 hover:bg-secondary/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 shadow-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add API
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}