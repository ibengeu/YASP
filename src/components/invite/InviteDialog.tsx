import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { Alert, AlertDescription } from '../ui/alert';
import { 
  Users, 
  Mail, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  InviteScope, 
  InviteRole, 
  CreateInviteRequest,
  ROLE_CONFIG,
  SCOPE_CONFIG,
  SCOPE_HIERARCHY
} from './types';
import { mockWorkspaces, mockProjects, mockInvitePolicy } from './demo-data';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: InviteScope;
  defaultScopeId?: string;
  onInviteCreated?: (invite: CreateInviteRequest) => void;
}

interface EmailValidation {
  isValid: boolean;
  isDomainAllowed: boolean;
  message?: string;
}

export function InviteDialog({
  open,
  onOpenChange,
  defaultScope = 'workspace',
  defaultScopeId,
  onInviteCreated
}: InviteDialogProps) {
  const [formData, setFormData] = useState<CreateInviteRequest>({
    inviteeEmail: '',
    scope: 'workspace',
    scopeId: defaultScopeId,
    role: 'member',
    expirationHours: mockInvitePolicy.defaultExpirationHours,
    message: '',
    requireApproval: false
  });

  const [emailValidation, setEmailValidation] = useState<EmailValidation>({
    isValid: false,
    isDomainAllowed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        inviteeEmail: '',
        scope: 'workspace',
        scopeId: defaultScopeId,
        role: 'member',
        expirationHours: mockInvitePolicy.defaultExpirationHours,
        message: '',
        requireApproval: false
      });
      setEmailValidation({ isValid: false, isDomainAllowed: false });

    }
  }, [open, defaultScopeId]);

  // Validate email
  useEffect(() => {
    if (!formData.inviteeEmail) {
      setEmailValidation({ isValid: false, isDomainAllowed: false });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(formData.inviteeEmail);
    
    if (!isValid) {
      setEmailValidation({
        isValid: false,
        isDomainAllowed: false,
        message: 'Please enter a valid email address'
      });
      return;
    }

    const domain = formData.inviteeEmail.split('@')[1];
    const isDomainAllowed = mockInvitePolicy.domainRestrictions.length === 0 || 
      mockInvitePolicy.domainRestrictions.includes(domain);

    setEmailValidation({
      isValid,
      isDomainAllowed,
      message: !isDomainAllowed ? 
        `Domain @${domain} is not in the allowed domains list` : undefined
    });
  }, [formData.inviteeEmail]);

  const handleInputChange = (field: keyof CreateInviteRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAvailableRoles = (): InviteRole[] => {
    const scopeRoles = SCOPE_HIERARCHY['workspace'] || [];
    return mockInvitePolicy.allowedRoles.filter(role => scopeRoles.includes(role));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailValidation.isValid || !emailValidation.isDomainAllowed) {
      toast.error('Please fix email validation errors');
      return;
    }

    // Removed scope validation since we're using default workspace scope

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onInviteCreated?.(formData);
      toast.success('Invitation sent successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = emailValidation.isValid && 
    emailValidation.isDomainAllowed && 
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0" aria-describedby="invite-dialog-description">
        <DialogHeader className="space-y-4 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl text-left">
            <Users className="h-5 w-5 text-primary" />
            Send Invitation
          </DialogTitle>
          <DialogDescription id="invite-dialog-description" className="text-sm text-muted-foreground text-left">
            Invite someone to collaborate on your workspace. They'll receive an email with instructions to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6">
          {/* Email Input */}
          <div className="space-y-3">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={formData.inviteeEmail}
              onChange={(e) => handleInputChange('inviteeEmail', e.target.value)}
              className={`${
                formData.inviteeEmail && !emailValidation.isValid ? 'border-destructive' :
                formData.inviteeEmail && emailValidation.isValid && emailValidation.isDomainAllowed ? 'border-success' :
                ''
              }`}
            />
            <AnimatePresence>
              {formData.inviteeEmail && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  {emailValidation.message && (
                    <div className="flex items-center gap-2 text-xs">
                      {emailValidation.isValid && emailValidation.isDomainAllowed ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                      <span className={emailValidation.isValid && emailValidation.isDomainAllowed ? 'text-success' : 'text-destructive'}>
                        {emailValidation.message}
                      </span>
                    </div>
                  )}
                  {emailValidation.isValid && emailValidation.isDomainAllowed && (
                    <div className="flex items-center gap-2 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      Email address is valid and allowed
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Role Assignment</Label>
            <Select
              value={formData.role}
              onValueChange={(value: InviteRole) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{ROLE_CONFIG[formData.role].icon}</span>
                    <span>{ROLE_CONFIG[formData.role].label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-lg">{ROLE_CONFIG[role].icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ROLE_CONFIG[role].label}</span>
                          <Badge variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ROLE_CONFIG[role].description}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Message */}
          <div className="space-y-3">
            <Label htmlFor="message" className="text-sm font-medium">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.message?.length || 0}/500
            </div>
          </div>


        </form>

        <DialogFooter className="gap-3 pt-6 px-6 pb-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-2 px-6"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}