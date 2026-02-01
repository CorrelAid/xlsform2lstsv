export class TSVGenerator {
    constructor() {
        this.rows = [];
    }
    addRow(row) {
        this.rows.push(row);
    }
    // https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure
    generateTSV() {
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
            'same_default'
        ];
        const lines = [headers.join('\t')];
        for (const row of this.rows) {
            const values = headers.map((h) => this.escapeForTSV(row[h] || ''));
            lines.push(values.join('\t'));
        }
        return lines.join('\n');
    }
    escapeForTSV(value) {
        // Escape tabs, newlines, and wrap in quotes if needed
        if (typeof value !== 'string')
            value = String(value);
        if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }
    clear() {
        this.rows = [];
    }
    getRowCount() {
        return this.rows.length;
    }
}
