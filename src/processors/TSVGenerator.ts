interface TSVRow {
  class: string;
  'type/scale': string;
  name: string;
  relevance: string;
  text: string;
  help: string;
  language: string;
  validation: string;
  em_validation_q: string;
  mandatory: string;
  other: string;
  default: string;
  same_default: string;
  hidden?: string;
}

export class TSVGenerator {
  private rows: TSVRow[] = [];

  addRow(row: TSVRow): void {
    this.rows.push(row);
  }

  // https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure
  generateTSV(): string {
    const headers = [
      'class',
      'type/scale',
      'name',
      'relevance',
      'text',
      'help',
      'language',
      'validation',
      'em_validation_q',
      'mandatory',
      'other',
      'default',
      'same_default',
      'hidden'
    ];

    const lines = [headers.join('\t')];

    for (const row of this.rows) {
      const values = headers.map((h) => this.escapeForTSV(row[h as keyof TSVRow] ?? ''));
      lines.push(values.join('\t'));
    }

    return lines.join('\n');
  }

  private escapeForTSV(value: string): string {
    // Escape tabs, newlines, and wrap in quotes if needed
    if (typeof value !== 'string') value = String(value);

    // Replace newlines with <br /> for LimeSurvey compatibility.
    // LimeSurvey's TSV importer parses line-by-line and does not handle
    // RFC 4180 multi-line quoted fields. HTML breaks render correctly
    // in LimeSurvey's question text and help fields.
    value = value.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />');

    if (value.includes('\t') || value.includes('"')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  clear(): void {
    this.rows = [];
  }

  getRowCount(): number {
    return this.rows.length;
  }
}