import { RelevanceConverter } from './relevanceConverter';
import { ConfigManager, ConversionConfig } from './config/ConfigManager';
import { FieldSanitizer } from './processors/FieldSanitizer';
import { TypeMapper, TypeInfo, LSType } from './processors/TypeMapper';
import { TSVGenerator } from './processors/TSVGenerator';

interface SurveyRow {
	type?: string;
	name?: string;
	label?: string;
	hint?: string;
	required?: string;
	relevant?: string;
	constraint?: string;
	constraint_message?: string;
	calculation?: string;
	default?: string;
	[key: string]: any;
}

interface ChoiceRow {
	list_name?: string;
	name?: string;
	label?: string;
	filter?: string;
	[key: string]: any;
}

interface SettingsRow {
	form_title?: string;
	form_id?: string;
	default_language?: string;
	[key: string]: any;
}

export class XLSFormToTSVConverter {
	private relevanceConverter: RelevanceConverter;
	private configManager: ConfigManager;
	private fieldSanitizer: FieldSanitizer;
	private typeMapper: TypeMapper;
	private tsvGenerator: TSVGenerator;
	private choicesMap: Map<string, ChoiceRow[]>;
	private currentGroup: string | null;
	private groupSeq: number;
	private questionSeq: number;
	private answerSeq: number;
	private subquestionSeq: number;

	constructor(config?: Partial<ConversionConfig>) {
		this.configManager = new ConfigManager(config);
		this.configManager.validateConfig();
		
		const sanitizationConfig = this.configManager.getSanitizationConfig();
		this.fieldSanitizer = new FieldSanitizer({
			removeUnderscores: sanitizationConfig.removeUnderscores,
			maxLength: sanitizationConfig.maxAnswerCodeLength,
			truncateStrategy: sanitizationConfig.truncateStrategy
		});
		
		this.typeMapper = new TypeMapper(this.configManager.getConfig());
		this.relevanceConverter = new RelevanceConverter();
		this.tsvGenerator = new TSVGenerator();
		this.choicesMap = new Map();
		this.currentGroup = null;
		this.groupSeq = 0;
		this.questionSeq = 0;
		this.answerSeq = 0;
		this.subquestionSeq = 0;
	}

	/**
	 * Get the current configuration
	 */
	getConfig(): ConversionConfig {
		return this.configManager.getConfig();
	}

	/**
	 * Update configuration at runtime
	 */
	updateConfig(partialConfig: Partial<ConversionConfig>): void {
		this.configManager.updateConfig(partialConfig);
	}

	convert(
		surveyData: SurveyRow[],
		choicesData: ChoiceRow[],
		settingsData: SettingsRow[]
	): string {
		// Reset state
		this.choicesMap.clear();
		this.currentGroup = null;
		this.tsvGenerator.clear();
		this.groupSeq = 0;
		this.questionSeq = 0;
		this.answerSeq = 0;
		this.subquestionSeq = 0;

		// Build choices map
		this.buildChoicesMap(choicesData);

		// Add survey row (class S)
		this.addSurveyRow(settingsData[0] || {});

		// Check if we need a default group (if no groups are defined)
		const hasGroups = surveyData.some(row => {
			const type = (row.type || '').trim();
			return type === 'begin_group' || type === 'begin group';
		});

		// If no groups, add a default group
		const advancedOptions = this.configManager.getAdvancedOptions();
		if (!hasGroups && advancedOptions.autoCreateGroups) {
			this.addDefaultGroup();
		}

		// Process survey rows
		for (const row of surveyData) {
			this.processRow(row);
		}

		// Generate TSV
		return this.tsvGenerator.generateTSV();
	}

	private buildChoicesMap(choices: ChoiceRow[]): void {
		for (const choice of choices) {
			const listName = choice.list_name;
			if (!listName) continue;

			if (!this.choicesMap.has(listName)) {
				this.choicesMap.set(listName, []);
			}
			this.choicesMap.get(listName)!.push(choice);
		}
	}

