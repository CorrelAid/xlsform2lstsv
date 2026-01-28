import { ConversionConfig, defaultConfig } from './types';
import { deepMerge } from '../utils/helpers';

export { ConversionConfig } from './types';

export class ConfigManager {
  private config: ConversionConfig;

  constructor(config?: Partial<ConversionConfig>) {
    this.config = this.mergeConfig(config || {});
  }

  private mergeConfig(partialConfig: Partial<ConversionConfig>): ConversionConfig {
    return deepMerge(structuredClone(defaultConfig), partialConfig);
  }

  getConfig(): ConversionConfig {
    return this.config;
  }

  getTypeMapping(type: string): ConversionConfig['typeMappings'][string] | undefined {
    return this.config.typeMappings[type];
  }

  getSanitizationConfig(): ConversionConfig['sanitization'] {
    return this.config.sanitization;
  }

  getDefaults(): ConversionConfig['defaults'] {
    return this.config.defaults;
  }

  getAdvancedOptions(): ConversionConfig['advanced'] {
    return this.config.advanced;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(partialConfig: Partial<ConversionConfig>): void {
    this.config = this.mergeConfig(partialConfig);
  }

  /**
   * Validate configuration
   */
  validateConfig(): void {
    const { typeMappings, sanitization, defaults, advanced } = this.config;

    // Validate type mappings
    for (const [type, mapping] of Object.entries(typeMappings)) {
      if (!mapping.limeSurveyType) {
        throw new Error(`Missing limeSurveyType for type mapping: ${type}`);
      }
      if (mapping.limeSurveyType.length !== 1) {
        throw new Error(`Invalid limeSurveyType for ${type}: must be single character`);
      }
    }

    // Validate sanitization
    if (sanitization.maxAnswerCodeLength < 1) {
      throw new Error('maxAnswerCodeLength must be at least 1');
    }

    if (!['warn', 'error', 'silent'].includes(sanitization.truncateStrategy)) {
      throw new Error(`Invalid truncateStrategy: ${sanitization.truncateStrategy}`);
    }

    // Validate defaults
    if (!defaults.language || defaults.language.length !== 2) {
      throw new Error('defaults.language must be a 2-character language code');
    }

    // Validate advanced options
    if (!['warn', 'error', 'ignore'].includes(advanced.handleRepeats)) {
      throw new Error(`Invalid handleRepeats option: ${advanced.handleRepeats}`);
    }
  }
}