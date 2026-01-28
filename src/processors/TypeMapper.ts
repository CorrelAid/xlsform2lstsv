import { ConversionConfig } from '../config/types';

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
  constructor(private config: ConversionConfig) {}

  parseType(typeStr: string): TypeInfo {
    const parts = typeStr.split(/\s+/);
    const base = parts[0];

    let listName: string | null = null;
    let orOther = false;

    if (base === 'select_one' || base === 'select_multiple') {
      listName = parts[1] || null;
      orOther = parts.includes('or_other');
    }

    return { base, listName, orOther };
  }

  mapType(typeInfo: TypeInfo): LSType {
    const mapping = this.config.typeMappings[typeInfo.base];
    
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