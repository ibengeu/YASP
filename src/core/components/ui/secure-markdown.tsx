import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeMarkdown, sanitizeURL } from '@/core/lib/sanitize';

interface SecureMarkdownProps {
  children: string;
  className?: string;
  components?: any;
}

/**
 * Secure wrapper for ReactMarkdown that sanitizes content and restricts dangerous features
 * This component should be used instead of ReactMarkdown directly for user-generated content
 */
export const SecureMarkdown: React.FC<SecureMarkdownProps> = ({
  children,
  className,
  components = {}
}) => {
  // Sanitize the markdown content before rendering
  const sanitizedContent = sanitizeMarkdown(children);

  // Secure component overrides
  const secureComponents = {
    // Sanitize and validate links
    a: ({ href, children, ...props }: any) => {
      const sanitizedHref = href ? sanitizeURL(href) : null;
      if (!sanitizedHref) {
        // If URL is invalid, render as plain text
        return <span {...props}>{children}</span>;
      }
      return (
        <a
          {...props}
          href={sanitizedHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },

    // Sanitize and validate images
    img: ({ src, alt, ...props }: any) => {
      const sanitizedSrc = src ? sanitizeURL(src) : null;
      if (!sanitizedSrc) {
        // If image URL is invalid, show alt text
        return <span className="text-muted-foreground">[Image: {alt || 'Invalid source'}]</span>;
      }
      return (
        <img
          {...props}
          src={sanitizedSrc}
          alt={alt || ''}
          className="max-w-full h-auto"
          onError={(e) => {
            // Replace broken images with alt text
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentNode;
            if (parent) {
              const span = document.createElement('span');
              span.textContent = `[Image: ${alt || 'Failed to load'}]`;
              span.className = 'text-muted-foreground';
              parent.replaceChild(span, target);
            }
          }}
        />
      );
    },

    // Disable HTML elements that could be dangerous
    script: () => null,
    style: () => null,
    iframe: () => null,
    object: () => null,
    embed: () => null,
    form: () => null,
    input: () => null,
    button: () => null,

    // Override any provided components with secure versions
    ...components
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={secureComponents}
        // Disable raw HTML to prevent XSS
        disallowedElements={['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button']}
        unwrapDisallowed={true}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};