import { RelevanceConverter } from './relevanceConverter';
import { ConfigManager, ConversionConfig } from './config/ConfigManager';
import { FieldSanitizer } from './processors/FieldSanitizer';
import { TypeMapper, TypeInfo, LSType } from './processors/TypeMapper';
import { TSVGenerator } from './processors/TSVGenerator';
import { SurveyRow, ChoiceRow, SettingsRow } from './config/types';
import { getBaseLanguage, getLanguageSpecificValue, getAllLanguageValues } from './utils/languageUtils';

// Unimplemented XLSForm types that should raise an error
const UNIMPLEMENTED_TYPES = [
	'geopoint', 'geotrace', 'geoshape', 'start-geopoint',
	'image', 'audio', 'video', 'file',
	'background-audio', 'csv-external', 'phonenumber', 'email',
	'barcode',
	'audit',
	'calculate',
	'hidden',
	'range', // Range questions don't exist in LimeSurvey
	'select_one_from_file', // External file loading not supported in LimeSurvey TSV import
	'select_multiple_from_file', // External file loading not supported in LimeSurvey TSV import
	'acknowledge' // Acknowledge type not supported in LimeSurvey TSV import
];

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
	private availableLanguages: string[];
	private baseLanguage: string;

	constructor(config?: Partial<ConversionConfig>) {
		this.configManager = new ConfigManager(config);
		this.configManager.validateConfig();
		
		this.fieldSanitizer = new FieldSanitizer();
		
		this.typeMapper = new TypeMapper();
		this.relevanceConverter = new RelevanceConverter();
		this.tsvGenerator = new TSVGenerator();
		this.choicesMap = new Map();
		this.currentGroup = null;
		this.groupSeq = 0;
		this.questionSeq = 0;
		this.answerSeq = 0;
		this.subquestionSeq = 0;
		this.availableLanguages = ['en']; // Default to English
		this.baseLanguage = 'en'; // Default to English
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

		// Set base language from settings first
		this.baseLanguage = getBaseLanguage(settingsData[0] || {});
		
		// Detect available languages from survey data (will use baseLanguage for ordering)
		this.detectAvailableLanguages(surveyData, choicesData, settingsData);
		
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

	private detectAvailableLanguages(surveyData: SurveyRow[], choicesData: ChoiceRow[], settingsData: SettingsRow[]): void {
		const languageCodes = new Set<string>();
		
		// Check survey data for language codes
		for (const row of surveyData) {
			if (row._languages) {
				row._languages.forEach((lang: string) => languageCodes.add(lang));
			}
		}
		
		// Check choices data for language codes
		for (const row of choicesData) {
			if (row._languages) {
				row._languages.forEach((lang: string) => languageCodes.add(lang));
			}
		}
		
		// Check settings data for language-specific fields
		const settings = settingsData[0] || {};
		for (const [key, value] of Object.entries(settings)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				// This looks like a language-specific field (e.g., {en: '...', es: '...'})
				for (const lang of Object.keys(value)) {
					languageCodes.add(lang);
				}
			}
		}

		// If no language-specific columns detected, use single language mode (backward compatibility)
		// Only use multiple languages if we actually have language-specific data
		const hasLanguageSpecificData = surveyData.some(row => 
			row._languages || 
			(typeof row.label === 'object' && row.label !== null) ||
			(typeof row.hint === 'object' && row.hint !== null)
		) || choicesData.some(row => 
			row._languages || 
			(typeof row.label === 'object' && row.label !== null)
		) || Object.values(settings).some(value =>
			typeof value === 'object' && value !== null && !Array.isArray(value)
		);
		
		if (hasLanguageSpecificData && languageCodes.size > 0) {
			const languagesArray = Array.from(languageCodes);
			// Ensure default language comes first, then sort the rest alphabetically
			const defaultLang = this.baseLanguage;
			this.availableLanguages = [
				defaultLang,
				...languagesArray.filter(lang => lang !== defaultLang).sort()
			];
		} else {
			this.availableLanguages = ['en'];
		}
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
			text: this.baseLanguage,
			help: '',
			language: this.baseLanguage,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

		// Add additional languages declaration (class S - survey settings)
		// This tells LimeSurvey which additional languages should be available
		if (this.availableLanguages.length > 1) {
			const additionalLanguages = this.availableLanguages.filter(lang => lang !== this.baseLanguage).join(' ');
			this.tsvGenerator.addRow({
				class: 'S',
				'type/scale': '',
				name: 'additional_languages',
				relevance: '1',
				text: additionalLanguages,
				help: '',
				language: this.baseLanguage,
				validation: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}

		// First, add the default language row according to LimeSurvey spec
		// This should be the first SL row for the default language
		const defaultLanguage = this.baseLanguage;
		
		// Add default language row (class SL - survey language settings)
		this.tsvGenerator.addRow({
			class: 'SL',
			'type/scale': '',
			name: 'surveyls_title',
			relevance: '1',
			text: this.getLanguageSpecificValue(settings.form_title, defaultLanguage) || surveyTitle,
			help: '',
			language: defaultLanguage,
			validation: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});
		

		// Then add rows for all other available languages (after default language)
		const otherLanguages = this.availableLanguages.filter(lang => lang !== defaultLanguage);
		
		// Sort other languages alphabetically for consistency
		otherLanguages.sort();
		
		for (const lang of otherLanguages) {
			this.tsvGenerator.addRow({
				class: 'SL',
				'type/scale': '',
				name: 'surveyls_title',
				relevance: '1',
				text: this.getLanguageSpecificValue(settings.form_title, lang) || surveyTitle,
				help: '',
				language: lang,
				validation: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
			
			
		}
	}

	private processRow(row: SurveyRow): void {
		const type = (row.type || '').trim();

		if (!type) return;

		// Check for unimplemented types (extract base type first, before any spaces)
		const baseType = type.split(/\s+/)[0];
		if (UNIMPLEMENTED_TYPES.includes(baseType)) {
			throw new Error(`Unimplemented XLSForm type: '${baseType}'. This type is not currently supported.`);
		}

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

		// Handle system variables as calculations
		if (type === 'start' || type === 'end' || type === 'today' || type === 'deviceid' || type === 'username') {
			this.addCalculation(row);
			return;
		}

		// Handle questions
		this.addQuestion(row);
	}

	private getLanguageSpecificValue(value: any, languageCode: string): string | undefined {
		if (!value) return undefined;
		
		// If it's already a string, return it
		if (typeof value === 'string') {
			return value;
		}
		
		// If it's an object with language codes, get the specific language
		if (typeof value === 'object' && value[languageCode]) {
			return value[languageCode];
		}
		
		// If it's an object but doesn't have the specific language, try to get any available language
		if (typeof value === 'object') {
			for (const lang of this.availableLanguages) {
				if (value[lang]) return value[lang];
			}
		}
		
		return undefined;
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

		// Add group for each language
		for (const lang of this.availableLanguages) {
			const defaults = this.configManager.getDefaults();
			this.tsvGenerator.addRow({
				class: 'G',
				'type/scale': '',
				name: groupName,
				relevance: this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || groupName,
				help: this.getLanguageSpecificValue(row.hint, lang) || '',
				language: lang,
				validation: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private addNote(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		// Add note for each language
		for (const lang of this.availableLanguages) {
			const defaults = this.configManager.getDefaults();
			this.tsvGenerator.addRow({
				class: 'Q',
				'type/scale': 'X', // Boilerplate/display text
				name: questionName,
				relevance: this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || questionName,
				help: this.getLanguageSpecificValue(row.hint, lang) || '',
				language: lang,
				validation: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private addCalculation(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		// Add calculation for each language
		for (const lang of this.availableLanguages) {
			const defaults = this.configManager.getDefaults();
			this.tsvGenerator.addRow({
				class: 'Q',
				'type/scale': '*', // Equation
				name: questionName,
				relevance: this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || questionName,
				help: '',
				language: lang,
				validation: this.relevanceConverter.convertCalculation(row.calculation || ''),
				mandatory: '',
				other: '',
				default: row.default || '',
				same_default: ''
			});
		}
	}

	private addQuestion(row: SurveyRow): void {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		const typeInfo = this.parseType(row.type || '');
		const lsType = this.mapType(typeInfo);

		// Add main question for each language
		for (const lang of this.availableLanguages) {
			const defaults = this.configManager.getDefaults();
			this.tsvGenerator.addRow({
				class: 'Q',
				'type/scale': lsType.type,
				name: questionName,
				relevance: this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || questionName,
				help: this.getLanguageSpecificValue(row.hint, lang) || '',
				language: lang,
				validation: this.relevanceConverter.convertConstraint(row.constraint || ''),
				mandatory: row.required === 'yes' || row.required === 'true' ? 'Y' : '',
				other: lsType.other ? 'Y' : '',
				default: row.default || '',
				same_default: ''
			});
		}

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

			// Add answer for each language
			for (const lang of this.availableLanguages) {
				const defaults = this.configManager.getDefaults();
				this.tsvGenerator.addRow({
					class: answerClass,
					'type/scale': '',
					name: choiceName,
					relevance: choice.filter
						? `({${this.currentGroup || 'parent'}} == "${choice.filter}")`
						: '',
					text: this.getLanguageSpecificValue(choice.label, lang) || choiceName,
					help: '',
					language: lang,
					validation: '',
					mandatory: '',
					other: '',
					default: '',
					same_default: ''
				});
			}
		}
	}

	private convertRelevance(relevant?: string): string {
		if (!relevant) return '1';
		return this.relevanceConverter.convert(relevant);
	}


}
