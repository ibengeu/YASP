/**
 * Variable Extraction Service
 * Extracts values from API response bodies using JSONPath expressions
 *
 * Security:
 * - OWASP A07:2025 (Injection): JSONPath expression length limit (500 chars)
 * - Graceful error handling for non-JSON responses
 */

import { JSONPath } from 'jsonpath-plus';
import { WORKFLOW_LIMITS } from '@/lib/constants';
import type { VariableExtraction } from '../types/workflow.types';

interface ExtractionResult {
  extracted: Record<string, any>;
  errors: string[];
}

/**
 * Extract variables from a response body using JSONPath expressions.
 * Returns extracted key-value pairs and any errors encountered.
 */
export function extractVariables(
  responseBody: any,
  extractions: VariableExtraction[]
): ExtractionResult {
  const extracted: Record<string, any> = {};
  const errors: string[] = [];

  if (extractions.length === 0) return { extracted, errors };

  // Guard against non-object response bodies
  if (responseBody === null || responseBody === undefined || typeof responseBody !== 'object') {
    for (const extraction of extractions) {
      errors.push(`Cannot extract "${extraction.name}": response body is not a JSON object`);
    }
    return { extracted, errors };
  }

  for (const extraction of extractions) {
    try {
      const results = JSONPath({ path: extraction.jsonPath, json: responseBody, wrap: false });

      if (results === undefined || results === null) {
        errors.push(`No value found for "${extraction.name}" at path: ${extraction.jsonPath}`);
      } else {
        extracted[extraction.name] = results;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to extract "${extraction.name}": ${message}`);
    }
  }

  return { extracted, errors };
}

/**
 * Validate a JSONPath expression for correctness and length.
 */
export function validateJsonPath(expression: string): { valid: boolean; error?: string } {
  if (!expression || expression.trim() === '') {
    return { valid: false, error: 'JSONPath expression cannot be empty' };
  }

  if (expression.length > WORKFLOW_LIMITS.maxJsonPathLength) {
    return { valid: false, error: `JSONPath expression cannot exceed ${WORKFLOW_LIMITS.maxJsonPathLength} characters` };
  }

  try {
    // Test parse with a minimal object
    JSONPath({ path: expression, json: {} });
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSONPath';
    return { valid: false, error: message };
  }
}

/**
 * Preview extraction result against a response body.
 * Used for live testing in the ExtractionEditor UI.
 */
export function previewExtraction(
  responseBody: any,
  jsonPath: string
): { value?: any; error?: string } {
  const validation = validateJsonPath(jsonPath);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    const results = JSONPath({ path: jsonPath, json: responseBody, wrap: false });

    if (results === undefined || results === null) {
      return { error: `No value found at path: ${jsonPath}` };
    }

    return { value: results };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed';
    return { error: message };
  }
}
