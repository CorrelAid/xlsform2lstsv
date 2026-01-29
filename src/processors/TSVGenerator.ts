interface TSVRow {
  class: string;
  'type/scale': string;
  name: string;
  relevance: string;
  text: string;
  help: string;
  language: string;
  validation: string;
  mandatory: string;
  other: string;
  default: string;
  same_default: string;
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
      'mandatory',
      'other',
      'default',
      'same_default'
    ];

    const lines = [headers.join('\t')];

    for (const row of this.rows) {
      const values = headers.map((h) => this.escapeForTSV(row[h as keyof TSVRow] || ''));
      lines.push(values.join('\t'));
    }

    return lines.join('\n');
  }

  private escapeForTSV(value: string): string {
    // Escape tabs, newlines, and wrap in quotes if needed
    if (typeof value !== 'string') value = String(value);

    if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
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