/**
 * @file Mapping between XLSForm question types and LimeSurvey question types. 
 * @description See https://xlsform.org/en/ref-table/#types and 
 * https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure
 */


export const TYPE_MAPPINGS: Record<string, {
  limeSurveyType: string;
  supportsOther?: boolean;
  answerClass?: 'A' | 'SQ';
}> = {
  // Text types
  text: { limeSurveyType: 'S' },
  string: { limeSurveyType: 'S' },

  // Numeric types
  integer: { limeSurveyType: 'N' },
  int: { limeSurveyType: 'N' },
  decimal: { limeSurveyType: 'N' },

  // Date/time
  date: { limeSurveyType: 'D' },
  time: { limeSurveyType: 'D' },
  datetime: { limeSurveyType: 'D' },

  // Select types
  select_one: { limeSurveyType: 'L', supportsOther: true, answerClass: 'A' },
  select_multiple: { limeSurveyType: 'M', supportsOther: true, answerClass: 'SQ' },

  // Other types
  note: { limeSurveyType: 'X' },
  rank: { limeSurveyType: 'R', answerClass: 'A', supportsOther: true },
  
  // System variables - treated as equations
  start: { limeSurveyType: '*' },
  end: { limeSurveyType: '*' },
  today: { limeSurveyType: '*' },
  deviceid: { limeSurveyType: '*' },
  username: { limeSurveyType: '*' }
};

export interface TypeInfo {
  base: string;
  listName: string | null;
  orOther: boolean;
}

export interface LSType {
  type: string;
  other?: boolean;
  answerClass?: 'A' | 'SQ';
}

export class TypeMapper {
  parseType(typeStr: string): TypeInfo {
    const parts = typeStr.split(/\s+/);
    const base = parts[0];

    let listName: string | null = null;
    let orOther = false;

    if (base === 'select_one' || base === 'select_multiple' || base === 'rank') {
      listName = parts[1] || null;
      orOther = parts.includes('or_other');
    }

    return { base, listName, orOther };
  }

  mapType(typeInfo: TypeInfo): LSType {
    const mapping = TYPE_MAPPINGS[typeInfo.base];
    
    if (!mapping) {
      // Fallback to text type for unknown types
      console.warn(`No type mapping found for "${typeInfo.base}", defaulting to text type`);
      return { type: 'S' };
    }

    const result: LSType = {
      type: mapping.limeSurveyType,
    };

    if (mapping.supportsOther && typeInfo.orOther) {
      result.other = true;
    }

    if (mapping.answerClass) {
      result.answerClass = mapping.answerClass;
    }

    return result;
  }
}