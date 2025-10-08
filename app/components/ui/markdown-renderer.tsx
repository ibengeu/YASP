import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {sanitizeMarkdown} from '@/lib/sanitize';
import {cn} from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * MarkdownRenderer - Safely renders markdown content with GitHub Flavored Markdown support
 * Uses sanitization to prevent XSS attacks while supporting rich markdown formatting
 */
export function MarkdownRenderer({content, className}: MarkdownRendererProps) {
    if (!content) return null;

    // Sanitize the markdown content before rendering
    const sanitizedContent = sanitizeMarkdown(content);

    return (
        <div className={cn('w-full text-muted-foreground', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Paragraphs
                    p: ({node, ...props}) => (
                        <p {...props} className="leading-relaxed mb-4 last:mb-0"/>
                    ),
                    // Headings
                    h1: ({node, ...props}) => (
                        <h1 {...props} className="text-xl font-medium text-foreground mb-3 mt-6 first:mt-0"/>
                    ),
                    h2: ({node, ...props}) => (
                        <h2 {...props} className="text-lg font-medium text-foreground mb-2 mt-5 first:mt-0"/>
                    ),
                    h3: ({node, ...props}) => (
                        <h3 {...props} className="text-base font-medium text-foreground mb-2 mt-4 first:mt-0"/>
                    ),
                    h4: ({node, ...props}) => (
                        <h4 {...props} className="text-sm font-medium text-foreground mb-2 mt-3 first:mt-0"/>
                    ),
                    h5: ({node, ...props}) => (
                        <h5 {...props} className="text-sm font-medium text-foreground mb-2 mt-3 first:mt-0"/>
                    ),
                    h6: ({node, ...props}) => (
                        <h6 {...props} className="text-sm font-medium text-foreground mb-2 mt-3 first:mt-0"/>
                    ),
                    // Links
                    a: ({node, ...props}) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        />
                    ),
                    // Lists
                    ul: ({node, ...props}) => (
                        <ul {...props} className="list-disc list-inside mb-4 space-y-1"/>
                    ),
                    ol: ({node, ...props}) => (
                        <ol {...props} className="list-decimal list-inside mb-4 space-y-1"/>
                    ),
                    li: ({node, ...props}) => (
                        <li {...props} className="text-muted-foreground"/>
                    ),
                    // Code
                    code: ({node, inline, ...props}) =>
                        inline ? (
                            <code
                                {...props}
                                className="text-xs bg-muted px-1 py-0.5 rounded font-mono"
                            />
                        ) : (
                            <code {...props} className="text-xs font-mono"/>
                        ),
                    pre: ({node, ...props}) => (
                        <pre
                            {...props}
                            className="bg-muted text-foreground text-xs p-3 rounded overflow-x-auto mb-4"
                        />
                    ),
                    // Emphasis
                    strong: ({node, ...props}) => (
                        <strong {...props} className="font-semibold text-foreground"/>
                    ),
                    em: ({node, ...props}) => (
                        <em {...props} className="italic"/>
                    ),
                    // Blockquotes
                    blockquote: ({node, ...props}) => (
                        <blockquote
                            {...props}
                            className="border-l-2 border-primary pl-4 mb-4 text-muted-foreground italic"
                        />
                    ),
                    // Tables
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto mb-4">
                            <table {...props} className="min-w-full text-sm border-collapse"/>
                        </div>
                    ),
                    thead: ({node, ...props}) => (
                        <thead {...props} className="border-b border-border"/>
                    ),
                    tbody: ({node, ...props}) => (
                        <tbody {...props} className="divide-y divide-border"/>
                    ),
                    tr: ({node, ...props}) => (
                        <tr {...props}/>
                    ),
                    th: ({node, ...props}) => (
                        <th {...props} className="px-3 py-2 text-left font-medium text-foreground"/>
                    ),
                    td: ({node, ...props}) => (
                        <td {...props} className="px-3 py-2 text-muted-foreground"/>
                    ),
                    // Horizontal rule
                    hr: ({node, ...props}) => (
                        <hr {...props} className="border-border my-4"/>
                    ),
                }}
            >
                {sanitizedContent}
            </ReactMarkdown>
        </div>
    );
}
