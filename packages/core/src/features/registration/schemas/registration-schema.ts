/**
 * Registration Form Validation Schema
 * Using Zod for runtime type-safety and validation
 *
 * Security: OWASP A03:2025 - Input validation at type level
 */

import { z } from 'zod';

/**
 * Protocol validation schema
 * Mitigation for OWASP A10:2025 – SSRF
 * Supports both OpenAPI (HTTP/S) and AsyncAPI (Kafka, MQTT, WS, etc.)
 */
const endpointSchema = z
  .string()
  .min(1, 'Endpoint is required')
  .refine(
    (url) => {
      try {
        // Handle cases without protocol by temporarily adding one for parsing if needed
        // but for registration we generally expect a protocol
        const urlObj = new URL(url);

        // Ensure hostname exists
        if (!urlObj.hostname) {
          return false;
        }

        // List of common protocols for OpenAPI and AsyncAPI
        const allowedProtocols = [
          'http:', 'https:', 
          'ws:', 'wss:', 
          'kafka:', 'kafka-secure:', 
          'mqtt:', 'mqtts:', 
          'amqp:', 'amqps:',
          'stomp:', 'stomps:',
          'redis:', 'rediss:'
        ];

        if (!allowedProtocols.includes(urlObj.protocol)) {
          // If it's a generic protocol or unknown, we might still allow it if it looks valid
          // for custom AsyncAPI protocols, but let's stick to a broad allowed list first
          return false;
        }

        // Enforce HTTPS/WSS/etc except for localhost
        const insecureProtocols = ['http:', 'ws:', 'mqtt:', 'amqp:', 'stomp:', 'redis:', 'kafka:'];
        if (
          insecureProtocols.includes(urlObj.protocol) &&
          !['localhost', '127.0.0.1', '::1'].includes(urlObj.hostname)
        ) {
          // We'll be slightly more lenient for AsyncAPI as some brokers use plain ports
          // but for HTTP we definitely want HTTPS.
          // For now, let's keep the localhost-only rule for plain HTTP/WS to be safe.
          if (['http:', 'ws:'].includes(urlObj.protocol)) {
             return false;
          }
        }

        return true;
      } catch {
        // Some AsyncAPI URLs might not be standard URLs (e.g. just host:port)
        // Let's try to see if it matches a host:port pattern
        return /^[a-zA-Z0-9.-]+(:\d+)?$/.test(url);
      }
    },
    {
      message:
        'Must be a valid endpoint URL (e.g. https://api.example.com or broker.example.com:9092)',
    }
  );

/**
 * API Registration Form Schema
 */
export const registrationSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(3, 'API name must be at least 3 characters')
    .max(100, 'API name cannot exceed 100 characters'),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters'),

  version: z
    .string()
    .min(1, 'Version is required')
    .max(20, 'Version cannot exceed 20 characters'),

  endpoint: endpointSchema,

  // Tags
  tags: z.array(z.string().max(50)),

  // OpenAPI Specification (required)
  openapiSpec: z.object({
    source: z.enum(['upload', 'paste', 'url', '']),
    content: z.string().min(1, 'An API spec is required'),
    fileName: z.string().optional(),
  }),

  // Status
  status: z.enum(['draft', 'active']),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type RegistrationFormData = z.infer<typeof registrationSchema>;
