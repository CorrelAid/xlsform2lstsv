/**
 * Represents a row in the survey section of an XLSForm
 */
export interface SurveyRow {
  type?: string;
  name?: string;
  label?: string | Record<string, string>;
  hint?: string | Record<string, string>;
  required?: string;
  relevant?: string;
  constraint?: string;
  constraint_message?: string;
  calculation?: string;
  default?: string;
  _languages?: string[];
  [key: string]: any;
}

/**
 * Represents a row in the choices section of an XLSForm
 */
export interface ChoiceRow {
  list_name?: string;
  name?: string;
  label?: string | Record<string, string>;
  filter?: string;
  _languages?: string[];
  [key: string]: any;
}

/**
 * Represents a row in the settings section of an XLSForm
 */
export interface SettingsRow {
  form_title?: string;
  form_id?: string;
  default_language?: string;
  [key: string]: any;
}

/**
 * Result type returned by XLS/XLSX loaders
 */
export interface XLSFormData {
  surveyData: SurveyRow[];
  choicesData: ChoiceRow[];
  settingsData: SettingsRow[];
  hasSurveySheet: boolean;
  hasChoicesSheet: boolean;
  hasSettingsSheet: boolean;
}

export interface ConversionConfig {
  /**
   * How to handle repeats: 'warn', 'error', or 'ignore' (default: 'warn')
   */
  handleRepeats?: 'warn' | 'error' | 'ignore';

  /**
   * Enable debug logging (default: false)
   */
  debugLogging?: boolean;

  /**
   * Default values for survey elements
   */
  defaults: {
    language: string;
    groupName: string;
    surveyTitle: string;
    description: string;
  };
}

/**
 * Default configuration with sensible defaults
 */
export const defaultConfig: ConversionConfig = {
  handleRepeats: 'warn',
  debugLogging: false,

  defaults: {
    language: 'en',
    groupName: 'Questions',
    surveyTitle: 'Untitled Survey',
    description: ''
  }
};