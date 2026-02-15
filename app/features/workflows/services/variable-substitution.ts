/**
 * Variable Substitution Service
 * Replaces {{variable}} placeholders with context-aware encoding
 *
 * Security:
 * - OWASP A07:2025 (Injection): Context-aware encoding prevents injection attacks
 *   URL/query context: encodeURIComponent
 *   Header context: strip newlines (header injection prevention)
 *   Body context: raw insertion for JSON type coercion
 */

import { WORKFLOW_VARIABLE_PATTERN } from '@/lib/constants';

type SubstitutionContext = 'url' | 'header' | 'body' | 'query';

/**
 * Replace {{name}} placeholders in template with values from the variables map.
 * Encoding varies by context to prevent injection.
 */
export function substituteVariables(
  template: string,
  variables: Record<string, any>,
  context: SubstitutionContext
): string {
  if (!template) return template;

  return template.replace(WORKFLOW_VARIABLE_PATTERN, (match, name) => {
    if (!(name in variables)) return match; // Leave unresolved as-is

    const value = variables[name];
    const stringValue = String(value);

    switch (context) {
      case 'url':
      case 'query':
        // Mitigation for OWASP A07:2025 – Injection: URL encoding prevents URL injection
        return encodeURIComponent(stringValue);
      case 'header':
        // Mitigation for OWASP A07:2025 – Injection: strip CR/LF to prevent header injection
        return stringValue.replace(/[\r\n]/g, '');
      case 'body':
        // Raw insertion for body — numbers stay numbers in JSON context
        return stringValue;
      default:
        return stringValue;
    }
  });
}

/**
 * Extract all referenced variable names from a template string.
 * Returns unique names.
 */
export function extractVariableReferences(template: string): string[] {
  const refs = new Set<string>();
  // Reset regex state since it uses global flag
  const pattern = new RegExp(WORKFLOW_VARIABLE_PATTERN.source, 'g');
  let match;
  while ((match = pattern.exec(template)) !== null) {
    refs.add(match[1]);
  }
  return Array.from(refs);
}

/**
 * Validate that all variable references in a template exist in the available scope.
 * Returns array of missing variable names.
 */
export function validateVariableReferences(
  template: string,
  scope: string[]
): string[] {
  const refs = extractVariableReferences(template);
  const scopeSet = new Set(scope);
  return refs.filter((name) => !scopeSet.has(name));
}
