import DOMPurify from 'dompurify';

/**
 * Security-focused sanitization utilities for YASP
 * Implements comprehensive XSS protection for user-generated content
 */

// Configure DOMPurify with secure defaults
const createSecureDOMPurify = () => {
  // Allow only safe HTML elements and attributes for markdown content
  const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody',
    'tr', 'td', 'th', 'a', 'img', 'hr'
  ];

  const ALLOWED_ATTR = [
    'href', 'title', 'alt', 'src', 'width', 'height', 'class'
  ];

  // Configure DOMPurify instance
  DOMPurify.addHook('beforeSanitizeElements', (node, data) => {
    // Remove any script-like content
    if (data.tagName === 'script' || data.tagName === 'style') {
      node.remove();
    }
  });

  DOMPurify.addHook('beforeSanitizeAttributes', (node) => {
    // Remove event handlers and javascript: URLs
    const attributes = node.attributes;
    if (attributes) {
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attr = attributes[i];
        if (attr.name.startsWith('on') ||
            (attr.value && attr.value.toLowerCase().includes('javascript:'))) {
          node.removeAttribute(attr.name);
        }
      }
    }
  });

  return {
    ALLOWED_TAGS,
    ALLOWED_ATTR
  };
};

const { ALLOWED_TAGS, ALLOWED_ATTR } = createSecureDOMPurify();

/**
 * Sanitizes HTML content for safe rendering
 * Used for user-generated content that may contain HTML
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  });
};

/**
 * Sanitizes markdown content before rendering
 * Used specifically for OpenAPI spec descriptions
 */
export const sanitizeMarkdown = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  // Basic markdown sanitization - remove potentially dangerous patterns
  let sanitized = markdown
    // Remove HTML script tags
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    // Remove HTML style tags
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (except safe image formats)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|svg\+xml))[^;]*/gi, '')
    // Remove potentially dangerous HTML attributes
    .replace(/\s(on\w+|style|srcdoc|sandbox)=[^>\s]*/gi, '');

  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000) + '... (content truncated for security)';
  }

  return sanitized;
};

/**
 * Sanitizes text content for safe display
 * Used for titles, names, and other plain text fields
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags and limit length
  const sanitized = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, (char) => { // Escape remaining dangerous characters
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });

  // Limit length
  if (sanitized.length > 500) {
    return sanitized.substring(0, 500) + '...';
  }

  return sanitized;
};

/**
 * Sanitizes URLs to prevent SSRF and other URL-based attacks
 * Used for validating external API URLs and links
 */
export const sanitizeURL = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    // Prevent access to private networks
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost and private IPs
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
      return null;
    }

    // Block metadata endpoints
    if (hostname === '169.254.169.254') {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

/**
 * Validates and sanitizes OpenAPI specification content
 * Used when importing or processing OpenAPI specs
 */
export const sanitizeOpenAPISpec = (spec: any): any => {
  if (!spec || typeof spec !== 'object') {
    return null;
  }

  // Deep clone to avoid modifying original
  const sanitized = JSON.parse(JSON.stringify(spec));

  // Recursively sanitize string values
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeMarkdown(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key itself
        const sanitizedKey = sanitizeText(key);
        if (sanitizedKey) {
          result[sanitizedKey] = sanitizeObject(value);
        }
      }
      return result;
    }
    return obj;
  };

  return sanitizeObject(sanitized);
};