	private addDefaultGroup(): void {
		// Add a default group for surveys without explicit groups
		const defaults = this.configManager.getDefaults();
		const groupName = defaults.groupName;
		this.currentGroup = groupName;

		this.tsvGenerator.addRow({
			class: 'G',
			'type/scale': '',
			name: groupName,
			relevance: '1',
			text: groupName,
			help: '',
			language: defaults.language,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

		this.groupSeq++;
	}

	private addSurveyRow(settings: SettingsRow): void {
		// Add survey-level settings as individual S rows
		// Each survey property gets its own row with name=property_name, text=value

		const defaults = this.configManager.getDefaults();
		const surveyTitle = settings.form_title || defaults.surveyTitle;
		const surveyLanguage = settings.default_language || defaults.language;

		// Add base language (class S - survey settings)
		this.tsvGenerator.addRow({
			class: 'S',
			'type/scale': '',
			name: 'language',
			relevance: '1',
			text: surveyLanguage,
			help: '',
			language: surveyLanguage,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

		// Add language-specific settings (class SL - survey language settings)
		this.tsvGenerator.addRow({
			class: 'SL',
			'type/scale': '',
			name: 'surveyls_title',
			relevance: '1',
			text: surveyTitle,
			help: '',
			language: surveyLanguage,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

		// Add welcome message (optional but helps avoid errors)
		this.tsvGenerator.addRow({
			class: 'SL',
			'type/scale': '',
			name: 'surveyls_description',
			relevance: '1',
			text: defaults.description,
			help: '',
			language: surveyLanguage,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});
	}

	private processRow(row: SurveyRow): void {
		const type = (row.type || '').trim();

		if (!type) return;

		// Handle groups
		if (type === 'begin_group' || type === 'begin group') {
			this.addGroup(row);
			return;
		}
		if (type === 'end_group' || type === 'end group') {
			this.currentGroup = null;
			return;
		}

		// Skip repeats (not fully supported)
		if (type === 'begin_repeat' || type === 'end_repeat' || type === 'begin repeat' || type === 'end repeat') {
			console.warn('Repeats not fully supported:', row.name);
			return;
		}

		// Handle notes
		if (type === 'note') {
			this.addNote(row);
			return;
		}

		// Handle calculations
		if (type === 'calculate') {
			this.addCalculation(row);
			return;
		}

		// Handle hidden fields
		if (type === 'hidden') {
			this.addCalculation(row); // Treat as equation
			return;
		}

		// Handle questions
		this.addQuestion(row);
	}

	private sanitizeName(name: string): string {
		return this.fieldSanitizer.sanitizeName(name);
	}

	private sanitizeAnswerCode(code: string): string {
		return this.fieldSanitizer.sanitizeAnswerCode(code);
	}

	private addGroup(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const groupName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `G${this.groupSeq}`;

		this.groupSeq++;
		this.currentGroup = groupName;

		const defaults = this.configManager.getDefaults();
		this.tsvGenerator.addRow({
			class: 'G',
			'type/scale': '',
			name: groupName,
			relevance: this.convertRelevance(row.relevant),
			text: row.label || groupName,
			help: row.hint || '',
			language: defaults.language,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});
	}

	private addNote(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		const defaults = this.configManager.getDefaults();
		this.tsvGenerator.addRow({
			class: 'Q',
			'type/scale': 'X', // Boilerplate/display text
			name: questionName,
			relevance: this.convertRelevance(row.relevant),
			text: row.label || questionName,
			help: row.hint || '',
			language: defaults.language,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});
	}

	private addCalculation(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		const defaults = this.configManager.getDefaults();
		this.tsvGenerator.addRow({
			class: 'Q',
			'type/scale': '*', // Equation
			name: questionName,
			relevance: this.convertRelevance(row.relevant),
			text: row.label || questionName,
			help: '',
			language: defaults.language,
			validation: this.relevanceConverter.convertCalculation(row.calculation || ''),
			mandatory: '',
			other: '',
			default: row.default || '',
			same_default: ''
		});
	}

	private addQuestion(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		const typeInfo = this.parseType(row.type || '');
		const lsType = this.mapType(typeInfo);

		// Add main question
		const defaults = this.configManager.getDefaults();
		this.tsvGenerator.addRow({
			class: 'Q',
			'type/scale': lsType.type,
			name: questionName,
			relevance: this.convertRelevance(row.relevant),
			text: row.label || questionName,
			help: row.hint || '',
			language: defaults.language,
			validation: this.relevanceConverter.convertConstraint(row.constraint || ''),
			mandatory: row.required === 'yes' || row.required === 'true' ? 'Y' : '',
			other: lsType.other ? 'Y' : '',
			default: row.default || '',
			same_default: ''
		});

		// Reset answer sequence for this question
		this.answerSeq = 0;
		this.subquestionSeq = 0;

		// Add answers/subquestions for select types
		if (typeInfo.listName) {
			this.addAnswers(typeInfo, lsType);
		}
	}

	private parseType(typeStr: string): TypeInfo {
		return this.typeMapper.parseType(typeStr);
	}

	private mapType(typeInfo: TypeInfo): LSType {
		return this.typeMapper.mapType(typeInfo);
	}

	private addAnswers(typeInfo: TypeInfo, lsType: LSType): void {
		const choices = this.choicesMap.get(typeInfo.listName!);
		if (!choices) {
			console.warn(`Choice list not found: ${typeInfo.listName}`);
			return;
		}

		// Use the answer class from the type mapping
		const answerClass = lsType.answerClass || (typeInfo.base === 'select_multiple' ? 'SQ' : 'A');

		for (const choice of choices) {
			// Auto-generate name if missing (matches LimeSurvey behavior)
			const choiceName = choice.name && choice.name.trim() !== ''
				? this.sanitizeAnswerCode(choice.name.trim())
				: (answerClass === 'SQ' ? `SQ${this.subquestionSeq++}` : `A${this.answerSeq++}`);

			const defaults = this.configManager.getDefaults();
			this.tsvGenerator.addRow({
				class: answerClass,
				'type/scale': '',
				name: choiceName,
				relevance: choice.filter
					? `({${this.currentGroup || 'parent'}} == "${choice.filter}")`
					: '',
				text: choice.label || choiceName,
				help: '',
				language: defaults.language,
				validation: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private convertRelevance(relevant?: string): string {
		if (!relevant) return '1';
		return this.relevanceConverter.convert(relevant);
	}


}
