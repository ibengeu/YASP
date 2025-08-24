/**
 * SSRF (Server-Side Request Forgery) Protection Module
 * Implements comprehensive URL validation and request filtering
 */

import { z } from 'zod';

// Private network ranges (RFC 1918, RFC 3927, RFC 4193)
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^127\./, // 127.0.0.0/8 (loopback)
  /^0\./, // 0.0.0.0/8 (this network)
  
  // IPv6 private ranges
  /^::1$/, // ::1 (loopback)
  /^fe80:/, // fe80::/10 (link-local)
  /^fc00:/, // fc00::/7 (unique local)
  /^fd00:/, // fd00::/8 (unique local)
  /^::ffff:/, // ::ffff:0:0/96 (IPv4-mapped)
];

// Localhost variants
const LOCALHOST_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '*.local',
  'local.',
];

// Dangerous ports commonly used for internal services
const DANGEROUS_PORTS = [
  22,   // SSH
  23,   // Telnet
  25,   // SMTP
  53,   // DNS
  110,  // POP3
  143,  // IMAP
  161,  // SNMP
  993,  // IMAPS
  995,  // POP3S
  1433, // SQL Server
  1521, // Oracle
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  9200, // Elasticsearch
  27017, // MongoDB
  11211, // Memcached
  5984,  // CouchDB
  8086,  // InfluxDB
  9042,  // Cassandra
];

// Allowed ports for API testing
const ALLOWED_PORTS = [80, 443, 8080, 8443, 3000, 5000, 8000];

// Blocked top-level domains
const BLOCKED_TLDS = [
  'local', 'localhost', 'internal', 'corp', 'lan', 'intranet',
  'onion', 'test', 'invalid', 'example'
];

// URL validation schema
export const SafeURLSchema = z.string().url().refine((url) => {
  return isURLSafe(url);
}, 'URL is not safe for external requests');

/**
 * Comprehensive URL safety check
 */
