/**
 * OpenAPI Spec Details Component
 * Detailed view of an OpenAPI specification with metadata, validation, and version history
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  ArrowLeft,
  Download,
  Edit,
  MoreVertical,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Lock,
  Building,
  History,
  Code,
  ExternalLink,
  Copy,
  Share,
  Archive,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { OpenAPISpec, ValidationError, AuditLogEntry } from './types';
import { formatDistanceToNow, format } from 'date-fns@3.6.0';
import { toast } from 'sonner';

interface OpenAPISpecDetailsProps {
  spec: OpenAPISpec;
  onBack: () => void;
  onEdit?: (spec: OpenAPISpec) => void;
  onDownload?: (spec: OpenAPISpec) => void;
  onDelete?: (spec: OpenAPISpec) => void;
}

export function OpenAPISpecDetails({
  spec,
  onBack,
  onEdit,
  onDownload,
  onDelete,
}: OpenAPISpecDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRawContent, setShowRawContent] = useState(false);

  const getStatusColor = (status: OpenAPISpec['status']) => {
    switch (status) {
      case 'published':
        return 'bg-success text-success-foreground';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'validation_failed':
        return 'bg-destructive text-destructive-foreground';
      case 'pending_approval':
        return 'bg-warning text-warning-foreground';
      case 'archived':
        return 'bg-muted text-muted-foreground';
      case 'deprecated':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getValidationIcon = (status: OpenAPISpec['validationStatus']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warnings':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'validating':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getVisibilityIcon = (visibility: OpenAPISpec['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'organization':
        return <Building className="h-4 w-4" />;
      case 'workspace':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('URL copied to clipboard');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: spec.title,
        text: spec.description,
        url: window.location.href,
      });
    } else {
      handleCopyUrl();
    }
  };

  const renderValidationErrors = (errors: ValidationError[]) => {
    if (errors.length === 0) return null;

    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = acc[error.type] || [];
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    return (
      <div className="space-y-4">
        {Object.entries(errorsByType).map(([type, typeErrors]) => (
          <div key={type} className="space-y-2">
            <h4 className="font-medium text-sm capitalize flex items-center gap-2">
              {type} Issues
              <Badge variant="outline" className="text-xs">
                {typeErrors.length}
              </Badge>
            </h4>
            <div className="space-y-2">
              {typeErrors.map((error) => (
                <Alert key={error.id} className={`${
                  error.severity === 'error' ? 'border-destructive' : 
                  error.severity === 'warning' ? 'border-warning' : 'border-muted'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={error.severity === 'error' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {error.severity}
                        </Badge>
                        <span className="text-sm">{error.message}</span>
                      </div>
                      {error.path && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Path: {error.path}
                        </p>
                      )}
                      {error.rule && (
                        <p className="text-xs text-muted-foreground">
                          Rule: {error.rule}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAuditLog = (logs: AuditLogEntry[]) => {
    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 p-3 border rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {log.performedBy.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{log.performedBy.name}</span>
                <Badge variant="outline" className="text-xs">
                  {log.action.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {JSON.stringify(log.details, null, 2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{spec.displayName || spec.title}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{spec.title}</h1>
              <Badge className={getStatusColor(spec.status)}>
                {formatStatus(spec.status)}
              </Badge>
              <div className="flex items-center gap-1">
                {getValidationIcon(spec.validationStatus)}
                <span className="text-sm text-muted-foreground">
                  {formatStatus(spec.validationStatus)}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground max-w-2xl">{spec.description}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Version:</span>
                <Badge variant="outline" className="text-xs">{spec.version}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <span>Format:</span>
                <Badge variant="outline" className="text-xs uppercase">{spec.fileFormat}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <span>Size:</span>
                <span>{(spec.fileSize / 1024).toFixed(1)}KB</span>
              </div>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(spec.visibility)}
                <span className="capitalize">{spec.visibility}</span>
              </div>
              {spec.downloadCount > 0 && (
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{spec.downloadCount} downloads</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <Button variant="outline" onClick={() => onDownload(spec)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowRawContent(true)}>
                  <Code className="h-4 w-4 mr-2" />
                  View Raw Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                {onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(spec)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Spec
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(spec)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Spec
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="endpoints">
                Endpoints
                {Object.keys(spec.paths).length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {Object.keys(spec.paths).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="validation">
                Validation
                {spec.validationErrors.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {spec.validationErrors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="versions">
                Versions
                {spec.versionHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {spec.versionHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audit">
                Audit Log
                {spec.auditLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {spec.auditLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Tags */}
                  {spec.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {spec.tags.map((tag) => (
                            <Badge key={tag.name} variant="secondary">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Servers */}
                  {spec.servers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Servers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {spec.servers.map((server, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-mono text-sm">{server.url}</div>
                                {server.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {server.description}
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Owner</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {spec.owner.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{spec.owner.name}</span>
                        </div>
                      </div>

                      {spec.workspace && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Workspace</label>
                          <div className="text-sm mt-1">{spec.workspace.name}</div>
                        </div>
                      )}

                      {spec.category && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Category</label>
                          <div className="text-sm mt-1">{spec.category}</div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Created</label>
                        <div className="text-sm mt-1">
                          {format(spec.createdAt, 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Last Updated</label>
                        <div className="text-sm mt-1">
                          {format(spec.updatedAt, 'MMM dd, yyyy')}
                        </div>
                      </div>

                      {spec.publishedAt && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Published</label>
                          <div className="text-sm mt-1">
                            {format(spec.publishedAt, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Endpoints Tab */}
            <TabsContent value="endpoints">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(spec.paths).length > 0 ? (
                    <div className="space-y-2">
                      {Object.keys(spec.paths).map((path) => (
                        <div key={path} className="flex items-center justify-between p-3 border rounded-lg">
                          <code className="text-sm font-mono">{path}</code>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No endpoints defined in this specification
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Validation Results
                    {getValidationIcon(spec.validationStatus)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spec.validationErrors.length > 0 ? (
                    renderValidationErrors(spec.validationErrors)
                  ) : (
                    <Alert className="border-success">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <AlertDescription>
                        This OpenAPI specification passed all validation checks.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spec.versionHistory.length > 0 ? (
                    <div className="space-y-3">
                      {spec.versionHistory.map((version) => (
                        <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">v{version.version}</Badge>
                              {version.isActive && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            {version.changeLog && (
                              <p className="text-sm text-muted-foreground">{version.changeLog}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created by {version.createdBy.name} • {formatDistanceToNow(version.createdAt, { addSuffix: true })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No version history available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {spec.auditLogs.length > 0 ? (
                    renderAuditLog(spec.auditLogs)
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit log entries available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Raw Content Dialog */}
      <Dialog open={showRawContent} onOpenChange={setShowRawContent}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Raw OpenAPI Content</DialogTitle>
            <DialogDescription>
              {spec.fileName} • {spec.fileFormat.toUpperCase()} format
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full rounded border">
            <pre className="p-4 text-xs">
              <code>{spec.originalContent}</code>
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}