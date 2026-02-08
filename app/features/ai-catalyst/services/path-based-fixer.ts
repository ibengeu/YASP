/**
 * Path-Based Fixer
 * Applies fixes using diagnostic paths instead of string replacement
 *
 * Security: OWASP A03:2025 - Input validation on paths and values
 */

export interface FixOperation {
  type: 'add' | 'update' | 'remove';
  path: string[];
  value: any;
  previousValue?: any; // For undo
}

export class PathBasedFixer {
  /**
   * Apply a fix to spec content using path-based navigation
   */
  async applyFix(
    specContent: string,
    format: 'yaml' | 'json',
    operation: FixOperation
  ): Promise<string> {
    // Mitigation for OWASP A03:2025 - Validate path
    if (!operation.path || operation.path.length === 0) {
      throw new Error('Invalid fix operation: path is required');
    }

    // Parse spec
    let parsed: any;
    if (format === 'json') {
      parsed = JSON.parse(specContent);
    } else {
      const yaml = await import('yaml');
      parsed = yaml.parse(specContent);
    }

    // Navigate to parent and create intermediate objects if needed
    let target = parsed;
    const parentPath = operation.path.slice(0, -1);

    for (const segment of parentPath) {
      if (target[segment] === undefined || target[segment] === null) {
        // Create intermediate object or array based on next segment
        const nextIndex = parentPath.indexOf(segment) + 1;
        const nextSegment = parentPath[nextIndex];
        target[segment] = typeof nextSegment === 'number' ? [] : {};
      }
      target = target[segment];
    }

    // Apply operation at the final key
    const key = operation.path[operation.path.length - 1];

    switch (operation.type) {
      case 'add':
      case 'update':
        // Mitigation for OWASP A03:2025 - Sanitize value
        target[key] = this.sanitizeValue(operation.value);
        break;
      case 'remove':
        delete target[key];
        break;
    }

    // Serialize back to original format
    if (format === 'json') {
      return JSON.stringify(parsed, null, 2);
    } else {
      const yaml = await import('yaml');
      return yaml.stringify(parsed, {
        lineWidth: 0, // Prevent wrapping
        indent: 2,
      });
    }
  }

  /**
   * Extract current value at a path
   */
  async getCurrentValue(
    specContent: string,
    format: 'yaml' | 'json',
    path: string[]
  ): Promise<any> {
    const parsed = format === 'json'
      ? JSON.parse(specContent)
      : (await import('yaml')).parse(specContent);

    let current = parsed;
    for (const segment of path) {
      current = current?.[segment];
      if (current === undefined) return undefined;
    }
    return current;
  }

  /**
   * Apply multiple fixes in sequence
   */
  async applyBatchFixes(
    specContent: string,
    format: 'yaml' | 'json',
    operations: FixOperation[]
  ): Promise<string> {
    let result = specContent;

    for (const operation of operations) {
      result = await this.applyFix(result, format, operation);
    }

    return result;
  }

  /**
   * Create undo operation
   */
  createUndoOperation(operation: FixOperation, previousValue: any): FixOperation {
    if (operation.type === 'add' || operation.type === 'update') {
      return {
        type: previousValue === undefined ? 'remove' : 'update',
        path: operation.path,
        value: previousValue,
      };
    } else {
      // type === 'remove'
      return {
        type: 'add',
        path: operation.path,
        value: previousValue,
      };
    }
  }

  /**
   * Sanitize value to prevent injection
   */
  private sanitizeValue(value: any): any {
    // Mitigation for OWASP A03:2025 - Prevent prototype pollution
    if (value && typeof value === 'object') {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue; // Skip dangerous keys
        }
        sanitized[key] = this.sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  }
}
