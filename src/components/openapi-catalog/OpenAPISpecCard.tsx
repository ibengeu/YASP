/**
 * OpenAPI Spec Card Component
 * Displays an individual OpenAPI specification in the catalog
 */

import React from 'react';
import {Card, CardContent, CardHeader} from '../ui/card';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Avatar, AvatarFallback} from '../ui/avatar';
import {Eye, FileText,} from 'lucide-react';
import {OpenAPISpec, OpenAPISpecCardProps} from './types';

export function OpenAPISpecCard({
                                    spec,
                                    onView,
                                    showSimpleView = false,
                                }: OpenAPISpecCardProps) {
    const getStatusColor = (status: OpenAPISpec['status']) => {
        switch (status) {
            case 'published':
                return 'bg-success text-success-foreground';
            case 'draft':
                return 'bg-muted text-muted-foreground';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <Card
            className="group relative transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full"
            onClick={() => onView && onView(spec)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0"/>
                            <h3 className="font-semibold text-sm leading-tight truncate">
                                {spec.displayName || spec.title}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                            <span className="font-mono">v{spec.version}</span>
                            <span>•</span>
                            <span className="uppercase  text-xs font-mono">{spec.fileFormat}</span>
                        </div>

                        <p className="text-muted-foreground leading-relaxed line-clamp-2 overflow-hidden">
                            {spec.description}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                    {/* Tags */}
                    {spec.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {spec.tags.slice(0, 3).map((tag) => (
                                <Badge
                                    key={tag.name}
                                    variant="secondary"
                                    className="px-2 py-0.5 h-auto"
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                            {spec.tags.length > 3 && (
                                <Badge variant="outline" className="px-2 py-0.5 h-auto">
                                    +{spec.tags.length - 3} more
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Category and Status */}
                    <div className="flex items-center gap-2">
                        {spec.category && (
                            <Badge variant="outline" className="text-xs">
                                {spec.category}
                            </Badge>
                        )}
                        <Badge className={`${getStatusColor(spec.status)}`}>
                            {formatStatus(spec.status)}
                        </Badge>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                                {spec.owner?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{spec.owner?.name || 'Unknown'}</span>
                    </div>
                </div>

                {/* Quick Actions - moved to bottom for consistent alignment */}
                <div className="flex gap-1 pt-3 mt-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            onView && onView(spec);
                        }}
                    >
                        <Eye className="h-3 w-3 mr-1"/>
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}