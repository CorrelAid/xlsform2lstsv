import { sanitizeFieldName } from '../utils/helpers';

export class FieldSanitizer {
  constructor(
    private config: {
      removeUnderscores: boolean;
      maxLength?: number;
      truncateStrategy?: 'warn' | 'error' | 'silent';
    }
  ) {}

  sanitizeName(name: string): string {
    return sanitizeFieldName(name, this.config);
  }

  sanitizeAnswerCode(code: string): string {
    return this.sanitizeName(code);
  }
}