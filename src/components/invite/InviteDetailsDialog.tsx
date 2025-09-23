import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Users,
  Mail,
  Calendar,
  Clock,
  Shield,
  Globe,
  Building,
  FolderOpen,
  RefreshCw,
  Ban,
  Eye,
  UserCheck,
  UserX,
  Copy,
  ExternalLink,
  History,
  Info
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { toast } from 'sonner';
import { 
  Invitation, 
  ROLE_CONFIG, 
  SCOPE_CONFIG 
} from './types';
import { mockAuditLogs } from './demo-data';

interface InviteDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: Invitation;
  onResend?: () => void;
  onCancel?: () => void;
}

export function InviteDetailsDialog({
  open,
  onOpenChange,
  invitation,
  onResend,
  onCancel
}: InviteDetailsDialogProps) {
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const getScopeIcon = (scope: string) => {
    const iconMap = {
      platform: Globe,
      workspace: Building,
      project: FolderOpen
    };
    return iconMap[scope as keyof typeof iconMap] || Building;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { color: 'text-warning', bgColor: 'bg-warning/10', icon: Clock },
      accepted: { color: 'text-success', bgColor: 'bg-success/10', icon: UserCheck },
      declined: { color: 'text-destructive', bgColor: 'bg-destructive/10', icon: UserX },
      expired: { color: 'text-muted-foreground', bgColor: 'bg-muted/10', icon: Clock },
      cancelled: { color: 'text-muted-foreground', bgColor: 'bg-muted/10', icon: Ban }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend?.();
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel?.();
      toast.success('Invitation cancelled successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to cancel invitation');
    } finally {
      setIsCancelling(false);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard');
  };

  const ScopeIcon = getScopeIcon(invitation.scope);
  const statusConfig = getStatusConfig(invitation.status);
  const StatusIcon = statusConfig.icon;

  const relatedAuditLogs = mockAuditLogs.filter(log => log.inviteId === invitation.id);

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isExpiringSoon = invitation.status === 'pending' && 
    new Date(invitation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 font-sans" aria-describedby="invite-details-description">
        <DialogHeader className="px-8 py-6 border-b border-border">
          <DialogTitle className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-3 rounded ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Invitation Details</h2>
                <Badge 
                  variant={invitation.status === 'pending' ? 'secondary' : 'outline'} 
                  className="text-sm font-medium px-2 py-1"
                >
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </Badge>
              </div>
              <p className="text-base text-muted-foreground font-medium">
                {invitation.inviteeEmail}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription id="invite-details-description" className="text-sm text-muted-foreground mt-3">
            View comprehensive details, activity history, and manage this invitation. 
            {invitation.status === 'pending' && ' You can resend or cancel pending invitations.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6">
          <Tabs defaultValue="details" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="details" className="gap-3 text-sm font-medium">
                <Info className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-3 text-sm font-medium">
                <History className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-8 mt-8">
            {/* Status Alert */}
            {(isExpired || isExpiringSoon) && (
              <Alert className={`p-4 ${isExpired ? 'border-destructive' : 'border-warning'}`}>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isExpired 
                    ? 'This invitation has expired and can no longer be accepted.'
                    : 'This invitation expires soon. Consider resending if needed.'
                  }
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-8">
              {/* Basic Information */}
              <Card className="border border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Invitation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-muted-foreground">Invitee Email</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">{invitation.inviteeEmail}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyInviteLink}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-muted-foreground">Invited By</span>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium text-foreground">{invitation.inviterName}</div>
                        <div className="text-sm text-muted-foreground">{invitation.inviterEmail}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-muted-foreground">Access Scope</span>
                      <div className="flex items-center gap-3">
                        <ScopeIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {invitation.scopeName || SCOPE_CONFIG[invitation.scope].label}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {invitation.scope}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-muted-foreground">Role</span>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium text-foreground">{ROLE_CONFIG[invitation.role].label}</div>
                        <div className="text-sm text-muted-foreground">
                          {ROLE_CONFIG[invitation.role].description}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* Personal Message */}
            {invitation.message && (
              <Card className="border border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    Personal Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-muted/20 rounded border border-border">
                    <p className="text-sm text-foreground italic leading-relaxed">
                      "{invitation.message}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-8 mt-8">
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {relatedAuditLogs.length > 0 ? (
                    relatedAuditLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border flex-shrink-0">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground capitalize">
                                {log.action.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                By {log.performedBy}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">
                              {format(new Date(log.performedAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {log.details?.reason && (
                            <div className="p-3 bg-muted/20 rounded border border-border">
                              <p className="text-sm text-foreground">
                                <span className="font-medium text-muted-foreground">Reason:</span> {log.details.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <History className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No activity logs available for this invitation.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-3 px-8 py-6 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm font-medium"
          >
            Close
          </Button>
          
          {invitation.status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={isResending}
                className="gap-3 text-sm font-medium"
              >
                {isResending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Resend Invitation
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
                className="gap-3 text-sm font-medium"
              >
                {isCancelling ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Cancel Invitation
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}