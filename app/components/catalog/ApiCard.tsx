import { Shield, Clock, Tag, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenApiDocument } from '@/core/storage/storage-schema';
import { SCORE_THRESHOLDS, getQualityLabel, getScoreColor, getWorkspaceColor } from '@/lib/constants';

interface ApiCardProps {
  spec: OpenApiDocument;
  onClick: (spec: OpenApiDocument) => void;
  onDelete?: (id: string) => void;
}

/**
 * ApiCard Component
 * Modern card component for API catalog
 * Features:
 * - Hover border effect with primary color
 * - Status badge (active/deprecated/draft)
 * - Title, description, metadata
 * - Tags as pills
 * - Compliance and security scores with icons
 * - Context menu for actions
 *
 * Security:
 * - Mitigation for OWASP A01:2025 – Broken Access Control: Spec data is from IndexedDB, access controlled
 * - Mitigation for OWASP A07:2025 – Injection: Content is sanitized before display
 */
export function ApiCard({ spec, onClick, onDelete }: ApiCardProps) {
  const score = spec.metadata.score || 0;

  // Determine status badge
  const getStatusBadge = () => {
    if (spec.metadata.syncStatus === 'synced') {
      return { label: 'Active', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' };
    }
    if (spec.content.includes('deprecated: true')) {
      return { label: 'Deprecated', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    return { label: 'Draft', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' };
  };

  // Get quality badge based on score
  const getQualityBadge = () => {
    if (score >= SCORE_THRESHOLDS.excellent) {
      return { icon: CheckCircle, label: getQualityLabel(score), color: 'text-green-600 dark:text-green-400' };
    }
    if (score >= SCORE_THRESHOLDS.good) {
      return { icon: AlertCircle, label: getQualityLabel(score), color: 'text-amber-600 dark:text-amber-400' };
    }
    return { icon: XCircle, label: getQualityLabel(score), color: 'text-red-600 dark:text-red-400' };
  };

  const workspaceColor = getWorkspaceColor(spec.metadata.workspaceType);

  const statusBadge = getStatusBadge();
  const qualityBadge = getQualityBadge();
  const QualityIcon = qualityBadge.icon;

  return (
    <div
      role="button"
      onClick={() => onClick(spec)}
      className={cn(
        'bg-white dark:bg-[#0a0a0a] rounded-lg border border-border',
        'hover:border-primary transition-all duration-200',
        'p-5 cursor-pointer group relative overflow-hidden',
        'flex flex-col w-full'
      )}
    >
      {/* Status and Workspace Badges */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', statusBadge.color)}>
          {statusBadge.label}
        </div>
        <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', workspaceColor)}>
          {spec.metadata.workspaceType}
        </div>
      </div>

      {/* Title and Description */}
      <h3 className="text-base font-semibold text-card-foreground mb-1 group-hover:text-primary transition-colors">
        {spec.title}
      </h3>
      {spec.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {spec.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {spec.version}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(spec.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Tags */}
      {spec.metadata.tags && spec.metadata.tags.length > 0 && (
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {spec.metadata.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {spec.metadata.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{spec.metadata.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Compliance Score */}
      <div className="border-t border-border pt-3 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <QualityIcon className={cn('w-4 h-4', qualityBadge.color)} />
            <span className="text-xs text-muted-foreground">{qualityBadge.label}</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">{score}%</span>
        </div>
        <div className="bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              getScoreColor(score)
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Security Badge (if has security schemes) */}
      {spec.content.includes('securitySchemes') && (
        <div className="mt-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <Shield className="w-3 h-3" />
          <span>Auth Configured</span>
        </div>
      )}

      {/* Delete Action (optional) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(spec.id);
          }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
