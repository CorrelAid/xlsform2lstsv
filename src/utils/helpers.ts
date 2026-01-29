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
 * Sanitize field names for LimeSurvey compatibility
 * Removes underscores and truncates to 20 characters (LimeSurvey question title limit)
 */
export function sanitizeFieldName(name: string): string {
  let result = name;
  
  // Always remove underscores (LimeSurvey removes them automatically)
  result = result.replace(/_/g, '');
  
  // Limit to 20 characters (LimeSurvey questions.title field limit)
  const maxLength = 20;
  if (result.length > maxLength) {
    const truncated = result.substring(0, maxLength);
    console.warn(`Field name "${name}" exceeds maximum length of ${maxLength} characters and will be truncated to "${truncated}"`);
    return truncated;
  }
  
  return result;
}