export function isURLSafe(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // 1. Protocol check - only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // 2. Hostname checks
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost variants
    if (LOCALHOST_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(hostname);
      }
      return hostname === pattern;
    })) {
      return false;
    }
    
    // Block private IP ranges
    if (PRIVATE_IP_RANGES.some(pattern => pattern.test(hostname))) {
      return false;
    }
    
    // Block dangerous TLDs
    const tld = hostname.split('.').pop();
    if (tld && BLOCKED_TLDS.includes(tld)) {
      return false;
    }
    
    // 3. Port checks
    if (parsedUrl.port) {
      const port = parseInt(parsedUrl.port, 10);
      
      // Block dangerous ports
      if (DANGEROUS_PORTS.includes(port)) {
        return false;
      }
      
      // Only allow specific safe ports
      if (!ALLOWED_PORTS.includes(port)) {
        return false;
      }
    }
    
    // 4. Check for credentials in URL (security risk)
    if (parsedUrl.username || parsedUrl.password) {
      return false;
    }
    
    // 5. Additional hostname validation
    if (isPrivateIP(hostname) || isInternalHostname(hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}\n\n/**\n * Check if hostname is a private IP address\n */\nfunction isPrivateIP(hostname: string): boolean {\n  // IPv4 check\n  const ipv4Regex = /^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$/;\n  const ipv4Match = hostname.match(ipv4Regex);\n  \n  if (ipv4Match) {\n    const [, a, b, c, d] = ipv4Match.map(Number);\n    \n    // Validate IP ranges\n    if (a < 0 || a > 255 || b < 0 || b > 255 || c < 0 || c > 255 || d < 0 || d > 255) {\n      return true; // Invalid IP is considered unsafe\n    }\n    \n    // Check private ranges\n    return (\n      (a === 10) || // 10.0.0.0/8\n      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12\n      (a === 192 && b === 168) || // 192.168.0.0/16\n      (a === 169 && b === 254) || // 169.254.0.0/16\n      (a === 127) || // 127.0.0.0/8\n      (a === 0) || // 0.0.0.0/8\n      (a >= 224) // Multicast and reserved\n    );\n  }\n  \n  // IPv6 check (basic)\n  if (hostname.includes(':')) {\n    return (\n      hostname.startsWith('::1') || // Loopback\n      hostname.startsWith('fe80:') || // Link-local\n      hostname.startsWith('fc00:') || // Unique local\n      hostname.startsWith('fd00:') || // Unique local\n      hostname.startsWith('::ffff:') // IPv4-mapped\n    );\n  }\n  \n  return false;\n}\n\n/**\n * Check if hostname appears to be internal\n */\nfunction isInternalHostname(hostname: string): boolean {\n  const internalKeywords = [\n    'internal', 'corp', 'intranet', 'lan', 'local',\n    'dev', 'test', 'staging', 'admin', 'management',\n    'router', 'switch', 'gateway', 'firewall'\n  ];\n  \n  const lowerHostname = hostname.toLowerCase();\n  \n  return internalKeywords.some(keyword => \n    lowerHostname.includes(keyword)\n  );\n}\n\n/**\n * Rate limiting for API requests\n */\ninterface RateLimitEntry {\n  count: number;\n  windowStart: number;\n}\n\nclass RateLimiter {\n  private requests = new Map<string, RateLimitEntry>();\n  private readonly maxRequests: number;\n  private readonly windowMs: number;\n  \n  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute by default\n    this.maxRequests = maxRequests;\n    this.windowMs = windowMs;\n  }\n  \n  isAllowed(identifier: string): boolean {\n    const now = Date.now();\n    const entry = this.requests.get(identifier);\n    \n    if (!entry || now - entry.windowStart >= this.windowMs) {\n      // New window\n      this.requests.set(identifier, { count: 1, windowStart: now });\n      return true;\n    }\n    \n    if (entry.count >= this.maxRequests) {\n      return false;\n    }\n    \n    entry.count++;\n    return true;\n  }\n  \n  cleanup(): void {\n    const now = Date.now();\n    for (const [key, entry] of this.requests.entries()) {\n      if (now - entry.windowStart >= this.windowMs) {\n        this.requests.delete(key);\n      }\n    }\n  }\n}\n\n// Global rate limiter instance\nexport const apiRateLimiter = new RateLimiter();\n\n// Cleanup old entries every 5 minutes\nsetInterval(() => apiRateLimiter.cleanup(), 5 * 60 * 1000);\n\n/**\n * Validate and sanitize request headers\n */\nexport function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {\n  const sanitized: Record<string, string> = {};\n  const blockedHeaders = [\n    'authorization', 'cookie', 'x-forwarded-for', 'x-real-ip',\n    'x-forwarded-proto', 'x-forwarded-host', 'host'\n  ];\n  \n  for (const [key, value] of Object.entries(headers)) {\n    const lowerKey = key.toLowerCase();\n    \n    // Block dangerous headers\n    if (blockedHeaders.includes(lowerKey)) {\n      continue;\n    }\n    \n    // Sanitize header values\n    const sanitizedValue = value.replace(/[\\r\\n]/g, '').slice(0, 1000);\n    \n    if (sanitizedValue && !lowerKey.startsWith('x-')) {\n      sanitized[key] = sanitizedValue;\n    }\n  }\n  \n  // Add security headers\n  sanitized['User-Agent'] = 'YASP-API-Tester/1.0';\n  sanitized['X-Requested-With'] = 'XMLHttpRequest';\n  \n  return sanitized;\n}\n\n/**\n * Create safe fetch options\n */\nexport function createSafeFetchOptions(options: RequestInit = {}): RequestInit {\n  return {\n    ...options,\n    mode: 'cors',\n    credentials: 'omit',\n    redirect: 'follow',\n    referrerPolicy: 'no-referrer',\n    headers: {\n      ...sanitizeHeaders(options.headers as Record<string, string> || {}),\n    }\n  };\n}\n\n/**\n * Safe fetch wrapper with SSRF protection\n */\nexport async function safeFetch(\n  url: string, \n  options: RequestInit = {},\n  identifier = 'anonymous'\n): Promise<Response> {\n  // Rate limiting check\n  if (!apiRateLimiter.isAllowed(identifier)) {\n    throw new Error('Rate limit exceeded. Please try again later.');\n  }\n  \n  // URL safety check\n  if (!isURLSafe(url)) {\n    throw new Error('URL is not safe for external requests');\n  }\n  \n  // Create safe options\n  const safeOptions = createSafeFetchOptions(options);\n  \n  // Add timeout\n  const controller = new AbortController();\n  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout\n  \n  try {\n    const response = await fetch(url, {\n      ...safeOptions,\n      signal: controller.signal\n    });\n    \n    clearTimeout(timeout);\n    return response;\n  } catch (error) {\n    clearTimeout(timeout);\n    if (error instanceof Error && error.name === 'AbortError') {\n      throw new Error('Request timeout');\n    }\n    throw error;\n  }\n}\n\nexport default {\n  isURLSafe,\n  safeFetch,\n  sanitizeHeaders,\n  createSafeFetchOptions,\n  apiRateLimiter\n};