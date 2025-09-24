import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Lock, 
  Users, 
  Globe, 
  Loader2,
  Palette,
  Briefcase,
  Code,
  Database,
  Zap,
  Shield,
  Star,
  Heart,
  Coffee,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';
import { useContext } from 'react';
import { toast } from 'sonner';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const workspaceColors = [
  '#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de',
  '#5856d6', '#00c7be', '#ff2d92', '#6d6d6d', '#8e8e93'
];

const workspaceIcons = [
  '📁', '💼', '⚡', '🔥', '🚀', '💻', '📊', '🔧', '🎯', '💡',
  '🏢', '👥', '🛡️', '⭐', '❤️', '☕', '🎨', '📱', '🌍', '🔬'
];

const workspaceTemplates = [
  {
    name: 'Personal Workspace',
    description: 'For your personal projects and experiments',
    icon: '👤',
    color: '#007aff',
    visibility: 'private' as const,
    isPersonal: true,
  },
  {
    name: 'Team Project',
    description: 'Collaborate with your team on shared APIs',
    icon: '👥',
    color: '#34c759',
    visibility: 'team' as const,
    isPersonal: false,
  },
  {
    name: 'Open Source',
    description: 'Public workspace for community APIs',
    icon: '🌍',
    color: '#af52de',
    visibility: 'public' as const,
    isPersonal: false,
  },
];

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { createWorkspace, switchWorkspace, isLoading, currentUser } = useWorkspace();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007aff',
    icon: '📁',
    visibility: 'private' as 'private' | 'team' | 'public',
    isPersonal: false,
  });

  const handleTemplateSelect = (templateIndex: number) => {
    const template = workspaceTemplates[templateIndex];
    setSelectedTemplate(templateIndex);
    setFormData({
      name: template.name,
      description: template.description,
      color: template.color,
      icon: template.icon,
      visibility: template.visibility,
      isPersonal: template.isPersonal,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      const newWorkspace = await createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon,
        visibility: formData.visibility,
        isPersonal: formData.isPersonal,
        ownerId: currentUser?.id || 'user_001',
        settings: {
          allowComments: true,
          allowVersionHistory: true,
          requireApproval: formData.visibility === 'public',
          defaultPermission: formData.visibility === 'public' ? 'viewer' : 'editor',
        },
      });
      
      // The workspace context will automatically switch to newly created workspaces
      
      toast.success('Workspace created successfully!');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      color: '#007aff',
      icon: '📁',
      visibility: 'private',
      isPersonal: false,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const getVisibilityInfo = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return {
          icon: Globe,
          title: 'Public',
          description: 'Anyone can discover and view this workspace',
          color: 'text-green-600 bg-green-50 border-green-200',
        };
      case 'team':
        return {
          icon: Users,
          title: 'Team',
          description: 'Only invited team members can access',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      default:
        return {
          icon: Lock,
          title: 'Private',
          description: 'Only you can access this workspace',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-8">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Create New Workspace</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Set up a new workspace to organize your API collections and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2">
          {/* Templates */}
          {selectedTemplate === null && (
            <div className="space-y-4">
              <Label>Choose a template</Label>
              <div className="grid gap-3">
                {workspaceTemplates.map((template, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer border-border/50 hover:border-primary/30 hover:card-shadow-sm transition-all"
                      onClick={() => handleTemplateSelect(index)}
                    >
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: template.color }}
                          >
                            {template.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full border text-xs ${getVisibilityInfo(template.visibility).color}`}>
                            {getVisibilityInfo(template.visibility).title}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTemplate(-1)}
                  className="border-border/50 hover:bg-secondary/50"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Custom Workspace
                </Button>
              </div>
            </div>
          )}

          {/* Custom Form */}
          {selectedTemplate !== null && (
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedTemplate(null)}
                className="w-fit p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to templates
              </Button>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workspace name"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this workspace is for"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <Label>Appearance</Label>
                <div className="flex gap-4">
                  {/* Icon Selection */}
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Icon</Label>
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {workspaceIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`h-8 w-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                            formData.icon === icon 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Color</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {workspaceColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`h-8 w-8 rounded-md border-2 transition-all ${
                            formData.color === color 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon}
                  </div>
                  <div>
                    <div className="font-medium">{formData.name || 'Workspace Name'}</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.description || 'Workspace description'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-4">
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: 'private' | 'team' | 'public') => 
                    setFormData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['private', 'team', 'public'] as const).map((visibility) => {
                      const info = getVisibilityInfo(visibility);
                      return (
                        <SelectItem key={visibility} value={visibility}>
                          <div className="flex items-center gap-2">
                            <info.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{info.title}</div>
                              <div className="text-xs text-muted-foreground">{info.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim() || selectedTemplate === null}
              className="bg-primary hover:bg-primary/90 px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}