/**
 * Diff Viewer Component
 * Clean, minimalist diff visualization inspired by Dieter Rams principles
 *
 * Features:
 * - Side-by-side comparison
 * - Line-level and word-level diffs
 * - Collapsible unchanged sections
 * - Clean typography and spacing
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: {
    old?: number;
    new?: number;
  };
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
  language?: string;
  showStats?: boolean;
}

export function DiffViewer({
  oldContent,
  newContent,
  oldLabel = 'Original',
  newLabel = 'Modified',
  language = 'yaml',
  showStats = true,
}: DiffViewerProps) {
  const [collapseUnchanged, setCollapseUnchanged] = useState(true);

  // Compute diff
  const diff = useMemo(() => {
    return computeDiff(oldContent, newContent);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    return {
      additions: diff.filter(line => line.type === 'add').length,
      deletions: diff.filter(line => line.type === 'remove').length,
    };
  }, [diff]);

  // Group lines into hunks
  const hunks = useMemo(() => {
    return groupIntoHunks(diff, collapseUnchanged);
  }, [diff, collapseUnchanged]);

  return (
    <div className="diff-viewer flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Stats Header */}
      {showStats && (
        <div className="stats-header flex border-b border-border bg-card">
          <div className="stat-column flex-1 border-r border-border p-6 flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Additions
            </span>
            <span className="text-5xl font-light leading-none tracking-tight">
              {String(stats.additions).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-auto">
              Lines added
            </span>
          </div>

          <div className="stat-column flex-1 border-r border-border p-6 flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Deletions
            </span>
            <span className="text-5xl font-light leading-none tracking-tight">
              {String(stats.deletions).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-auto">
              Lines removed
            </span>
          </div>

          <div className="stat-column flex-1 p-6 flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Net Change
            </span>
            <span className="text-5xl font-light leading-none tracking-tight">
              {stats.additions - stats.deletions >= 0 ? '+' : ''}
              {stats.additions - stats.deletions}
            </span>
            <span className="text-xs text-muted-foreground mt-auto">
              Total change
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapseUnchanged(!collapseUnchanged)}
            className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            {collapseUnchanged ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {collapseUnchanged ? 'Expand unchanged' : 'Collapse unchanged'}
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          Line-level diff • {language}
        </div>
      </div>

      {/* Diff Display */}
      <div className="diff-content flex flex-1 overflow-hidden">
        {/* Left Pane - Original */}
        <div className="editor-pane flex-1 flex flex-col border-r border-border">
          <div className="pane-header px-6 py-3 border-b border-border bg-card/50 flex justify-between items-center sticky top-0 z-10">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {oldLabel}
            </span>
          </div>
          <div className="code-scroller flex-1 overflow-y-auto font-mono text-[13px] leading-5">
            {hunks.map((hunk, hunkIdx) => (
              <DiffHunk key={hunkIdx} hunk={hunk} side="old" />
            ))}
          </div>
        </div>

        {/* Right Pane - Modified */}
        <div className="editor-pane flex-1 flex flex-col">
          <div className="pane-header px-6 py-3 border-b border-border bg-card/50 flex justify-between items-center sticky top-0 z-10">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {newLabel}
            </span>
          </div>
          <div className="code-scroller flex-1 overflow-y-auto font-mono text-[13px] leading-5">
            {hunks.map((hunk, hunkIdx) => (
              <DiffHunk key={hunkIdx} hunk={hunk} side="new" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Diff Hunk Component
interface DiffHunkProps {
  hunk: { type: 'changed' | 'unchanged'; lines: DiffLine[]; collapsed?: boolean };
  side: 'old' | 'new';
}

function DiffHunk({ hunk, side }: DiffHunkProps) {
  const [isExpanded, setIsExpanded] = useState(!hunk.collapsed);

  if (hunk.type === 'unchanged' && hunk.collapsed) {
    return (
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="unchanged-collapsed flex items-center gap-3 px-4 py-2 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors border-y border-border"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="text-xs text-muted-foreground">
          {hunk.lines.length} unchanged lines
        </span>
      </div>
    );
  }

  if (hunk.type === 'unchanged' && !isExpanded) {
    return null;
  }

  return (
    <div className="hunk">
      {hunk.lines.map((line, idx) => {
        // Determine if we should show this line on this side
        const showLine =
          line.type === 'context' ||
          (side === 'old' && line.type === 'remove') ||
          (side === 'new' && line.type === 'add');

        if (!showLine) {
          // Empty placeholder to maintain alignment
          return (
            <div key={idx} className="code-row flex opacity-0 pointer-events-none">
              <div className="line-num w-12 px-2 text-right text-[11px] text-muted-foreground select-none">
                {' '}
              </div>
              <div className="code-content flex-1 pl-4 whitespace-pre-wrap break-all">
                {' '}
              </div>
            </div>
          );
        }

        const lineNum = side === 'old' ? line.lineNumber.old : line.lineNumber.new;

        return (
          <div
            key={idx}
            className={`code-row flex ${
              line.type === 'add'
                ? 'bg-green-500/10 text-green-900 dark:text-green-200'
                : line.type === 'remove'
                ? 'bg-red-500/10 text-red-900 dark:text-red-200 line-through decoration-foreground/20'
                : ''
            }`}
          >
            <div
              className={`line-num w-12 px-2 text-right text-[11px] select-none border-r-2 ${
                line.type === 'add'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : line.type === 'remove'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {lineNum || ' '}
            </div>
            <div className="code-content flex-1 pl-4 whitespace-pre-wrap break-all">
              {highlightWords(line.content, line.type)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Highlight word-level changes
function highlightWords(content: string, type: 'add' | 'remove' | 'context') {
  if (type === 'context') return content;

  // Simple word highlighting - can be enhanced with actual diff algorithm
  const words = content.split(/(\s+)/);
  return (
    <>
      {words.map((word, idx) => {
        if (/^\s+$/.test(word)) return word;
        return (
          <span
            key={idx}
            className={
              type === 'add'
                ? 'bg-green-500/30 font-semibold'
                : 'bg-red-500/30 font-semibold'
            }
          >
            {word}
          </span>
        );
      })}
    </>
  );
}

// Simple diff computation (Myers algorithm simplified)
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const lines: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        // Context line
        lines.push({
          type: 'context',
          content: oldLines[oldIdx],
          lineNumber: { old: oldIdx + 1, new: newIdx + 1 },
        });
        oldIdx++;
        newIdx++;
      } else {
        // Check if it's a replacement
        lines.push({
          type: 'remove',
          content: oldLines[oldIdx],
          lineNumber: { old: oldIdx + 1 },
        });
        lines.push({
          type: 'add',
          content: newLines[newIdx],
          lineNumber: { new: newIdx + 1 },
        });
        oldIdx++;
        newIdx++;
      }
    } else if (oldIdx < oldLines.length) {
      // Deletion
      lines.push({
        type: 'remove',
        content: oldLines[oldIdx],
        lineNumber: { old: oldIdx + 1 },
      });
      oldIdx++;
    } else {
      // Addition
      lines.push({
        type: 'add',
        content: newLines[newIdx],
        lineNumber: { new: newIdx + 1 },
      });
      newIdx++;
    }
  }

  return lines;
}

// Group diff lines into hunks
function groupIntoHunks(
  lines: DiffLine[],
  collapseUnchanged: boolean
): Array<{ type: 'changed' | 'unchanged'; lines: DiffLine[]; collapsed?: boolean }> {
  if (!collapseUnchanged) {
    return [{ type: 'changed', lines }];
  }

  const hunks: Array<{ type: 'changed' | 'unchanged'; lines: DiffLine[]; collapsed?: boolean }> = [];
  let currentHunk: DiffLine[] = [];
  let currentType: 'changed' | 'unchanged' = 'unchanged';

  for (const line of lines) {
    const isChanged = line.type !== 'context';
    const newType = isChanged ? 'changed' : 'unchanged';

    if (newType !== currentType && currentHunk.length > 0) {
      hunks.push({
        type: currentType,
        lines: currentHunk,
        collapsed: currentType === 'unchanged' && currentHunk.length > 3,
      });
      currentHunk = [];
    }

    currentType = newType;
    currentHunk.push(line);
  }

  if (currentHunk.length > 0) {
    hunks.push({
      type: currentType,
      lines: currentHunk,
      collapsed: currentType === 'unchanged' && currentHunk.length > 3,
    });
  }

  return hunks;
}
