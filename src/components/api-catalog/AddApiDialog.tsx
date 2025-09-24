import React, { useState } from 'react';
import { Upload, FileText, Link, Plus, X, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AddApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiAdded: (api: any) => void;
}

type AddMethod = 'upload' | 'url' | 'manual';
type Step = 'method' | 'details';

export function AddApiDialog({ open, onOpenChange, onApiAdded }: AddApiDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    description: '',
    category: '',
    tags: '',
    lifecycle: 'development' as const,
    author: '',
    specUrl: '',
    specContent: '',
    file: null as File | null
  });

  const [addMethod, setAddMethod] = useState<AddMethod>('upload');
  const [currentStep, setCurrentStep] = useState<Step>('method');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.version || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create new API object
    const newApi = {
      id: `api-${Date.now()}`,
      title: formData.title,
      version: formData.version,
      description: formData.description,
      category: formData.category || 'General',
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      lifecycle: formData.lifecycle,
      lastUpdated: new Date().toISOString(),
      author: formData.author || 'You',
      isPublic: true,
      endpoints: Math.floor(Math.random() * 20) + 5
    };

    onApiAdded(newApi);
    toast.success('API added successfully!');
    onOpenChange(false);
    
    // Reset form
    setFormData({
      title: '',
      version: '',
      description: '',
      category: '',
      tags: '',
      lifecycle: 'development',
      author: '',
      specUrl: '',
      specContent: '',
      file: null
    });
    setCurrentStep('method');
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
      title: 'Paste Specification',
      description: 'Paste OpenAPI JSON or YAML content directly'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-8 bg-background border-0 card-shadow-lg">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              {currentStep === 'details' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
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

          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pr-2">
            <AnimatePresence mode="wait">
              {currentStep === 'method' ? (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="py-6 space-y-4"
                >
                  {methodOptions.map((method) => {
                    const Icon = method.icon;
                    return (
                      <Card
                        key={method.id}
                        className="cursor-pointer transition-all duration-200 hover:bg-secondary/30 hover:card-shadow border-border/50 group"
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
                  className="py-6"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
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
                        <CardContent className="p-6 space-y-4">
                          <Label htmlFor="spec-url" className="text-sm font-medium">
                            Specification URL
                          </Label>
                          <Input
                            id="spec-url"
                            placeholder="https://api.example.com/openapi.json"
                            value={formData.specUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, specUrl: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm"
                          />
                          <p className="text-sm text-muted-foreground">
                            Enter the URL to your OpenAPI specification file
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {addMethod === 'manual' && (
                      <Card className="border-border/50">
                        <CardContent className="p-6 space-y-4">
                          <Label htmlFor="spec-content" className="text-sm font-medium">
                            OpenAPI Specification
                          </Label>
                          <Textarea
                            id="spec-content"
                            placeholder={`Paste your OpenAPI specification here in JSON or YAML format...

Example:
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {}
}`}
                            value={formData.specContent || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, specContent: e.target.value }))}
                            rows={12}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 resize-none font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">
                            Paste your OpenAPI specification in JSON or YAML format
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Common form fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">API Name *</Label>
                        <Input
                          id="title"
                          placeholder="My Awesome API"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm px-4 py-3"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm px-4 py-3 h-auto">
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

                        <div className="space-y-2">
                          <Label htmlFor="lifecycle">Lifecycle Stage</Label>
                          <Select value={formData.lifecycle} onValueChange={(value) => setFormData(prev => ({ ...prev, lifecycle: value as any }))}>
                            <SelectTrigger className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm px-4 py-3 h-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="staging">Staging</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                              <SelectItem value="deprecated">Deprecated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="author">Author/Team</Label>
                          <Input
                            id="author"
                            placeholder="API Team"
                            value={formData.author}
                            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm px-4 py-3"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags</Label>
                          <Input
                            id="tags"
                            placeholder="authentication, users, v1"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 text-sm px-4 py-3"
                          />
                          <p className="text-sm text-muted-foreground">Separate tags with commas</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what your API does and its main features..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="bg-input-background border-border/50 focus:border-primary focus:ring-primary/30 resize-none text-sm px-4 py-3"
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
                              {formData.lifecycle && (
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                                  {formData.lifecycle}
                                </Badge>
                              )}
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
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep === 'details' && (
            <div className="pt-6 border-t border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-border/50 hover:bg-secondary/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary/90 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add API
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}