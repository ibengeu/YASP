import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
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
  UserCheck,
  UserX,
  Clock,
  Shield,
  Globe,
  Building,
  FolderOpen,
  Mail,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, formatDistance } from 'date-fns';
import { toast } from 'sonner';
import { 
  Invitation, 
  ROLE_CONFIG, 
  SCOPE_CONFIG 
} from './types';

interface InviteAcceptanceProps {
  invitation: Invitation | null;
  loading?: boolean;
  error?: string;
  onAccept?: (inviteId: string) => Promise<void>;
  onDecline?: (inviteId: string, reason?: string) => Promise<void>;
  onLoginRedirect?: () => void;
}

interface AcceptanceState {
  isAccepting: boolean;
  isDeclining: boolean;
  showDeclineDialog: boolean;
  declineReason: string;
}

export function InviteAcceptance({
  invitation,
  loading = false,
  error,
  onAccept,
  onDecline,
  onLoginRedirect
}: InviteAcceptanceProps) {
  const [state, setState] = useState<AcceptanceState>({
    isAccepting: false,
    isDeclining: false,
    showDeclineDialog: false,
    declineReason: ''
  });

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time remaining countdown
  useEffect(() => {
    if (!invitation || invitation.status !== 'pending') return;

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(invitation.expiresAt);
      
      if (expiry <= now) {
        setTimeRemaining('Expired');
        return;
      }
      
      const diff = expiry.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''} remaining`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''} remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [invitation]);

  const getScopeIcon = (scope: string) => {
    const iconMap = {
      platform: Globe,
      workspace: Building,
      project: FolderOpen
    };
    return iconMap[scope as keyof typeof iconMap] || Building;
  };

  const handleAccept = async () => {
    if (!invitation || !onAccept) return;

    setState(prev => ({ ...prev, isAccepting: true }));
    
    try {
      await onAccept(invitation.id);
      toast.success('Invitation accepted successfully! Welcome aboard! 🎉');
    } catch (error) {
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isAccepting: false }));
    }
  };

  const handleDecline = async () => {
    if (!invitation || !onDecline) return;

    setState(prev => ({ ...prev, isDeclining: true }));
    
    try {
      await onDecline(invitation.id, state.declineReason);
      toast.success('Invitation declined.');
      setState(prev => ({ ...prev, showDeclineDialog: false, declineReason: '' }));
    } catch (error) {
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isDeclining: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invalid Invitation</h3>
              <p className="text-muted-foreground">
                {error || 'This invitation link is invalid or has expired.'}
              </p>
            </div>
            <Button
              onClick={onLoginRedirect}
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ScopeIcon = getScopeIcon(invitation.scope);
  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isExpiringSoon = new Date(invitation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  // Already processed invitation
  if (invitation.status !== 'pending') {
    const statusConfig = {
      accepted: {
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/10',
        title: 'Invitation Already Accepted',
        description: 'You have already accepted this invitation and should have access to the workspace.'
      },
      declined: {
        icon: UserX,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        title: 'Invitation Declined',
        description: 'This invitation was previously declined.'
      },
      expired: {
        icon: Clock,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        title: 'Invitation Expired',
        description: 'This invitation has expired and can no longer be accepted.'
      },
      cancelled: {
        icon: AlertTriangle,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        title: 'Invitation Cancelled',
        description: 'This invitation has been cancelled by the sender.'
      }
    };

    const config = statusConfig[invitation.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className={`h-12 w-12 ${config.bgColor} rounded-full flex items-center justify-center mx-auto`}>
              <StatusIcon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
            <Button
              onClick={onLoginRedirect}
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Go to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-primary/5 via-background to-secondary/5 pt-16 pb-8">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">You're Invited!</h1>
              <p className="text-lg text-muted-foreground">
                {invitation.inviterName} has invited you to collaborate
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Expiration Warning */}
          {isExpired ? (
            <Alert className="border-destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired and can no longer be accepted.
              </AlertDescription>
            </Alert>
          ) : isExpiringSoon ? (
            <Alert className="border-warning">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This invitation expires soon: {timeRemaining}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This invitation {timeRemaining.toLowerCase()}
              </AlertDescription>
            </Alert>
          )}

          {/* Invitation Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ScopeIcon className="h-6 w-6 text-primary" />
                <div className="space-y-1">
                  <div className="text-xl">
                    {invitation.scopeName || SCOPE_CONFIG[invitation.scope].label}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal capitalize">
                    {invitation.scope} Access
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Information */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ROLE_CONFIG[invitation.role].icon}</span>
                    <Badge variant="outline" className="gap-1">
                      {ROLE_CONFIG[invitation.role].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_CONFIG[invitation.role].description}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Inviter Information */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <div>
                    <p className="font-medium">{invitation.inviterName}</p>
                    <p className="text-sm text-muted-foreground">{invitation.inviterEmail}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistance(new Date(invitation.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Message */}
              {invitation.message && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Personal message</p>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm italic">"{invitation.message}"</p>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {!isExpired && (
                <>
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleAccept}
                      disabled={state.isAccepting}
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      {state.isAccepting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Accept Invitation
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setState(prev => ({ ...prev, showDeclineDialog: true }))}
                      disabled={state.isAccepting || state.isDeclining}
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      <UserX className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Secure Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    This invitation is secured and can only be used once. 
                    {invitation.metadata?.domainRestricted && ' Domain restrictions apply.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Decline Dialog */}
      <Dialog 
        open={state.showDeclineDialog} 
        onOpenChange={(open) => setState(prev => ({ ...prev, showDeclineDialog: open }))}
      >
        <DialogContent aria-describedby="decline-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              Decline Invitation
            </DialogTitle>
            <DialogDescription id="decline-dialog-description">
              Are you sure you want to decline this invitation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <textarea
                placeholder="Let the inviter know why you're declining..."
                value={state.declineReason}
                onChange={(e) => setState(prev => ({ ...prev, declineReason: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {state.declineReason.length}/200
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showDeclineDialog: false, declineReason: '' }))}
              disabled={state.isDeclining}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={state.isDeclining}
              className="gap-2"
            >
              {state.isDeclining ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Declining...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  Decline Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}