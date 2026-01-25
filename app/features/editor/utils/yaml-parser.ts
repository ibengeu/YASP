/**
 * YAML Parser Utility
 * Handles YAML ↔ AST conversion with position mapping for cursor preservation
 *
 * Security: OWASP A03:2025 (Injection)
 * - Validates YAML structure before parsing
 * - Sanitizes paths to prevent prototype pollution
 */

import yaml from 'js-yaml';
import { parseDocument, stringify } from 'yaml';

export interface YAMLNode {
  type: 'Document' | 'Mapping' | 'Sequence' | 'Scalar';
  value: any;
  range?: [number, number];
}

export interface YAMLPosition {
  yamlPath: string[];
  line: number;
  column: number;
}

/**
 * Parse YAML string to AST with position information
 *
 * @param yamlString - Raw YAML content
 * @returns AST with value and position data
 * @throws Error if YAML is invalid
 */
export function parseYAMLToAST(yamlString: string): YAMLNode {
  try {
    // Use yaml library for full AST with position info
    const doc = parseDocument(yamlString);

    if (doc.errors.length > 0) {
      throw new Error(`YAML parse error: ${doc.errors[0].message}`);
    }

    return {
      type: 'Document',
      value: doc.toJSON(),
      range: doc.range,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Build position map from AST
 * Maps YAML paths to line/column positions
 *
 * Security: OWASP A03:2025 - Sanitizes keys to prevent prototype pollution
 *
 * @param ast - Parsed YAML AST
 * @param yamlString - Original YAML string (for line counting)
 * @returns Map of path keys to positions
 */
export function buildPositionMap(ast: YAMLNode, yamlString?: string): Map<string, YAMLPosition> {
  const map = new Map<string, YAMLPosition>();
  const lines = yamlString?.split('\n') || [];

  function traverse(obj: any, path: string[] = [], lineOffset = 0) {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = [...path, String(index)];
        const pathKey = newPath.join('.');

        // Mitigation: OWASP A03:2025 - Sanitize path to prevent prototype pollution
        if (!isSafePath(pathKey)) {
          return;
        }

        // Find line number for this array element
        const line = findLineForPath(lines, newPath, lineOffset);

        map.set(pathKey, {
          yamlPath: newPath,
          line,
          column: 0,
        });

        traverse(item, newPath, line);
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = [...path, key];
        const pathKey = newPath.join('.');

        // Mitigation: OWASP A03:2025 - Sanitize path to prevent prototype pollution
        if (!isSafePath(pathKey)) {
          return;
        }

        // Find line number for this key
        const line = findLineForPath(lines, newPath, lineOffset);

        map.set(pathKey, {
          yamlPath: newPath,
          line,
          column: 0,
        });

        traverse(value, newPath, line);
      });
    }
  }

  traverse(ast.value);
  return map;
}

/**
 * Security: OWASP A03:2025 - Prevent prototype pollution
 * Check if path contains dangerous keys
 */
function isSafePath(pathKey: string): boolean {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  return !dangerousKeys.some(key => pathKey.includes(key));
}

/**
 * Find line number for a given YAML path
 * Uses simple heuristic: search for key name in YAML text
 */
function findLineForPath(lines: string[], path: string[], startLine: number): number {
  if (lines.length === 0 || path.length === 0) {
    return 1;
  }

  const lastKey = path[path.length - 1];

  // Search for the key starting from startLine
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains the key (accounting for indentation)
    if (line.includes(`${lastKey}:`)) {
      return i + 1; // Line numbers are 1-indexed
    }
  }

  return startLine + 1;
}

/**
 * Find AST node by YAML path
 *
 * @param ast - Parsed AST
 * @param yamlPath - Path array (e.g., ['paths', '/users', 'get'])
 * @returns Node value or undefined if not found
 */
export function findNodeByYAMLPath(ast: YAMLNode, yamlPath: string[]): any {
  let current = ast.value;

  for (const key of yamlPath) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Security: OWASP A03:2025 - Prevent prototype pollution
    if (!isSafePath(key)) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      if (!(key in current)) {
        return undefined;
      }
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Serialize AST back to YAML string
 *
 * @param ast - AST to serialize
 * @returns YAML string
 */
export function serializeASTToYAML(ast: YAMLNode): string {
  try {
    // Use yaml library for clean output with proper formatting
    return stringify(ast.value, {
      indent: 2,
      lineWidth: 0, // Disable line wrapping
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to serialize YAML: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update AST node at given YAML path
 * Returns new AST (immutable)
 *
 * @param ast - Original AST
 * @param yamlPath - Path to node
 * @param newValue - New value for node
 * @returns Updated AST
 */
export function updateNodeByYAMLPath(
  ast: YAMLNode,
  yamlPath: string[],
  newValue: any
): YAMLNode {
  // Deep clone the AST
  const newAst = JSON.parse(JSON.stringify(ast));

  let current = newAst.value;
  const lastKey = yamlPath[yamlPath.length - 1];

  // Navigate to parent
  for (let i = 0; i < yamlPath.length - 1; i++) {
    const key = yamlPath[i];

    // Security: OWASP A03:2025 - Prevent prototype pollution
    if (!isSafePath(key)) {
      throw new Error(`Invalid path key: ${key}`);
    }

    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      current = current[index];
    } else {
      current = current[key];
    }
  }

  // Update the value
  if (Array.isArray(current)) {
    const index = parseInt(lastKey, 10);
    current[index] = newValue;
  } else {
    current[lastKey] = newValue;
  }

  return newAst;
}
