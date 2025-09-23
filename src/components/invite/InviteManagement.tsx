import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Search,
  Filter,
  MoreHorizontal,
  Send,
  UserCheck,
  UserX,
  Clock,
  Ban,
  Eye,
  RefreshCw,
  Plus,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, formatDistance } from 'date-fns';
import { 
  Invitation, 
  InviteStatus, 
  InviteScope, 
  InviteRole,
  InviteStats,
  ROLE_CONFIG,
  SCOPE_CONFIG 
} from './types';
import { 
  mockInvitations, 
  mockInviteStats, 
  mockAuditLogs 
} from './demo-data';
import { InviteDialog } from './InviteDialog';
import { InviteDetailsDialog } from './InviteDetailsDialog';

interface InviteManagementProps {
  onInviteCreated?: (invitation: any) => void;
}

type FilterType = 'all' | InviteStatus;
type SortField = 'createdAt' | 'expiresAt' | 'inviteeEmail' | 'status';
type SortOrder = 'asc' | 'desc';

export function InviteManagement({ onInviteCreated }: InviteManagementProps) {
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
  const [stats] = useState<InviteStats>(mockInviteStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [scopeFilter, setScopeFilter] = useState<InviteScope | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  
  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  // Filter and sort invitations
  const filteredInvitations = useMemo(() => {
    let filtered = invitations;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(invite =>
        invite.inviteeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invite.inviterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invite.scopeName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invite => invite.status === statusFilter);
    }

    // Scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(invite => invite.scope === scopeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField.includes('At')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [invitations, searchQuery, statusFilter, scopeFilter, sortField, sortOrder]);

  const getStatusBadge = (status: InviteStatus) => {
    const config = {
      pending: { variant: 'secondary' as const },
      accepted: { variant: 'default' as const },
      declined: { variant: 'destructive' as const },
      expired: { variant: 'outline' as const },
      cancelled: { variant: 'outline' as const }
    };

    const { variant } = config[status];
    
    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };



  const handleResendInvitation = async (inviteId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInvitations(prev => prev.map(invite => 
        invite.id === inviteId 
          ? { ...invite, status: 'cancelled' as InviteStatus, cancelledAt: new Date().toISOString() }
          : invite
      ));
      
      toast.success('Invitation cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleViewDetails = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowDetailsDialog(true);
  };

  const handleBulkAction = async (action: 'resend' | 'cancel') => {
    if (selectedInvitations.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (action === 'cancel') {
        setInvitations(prev => prev.map(invite => 
          selectedInvitations.includes(invite.id)
            ? { ...invite, status: 'cancelled' as InviteStatus, cancelledAt: new Date().toISOString() }
            : invite
        ));
      }
      
      setSelectedInvitations([]);
      toast.success(`${selectedInvitations.length} invitation(s) ${action === 'resend' ? 'resent' : 'cancelled'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} invitations`);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invite Management</h1>
          <p className="text-muted-foreground">
            Manage and track all platform invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      </div>



      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, inviter, or workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: FilterType) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>


            </div>
          </div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedInvitations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedInvitations.length} invitation(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('resend')}
                      className="gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('cancel')}
                      className="gap-2"
                    >
                      <Ban className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Invitations ({filteredInvitations.length})</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>

                  <TableHead>Invitee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const isExpiringSoon = invitation.status === 'pending' && 
                    new Date(invitation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

                  return (
                    <TableRow 
                      key={invitation.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedInvitations.includes(invitation.id) ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleViewDetails(invitation)}
                    >

                      <TableCell>
                        <div className="font-medium">{invitation.inviteeEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_CONFIG[invitation.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invitation.status)}
                          {isExpiringSoon && (
                            <span className="text-xs text-warning">Soon</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{invitation.inviterName}</div>
                        <div className="text-xs text-muted-foreground">{invitation.inviterEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(invitation.createdAt), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistance(new Date(invitation.createdAt), new Date(), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(invitation.expiresAt), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistance(new Date(invitation.expiresAt), new Date(), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(invitation)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {invitation.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredInvitations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No invitations found</p>
              <p className="text-sm">
                {searchQuery || statusFilter !== 'all' || scopeFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Send your first invitation to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInviteCreated={(invite) => {
          // Add to local state
          const newInvitation: Invitation = {
            id: `inv-${Date.now()}`,
            inviterEmail: 'current.user@company.com',
            inviterName: 'Current User',
            inviteeEmail: invite.inviteeEmail,
            scope: invite.scope,
            scopeId: invite.scopeId,
            scopeName: invite.scope === 'platform' ? 'Platform' : 'Selected Workspace',
            role: invite.role,
            status: 'pending',
            token: `token-${Date.now()}`,
            expiresAt: new Date(Date.now() + (invite.expirationHours || 168) * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            message: invite.message
          };
          
          setInvitations(prev => [newInvitation, ...prev]);
          onInviteCreated?.(newInvitation);
        }}
      />

      {selectedInvitation && (
        <InviteDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          invitation={selectedInvitation}
          onResend={() => handleResendInvitation(selectedInvitation.id)}
          onCancel={() => handleCancelInvitation(selectedInvitation.id)}
        />
      )}
    </div>
  );
}