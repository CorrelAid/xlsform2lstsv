import { sanitizeFieldName } from '../utils/helpers.js';

export class FieldSanitizer {
  constructor() {}

  sanitizeName(name: string): string {
    return sanitizeFieldName(name);
  }

  sanitizeAnswerCode(code: string): string {
    // Answer codes in LimeSurvey have a 5-character limit
    let result = code;
    
    // Always remove underscores (LimeSurvey removes them automatically)
    result = result.replace(/_/g, '');
    
    // Limit to 5 characters (LimeSurvey answer codes limit)
    const maxLength = 5;
    if (result.length > maxLength) {
      const truncated = result.substring(0, maxLength);
      console.warn(`Answer code "${code}" exceeds maximum length of ${maxLength} characters and will be truncated to "${truncated}"`);
      return truncated;
    }
    
    return result;
  }
}