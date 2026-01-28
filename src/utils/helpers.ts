/**
 * Deep merge objects - merges properties from source into target recursively
 */
export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          target[key] = {} as any;
        }
        deepMerge(target[key], source[key] as any);
      } else {
        target[key] = source[key] as any;
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Sanitize field names according to configuration
 */
export function sanitizeFieldName(
  name: string,
  config: {
    removeUnderscores: boolean;
    maxLength?: number;
    truncateStrategy?: 'warn' | 'error' | 'silent';
  }
): string {
  let result = name;
  
  // Remove underscores if configured
  if (config.removeUnderscores) {
    result = result.replace(/_/g, '');
  }
  
  // Apply length limit if specified
  if (config.maxLength && result.length > config.maxLength) {
    const truncated = result.substring(0, config.maxLength);
    
    switch (config.truncateStrategy) {
      case 'error':
        throw new Error(`Field name "${name}" exceeds maximum length of ${config.maxLength} characters`);
      case 'warn':
        console.warn(`Field name "${name}" exceeds maximum length of ${config.maxLength} characters and will be truncated to "${truncated}"`);
        return truncated;
      case 'silent':
      default:
        return truncated;
    }
  }
  
  return result;
}