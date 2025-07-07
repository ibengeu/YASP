import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { quickStartTemplates, QuickStartTemplate } from '../templates/quick-start-templates';
import { Code, User, ShoppingCart, Users, Check } from 'lucide-react';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: QuickStartTemplate) => void;
}

const categoryIcons = {
  basic: Code,
  'user-management': User,
  'e-commerce': ShoppingCart,
  social: Users,
};

const categoryColors = {
  basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'user-management': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'e-commerce': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  social: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
};

const TemplateSelectionDialog: React.FC<TemplateSelectionDialogProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickStartTemplate | null>(null);

  const handleSelectTemplate = (template: QuickStartTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Choose a Template</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Get started quickly with a pre-built API specification template
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickStartTemplates.map((template) => {
              const IconComponent = categoryIcons[template.category];
              const isSelected = selectedTemplate?.id === template.id;
              
              return (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.category.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 bg-primary rounded-full">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Workspace:</span> {template.workspace.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Specs:</span> {template.specs.length} API specification{template.specs.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected Template Details */}
          {selectedTemplate && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-2">Template Details</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Workspace:</span> {selectedTemplate.workspace.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Description:</span> {selectedTemplate.workspace.description}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Included APIs:</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    {selectedTemplate.specs.map((spec, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {spec.name} ({spec.format.toUpperCase()})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedTemplate}
            >
              Create from Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionDialog;