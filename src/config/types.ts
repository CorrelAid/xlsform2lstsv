export interface ConversionConfig {
  /**
   * Type mapping configuration for XLSForm to LimeSurvey type conversion
   */
  typeMappings: Record<string, {
    limeSurveyType: string;
    supportsOther?: boolean;
    answerClass?: 'A' | 'SQ'; // For select types: 'A' for answers, 'SQ' for subquestions
  }>;

  /**
   * Field name sanitization configuration
   */
  sanitization: {
    removeUnderscores: boolean;
    maxAnswerCodeLength: number;
    truncateStrategy: 'warn' | 'error' | 'silent';
  };

  /**
   * Default values for survey elements
   */
  defaults: {
    language: string;
    groupName: string;
    surveyTitle: string;
    description: string;
  };

  /**
   * Advanced conversion options
   */
  advanced: {
    autoCreateGroups: boolean;
    handleRepeats: 'warn' | 'error' | 'ignore';
    debugLogging: boolean;
  };
}

/**
 * Default configuration with sensible defaults
 */
export const defaultConfig: ConversionConfig = {
  typeMappings: {
    // Text types
    text: { limeSurveyType: 'S' },
    string: { limeSurveyType: 'S' },

    // Numeric types
    integer: { limeSurveyType: 'N' },
    int: { limeSurveyType: 'N' },
    decimal: { limeSurveyType: 'N' },
    range: { limeSurveyType: 'N' },

    // Date/time
    date: { limeSurveyType: 'D' },
    time: { limeSurveyType: 'D' },
    datetime: { limeSurveyType: 'D' },

    // Select types
    select_one: { limeSurveyType: 'L', supportsOther: true, answerClass: 'A' },
    select_multiple: { limeSurveyType: 'M', supportsOther: true, answerClass: 'SQ' },

    // Other types
    note: { limeSurveyType: 'X' },
    calculate: { limeSurveyType: '*' },
    hidden: { limeSurveyType: '*' },
    geopoint: { limeSurveyType: 'S' },
    geotrace: { limeSurveyType: 'T' },
    geoshape: { limeSurveyType: 'T' },
    image: { limeSurveyType: '|' },
    audio: { limeSurveyType: '|' },
    video: { limeSurveyType: '|' },
    file: { limeSurveyType: '|' },
    barcode: { limeSurveyType: 'S' },
    acknowledge: { limeSurveyType: 'X' },
    rank: { limeSurveyType: 'R' }
  },

  sanitization: {
    removeUnderscores: true,
    maxAnswerCodeLength: 5,
    truncateStrategy: 'warn'
  },

  defaults: {
    language: 'en',
    groupName: 'Questions',
    surveyTitle: 'Untitled Survey',
    description: ''
  },

  advanced: {
    autoCreateGroups: true,
    handleRepeats: 'warn',
    debugLogging: false
  }
};