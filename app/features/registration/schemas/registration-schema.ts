/**
 * Registration Form Validation Schema
 * Using Zod for runtime type-safety and validation
 *
 * Security: OWASP A03:2025 - Input validation at type level
 */

import { z } from 'zod';

/**
 * Strict URL validation schema
 * Mitigation for OWASP A10:2025 – SSRF
 */
const endpointSchema = z
  .string()
  .min(1, 'Endpoint is required')
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);

        // Check protocol
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return false;
        }

        // Ensure hostname exists
        if (!urlObj.hostname) {
          return false;
        }

        // Enforce HTTPS except for localhost
        if (
          urlObj.protocol === 'http:' &&
          !['localhost', '127.0.0.1', '::1'].includes(urlObj.hostname)
        ) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    },
    {
      message:
        'Must be a complete URL with HTTPS (HTTP only allowed for localhost)',
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
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description cannot exceed 500 characters'),

  version: z
    .string()
    .min(1, 'Version is required')
    .max(20, 'Version cannot exceed 20 characters'),

  endpoint: endpointSchema,

  // Tags
  tags: z.array(z.string().max(50)),

  // OpenAPI Specification
  openapiSpec: z.object({
    source: z.enum(['upload', 'paste', 'url', '']),
    content: z.string(),
    fileName: z.string().optional(),
  }),

  // Status
  status: z.enum(['draft', 'active']),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type RegistrationFormData = z.infer<typeof registrationSchema>;
