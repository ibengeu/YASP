/**
 * CodeBlock — syntax-highlighted code block for documentation pages.
 * Uses a pre/code pattern compatible with any syntax highlighting solution.
 * Includes a copy-to-clipboard button.
 * Accessibility: role="region" with aria-label for screen readers.
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
    language?: string;
    filename?: string;
    children: string;
    className?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
    bash: 'bash',
    sh: 'shell',
    ts: 'TypeScript',
    tsx: 'TSX',
    js: 'JavaScript',
    jsx: 'JSX',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    css: 'CSS',
    html: 'HTML',
    rust: 'Rust',
    python: 'Python',
    py: 'Python',
};

export function CodeBlock({ language = 'text', filename, children, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const label = LANGUAGE_LABELS[language] ?? language;

    function handleCopy() {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <figure
            role="region"
            aria-label={filename ? `Code: ${filename}` : `${label} code block`}
            className={cn('my-4 rounded-lg border bg-muted/40 overflow-hidden', className)}
        >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {filename ? (
                        <span className="font-mono font-medium text-foreground">{filename}</span>
                    ) : (
                        <span className="font-medium uppercase tracking-wide">{label}</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied!' : 'Copy code'}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-2 py-1 hover:bg-background/60 cursor-pointer"
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                        <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>

            {/* Code body */}
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className={`language-${language} font-mono`}>{children}</code>
            </pre>
        </figure>
    );
}
