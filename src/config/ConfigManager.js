import { deepMerge } from '../utils/helpers.js';
import { defaultConfig } from './types.js';
export class ConfigManager {
    constructor(config) {
        this.config = this.mergeConfig(config || {});
    }
    mergeConfig(partialConfig) {
        return deepMerge(structuredClone(defaultConfig), partialConfig);
    }
    getConfig() {
        return this.config;
    }
    getDefaults() {
        return this.config.defaults;
    }
    getAdvancedOptions() {
        return {
            autoCreateGroups: true, // Always auto-create groups (hardcoded)
            handleRepeats: this.config.handleRepeats ?? 'warn',
            debugLogging: this.config.debugLogging ?? false
        };
    }
    /**
     * Update configuration at runtime
     */
    updateConfig(partialConfig) {
        this.config = this.mergeConfig(partialConfig);
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        const { defaults } = this.config;
        // Validate handleRepeats if provided
        if (this.config.handleRepeats && !['warn', 'error', 'ignore'].includes(this.config.handleRepeats)) {
            throw new Error(`Invalid handleRepeats option: ${this.config.handleRepeats}`);
        }
        // Validate defaults
        if (!defaults.language || defaults.language.length !== 2) {
            throw new Error('defaults.language must be a 2-character language code');
        }
    }
}
