import { ConfigManager, ConversionConfig } from './config/ConfigManager.js';
import { SurveyRow, ChoiceRow, SettingsRow } from './config/types.js';
import { convertRelevance, convertConstraint, xpathToLimeSurvey, TranspilerContext } from './converters/xpathTranspiler.js';
import { FieldSanitizer } from './processors/FieldSanitizer.js';
import { TSVGenerator } from './processors/TSVGenerator.js';
import { TypeMapper, TypeInfo, LSType } from './processors/TypeMapper.js';
import { getBaseLanguage } from './utils/languageUtils.js';

// Metadata types that should be silently skipped (no visual representation)
const SKIP_TYPES = [
	'start', 'end', 'today', 'deviceid', 'username',
	'hidden', 'audit'
];

// Unimplemented XLSForm types that should raise an error
const UNIMPLEMENTED_TYPES = [
	'geopoint', 'geotrace', 'geoshape', 'start-geopoint',
	'image', 'audio', 'video', 'file',
	'background-audio', 'csv-external', 'phonenumber', 'email',
	'barcode',
	'range', // Range questions don't exist in LimeSurvey
	'select_one_from_file', // External file loading not supported in LimeSurvey TSV import
	'select_multiple_from_file', // External file loading not supported in LimeSurvey TSV import
	'acknowledge', // Acknowledge type not supported in LimeSurvey TSV import
	'begin_repeat',
	'end_repeat'
];

// Appearances handled without warning: label, list-nolabel (matrix), multiline (→T), likert (no-op), field-list (no-op with format=A)
const UNSUPPORTED_APPEARANCES = [
	'minimal', 'quick', 'no-calendar', 'month-year', 'year',
	'horizontal-compact', 'horizontal', 'compact', 'quickcompact',
	'table-list', 'signature', 'draw', 'map', 'quick map',
];

// Naming convention:
// - xfType: XLSForm type (string from row.type)
// - xfTypeInfo: Parsed XLSForm type information (TypeInfo interface)
// - lsType: LimeSurvey type information (LSType interface)

interface TSVRowData {
	class: string; 'type/scale': string; name: string; relevance: string;
	text: string; help: string; language: string; validation: string;
	em_validation_q: string; mandatory: string; other: string;
	default: string; same_default: string; hidden?: string;
}

export class XLSFormToTSVConverter {

	private configManager: ConfigManager;
	private fieldSanitizer: FieldSanitizer;
	private typeMapper: TypeMapper;
	private tsvGenerator: TSVGenerator;
	private choicesMap: Map<string, ChoiceRow[]>;
	private currentGroup: string | null;
	private groupStack: Array<{ originalName: string; sanitizedName: string; emittedAsGroup: boolean }>;
	private parentOnlyGroups: Set<string>;
	private pendingGroupNotes: SurveyRow[];
	private groupSeq: number;
	private questionSeq: number;
	private answerSeq: number;
	private subquestionSeq: number;
	private availableLanguages: string[];
	private baseLanguage: string;
	private inMatrix: boolean;
	private matrixListName: string | null;
	private groupContentBuffer: TSVRowData[];
	private answerCodeMap: Map<string, Map<string, string>>;
	private questionToListMap: Map<string, string>;
	private questionBaseTypeMap: Map<string, string>;

	constructor(config?: Partial<ConversionConfig>) {
		this.configManager = new ConfigManager(config);
		this.configManager.validateConfig();

		this.fieldSanitizer = new FieldSanitizer();

		this.typeMapper = new TypeMapper();

		this.tsvGenerator = new TSVGenerator();
		this.choicesMap = new Map();
		this.currentGroup = null;
		this.groupStack = [];
		this.parentOnlyGroups = new Set();
		this.pendingGroupNotes = [];
		this.groupSeq = 0;
		this.questionSeq = 0;
		this.answerSeq = 0;
		this.subquestionSeq = 0;
		this.availableLanguages = ['en']; // Default to English
		this.baseLanguage = 'en'; // Default to English
		this.inMatrix = false;
		this.matrixListName = null;
		this.groupContentBuffer = [];
		this.answerCodeMap = new Map();
		this.questionToListMap = new Map();
		this.questionBaseTypeMap = new Map();
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

	async convert(
		surveyData: SurveyRow[],
		choicesData: ChoiceRow[],
		settingsData: SettingsRow[]
	): Promise<string> {
		// Reset state
		this.choicesMap.clear();
		this.currentGroup = null;
		this.groupStack = [];
		this.pendingGroupNotes = [];
		this.tsvGenerator.clear();
		this.groupSeq = 0;
		this.questionSeq = 0;
		this.answerSeq = 0;
		this.subquestionSeq = 0;
		this.inMatrix = false;
		this.matrixListName = null;
		this.groupContentBuffer = [];

		// Pre-scan to identify parent-only groups (no direct questions, only child groups)
		this.parentOnlyGroups = this.identifyParentOnlyGroups(surveyData);

		// Set base language from settings first
		this.baseLanguage = getBaseLanguage(settingsData[0] || {});
		
		// Detect available languages from survey data (will use baseLanguage for ordering)
		this.detectAvailableLanguages(surveyData, choicesData, settingsData);
		
		// Build choices map
		this.buildChoicesMap(choicesData);

		// Build answer code and question-to-list maps for relevance rewriting
		this.buildAnswerCodeMap();
		this.buildQuestionToListMap(surveyData);

		// Add survey row (class S)
		this.addSurveyRow(settingsData[0] || {});

		// Check if we need a default group (if no groups are defined)
		const hasGroups = surveyData.some(row => {
			const xfType = (row.type || '').trim();
			return xfType === 'begin_group';
		});

		// If no groups, add a default group
		const advancedOptions = this.configManager.getAdvancedOptions();
		if (!hasGroups && advancedOptions.autoCreateGroups) {
			this.addDefaultGroup();
		}

		// Process survey rows
		for (const row of surveyData) {
			await this.processRow(row);
		}

		// Flush any pending matrix at the end
		this.flushMatrix();

		// Flush remaining buffered group content
		this.flushGroupContent();

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
		for (const [, value] of Object.entries(settings)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				// This looks like a language-specific field (e.g., {en: '...', es: '...'})
				for (const lang of Object.keys(value)) {
					languageCodes.add(lang);
				}
			}
		}

		// If no language-specific columns detected, use single language mode 
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

	private buildAnswerCodeMap(): void {
		this.answerCodeMap = new Map();
		for (const [listName, choices] of this.choicesMap) {
			const codeMap = new Map<string, string>();
			const sanitized: string[] = [];
			for (const choice of choices) {
				const raw = choice.name?.trim() || '';
				sanitized.push(raw ? this.sanitizeAnswerCode(raw) : '');
			}
			const used = new Set<string>();
			for (let i = 0; i < sanitized.length; i++) {
				if (!sanitized[i]) continue;
				let name = sanitized[i];
				if (used.has(name)) {
					let counter = 1;
					let candidate: string;
					do {
						const suffix = String(counter);
						candidate = name.substring(0, 5 - suffix.length) + suffix;
						counter++;
					} while (used.has(candidate));
					sanitized[i] = candidate;
				}
				used.add(sanitized[i]);
				const originalName = choices[i].name?.trim() || '';
				if (originalName) {
					codeMap.set(originalName, sanitized[i]);
				}
			}
			this.answerCodeMap.set(listName, codeMap);
		}
	}

	private buildQuestionToListMap(surveyData: SurveyRow[]): void {
		this.questionToListMap = new Map();
		this.questionBaseTypeMap = new Map();
		for (const row of surveyData) {
			const typeInfo = this.parseType(row.type || '');
			if (typeInfo.listName && row.name) {
				const sanitizedName = this.sanitizeName(row.name.trim());
				this.questionToListMap.set(sanitizedName, typeInfo.listName);
				this.questionBaseTypeMap.set(sanitizedName, typeInfo.base);
			}
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
			em_validation_q: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

		this.groupSeq++;
	}

	private addAutoGroupForOrphans(): void {
		const groupName = `G${this.groupSeq}`;
		this.groupSeq++;
		this.currentGroup = groupName;

		const groupSeqKey = String(this.groupSeq);

		for (const lang of this.availableLanguages) {
			this.tsvGenerator.addRow({
				class: 'G',
				'type/scale': groupSeqKey,
				name: groupName,
				relevance: '1',
				text: groupName,
				help: '',
				language: lang,
				validation: '',
				em_validation_q: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private addSurveyRow(settings: SettingsRow): void {
		// Add survey-level settings as individual S rows
		// Each survey property gets its own row with name=property_name, text=value

		const defaults = this.configManager.getDefaults();
		const surveyTitle = settings.form_title || defaults.surveyTitle;

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
			em_validation_q: '',
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
				em_validation_q: '',
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}

		// Set survey format to "All in one" (all groups/questions on one page)
		this.tsvGenerator.addRow({
			class: 'S',
			'type/scale': '',
			name: 'format',
			relevance: '1',
			text: 'A',
			help: '',
			language: this.baseLanguage,
			validation: '',
			em_validation_q: '',
			mandatory: '',
			other: '',
			default: '',
			same_default: ''
		});

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
			em_validation_q: '',
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
					em_validation_q: "",
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
			
			
		}
	}

	/**
	 * Pre-scan survey data to identify parent-only groups.
	 * A parent-only group contains no direct questions — only child groups.
	 * These will be flattened into note questions in the first child group.
	 */
	private identifyParentOnlyGroups(surveyData: SurveyRow[]): Set<string> {
		const parentOnly = new Set<string>();
		const stack: string[] = [];
		const hasDirectContent = new Map<string, boolean>();

		for (const row of surveyData) {
			const type = (row.type || '').trim();
			const baseType = type.split(/\s+/)[0];

			if (type === 'begin_group' || type === 'begin group') {
				const name = (row.name || '').trim();
				stack.push(name);
				hasDirectContent.set(name, false);
			} else if (type === 'end_group' || type === 'end group') {
				const name = stack.pop();
				if (name !== undefined && !hasDirectContent.get(name)) {
					parentOnly.add(name);
				}
			} else if (type && !SKIP_TYPES.includes(baseType)) {
				// Any non-skip, non-group row counts as direct content
				if (stack.length > 0) {
					hasDirectContent.set(stack[stack.length - 1], true);
				}
			}
		}

		return parentOnly;
	}

	private async processRow(row: SurveyRow): Promise<void> {
		const xfType = (row.type || '').trim();

		if (!xfType) return;

		// Check for unimplemented types (extract base type first, before any spaces)
		const baseType = xfType.split(/\s+/)[0];

		// Silently skip metadata types
		if (SKIP_TYPES.includes(baseType)) {
			return;
		}

		// Other unimplemented types throw errors
		if (UNIMPLEMENTED_TYPES.includes(baseType)) {
			throw new Error(`Unimplemented XLSForm type: '${baseType}'. This type is not currently supported.`);
		}

		if (xfType === 'begin_group' || xfType === 'begin group') {
			this.flushMatrix();
			const originalName = (row.name || '').trim();
			const sanitizedName = originalName
				? this.sanitizeName(originalName)
				: `G${this.groupSeq}`;

			if (this.parentOnlyGroups.has(originalName)) {
				// Parent-only group: save label as pending note, don't emit G row
				this.groupStack.push({ originalName, sanitizedName, emittedAsGroup: false });
				this.pendingGroupNotes.push(row);
			} else {
				// Regular group: flush buffered content from previous group, then emit G row
				this.groupStack.push({ originalName, sanitizedName, emittedAsGroup: true });
				this.flushGroupContent();
				await this.addGroup(row);
				// Emit pending parent-only group notes as note questions in this group
				await this.emitPendingGroupNotes();
			}
			return;
		}
		if (xfType === 'end_group' || xfType === 'end group') {
			this.flushMatrix();
			this.groupStack.pop();
			// Restore currentGroup to nearest ancestor that was emitted as a group
			this.currentGroup = null;
			for (let i = this.groupStack.length - 1; i >= 0; i--) {
				if (this.groupStack[i].emittedAsGroup) {
					this.currentGroup = this.groupStack[i].sanitizedName;
					break;
				}
			}
			return;
		}

		// Auto-create a group for questions outside any explicit group.
		// LimeSurvey requires every question to belong to a group.
		if (this.currentGroup === null && this.groupStack.length === 0) {
			this.flushGroupContent();
			this.addAutoGroupForOrphans();
		}

		// Handle notes and questions
		await this.addQuestion(row);
	}

	/**
	 * Emit pending parent-only group labels as note questions (type X).
	 * Called after a child group's G row is emitted.
	 */
	private async emitPendingGroupNotes(): Promise<void> {
		for (const noteRow of this.pendingGroupNotes) {
			const noteName = noteRow.name && noteRow.name.trim() !== ''
				? this.sanitizeName(noteRow.name.trim())
				: `GN${this.questionSeq}`;

			this.questionSeq++;

			for (const lang of this.availableLanguages) {
				this.bufferRow({
					class: 'Q',
					'type/scale': 'X',
					name: noteName,
					relevance: await this.convertRelevance(noteRow.relevant),
					text: this.getLanguageSpecificValue(noteRow.label, lang) || noteName,
					help: this.getLanguageSpecificValue(noteRow.hint, lang) || '',
					language: lang,
					validation: '',
					em_validation_q: '',
					mandatory: '',
					other: '',
					default: '',
					same_default: ''
				});
			}
		}
		this.pendingGroupNotes = [];
	}

	private getLanguageSpecificValue(value: unknown, languageCode: string): string | undefined {
		if (!value) return undefined;
		
		// If it's already a string, return it
		if (typeof value === 'string') {
			return value;
		}
		
		// If it's an object with language codes, get the specific language
		if (typeof value === 'object' && value !== null) {
			const valueObj: Record<string, unknown> = value as Record<string, unknown>;
			if (languageCode in valueObj) {
				return valueObj[languageCode] as string;
			}
			
			// If it doesn't have the specific language, try to get any available language
			for (const lang of this.availableLanguages) {
				if (lang in valueObj) return valueObj[lang] as string;
			}
		}
		
		return undefined;
	}

	/**
	 * Buffer a Q/SQ/A row for later language-grouped output.
	 * LimeSurvey's TSV importer uses a question_order counter ($qseq) that gets
	 * reset when it encounters a translation of a previously-seen question.
	 * With interleaved languages (Q de, Q en, Q de, Q en), the counter resets
	 * after each translation, giving all subsequent questions order=0.
	 * By outputting all base-language rows first, the counter increments correctly,
	 * and translation rows just look up their stored values.
	 */
	private bufferRow(row: TSVRowData): void {
		this.groupContentBuffer.push(row);
	}

	/**
	 * Flush buffered group content, outputting base language rows first,
	 * then each additional language. This preserves insertion order within
	 * each language while ensuring LimeSurvey's question_order counter
	 * increments correctly.
	 */
	private flushGroupContent(): void {
		if (this.groupContentBuffer.length === 0) return;

		// Output base language rows first (preserving insertion order)
		for (const row of this.groupContentBuffer) {
			if (row.language === this.baseLanguage) {
				this.tsvGenerator.addRow(row);
			}
		}

		// Then output each additional language (preserving insertion order)
		for (const lang of this.availableLanguages) {
			if (lang === this.baseLanguage) continue;
			for (const row of this.groupContentBuffer) {
				if (row.language === lang) {
					this.tsvGenerator.addRow(row);
				}
			}
		}

		this.groupContentBuffer = [];
	}

	private sanitizeName(name: string): string {
		return this.fieldSanitizer.sanitizeName(name);
	}

	private sanitizeAnswerCode(code: string): string {
		return this.fieldSanitizer.sanitizeAnswerCode(code);
	}

	/**
	 * Convert ${varname} references in text to LimeSurvey EM syntax {sanitizedname}.
	 */
	private convertVariableReferences(text: string): string {
		return text.replace(/\$\{([^}]+)\}/g, (_, name: string) => {
			const sanitized = name.replace(/[_-]/g, '');
			return `{${sanitized}}`;
		});
	}

	/**
	 * Transpile an XLSForm calculation expression to a LimeSurvey EM expression.
	 */
	private async convertCalculation(calculation: string): Promise<string> {
		return await xpathToLimeSurvey(calculation, this.buildTranspilerContext());
	}

	private async addGroup(row: SurveyRow): Promise<void> {
		// Auto-generate name if missing (matches LimeSurvey behavior)
		const groupName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `G${this.groupSeq}`;

		this.groupSeq++;
		this.currentGroup = groupName;

		// Groups support relevance but not validation.
		// LimeSurvey's TSV importer matches group translations across languages
		// using the type/scale column as a stable group sequence key. Without it,
		// an auto-counter resets on each language change and mismatches groups.
		// We set type/scale to the group sequence number to ensure correct matching.
		const groupSeqKey = String(this.groupSeq);

		for (const lang of this.availableLanguages) {
			this.tsvGenerator.addRow({
				class: 'G',
				'type/scale': groupSeqKey,
				name: this.getLanguageSpecificValue(row.label, lang) || groupName,
				relevance: await this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.hint, lang) || '',
				help: '',
				language: lang,
				validation: '',
				em_validation_q: "",
				mandatory: '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private async addQuestion(row: SurveyRow): Promise<void> {
		const xfTypeInfo = this.parseType(row.type || '');
		const appearance = typeof row['appearance'] === 'string' ? row['appearance'].trim() : '';

		// Matrix header: select_one with appearance "label"
		if (appearance === 'label' && xfTypeInfo.base === 'select_one' && xfTypeInfo.listName) {
			this.flushMatrix();
			await this.addMatrixHeader(row, xfTypeInfo);
			return;
		}

		// Matrix subquestion: select_one with appearance "list-nolabel" while in matrix mode
		if (appearance === 'list-nolabel' && this.inMatrix && xfTypeInfo.base === 'select_one') {
			await this.addMatrixSubquestion(row);
			return;
		}

		// Non-matrix question: flush any pending matrix first
		this.flushMatrix();

		// Warn on unsupported appearances
		if (appearance) {
			const parts = appearance.split(/\s+/);
			for (const part of parts) {
				if (UNSUPPORTED_APPEARANCES.includes(part)) {
					console.warn(`Unsupported appearance "${part}" on question "${row.name}" will be ignored`);
				}
			}
		}

		// Auto-generate name if missing (matches LimeSurvey behavior)
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;

		const lsType = this.mapType(xfTypeInfo);

		// Appearance-based type overrides
		if (appearance) {
			const parts = appearance.split(/\s+/);
			// multiline text → Long free text (T)
			if (parts.includes('multiline') && (xfTypeInfo.base === 'text' || xfTypeInfo.base === 'string')) {
				lsType.type = 'T';
			}
		}

		// Notes have special handling
		const isNote = xfTypeInfo.base === 'note';
		const isCalculate = xfTypeInfo.base === 'calculate';

		// For calculate type, transpile the calculation expression to EM syntax
		let calculationExpr = '';
		if (isCalculate && row.calculation) {
			calculationExpr = await this.convertCalculation(row.calculation);
		}

		// Add main question for each language
		for (const lang of this.availableLanguages) {
			let text: string;
			if (isCalculate) {
				// Equation question: the EM expression wrapped in {} IS the question text
				text = `{${calculationExpr}}`;
			} else {
				text = this.getLanguageSpecificValue(row.label, lang) || questionName;
			}

			// Convert ${var} references to EM {var} syntax in text and help
			text = this.convertVariableReferences(text);
			const help = this.convertVariableReferences(
				this.getLanguageSpecificValue(row.hint, lang) || ''
			);

			this.bufferRow({
				class: 'Q',
				'type/scale': isNote ? 'X' : lsType.type,
				name: questionName,
				relevance: await this.convertRelevance(row.relevant),
				text,
				help,
				language: lang,
				validation: "",
				em_validation_q: (isNote || isCalculate) ? "" : await convertConstraint(row.constraint || ""),
				mandatory: (isNote || isCalculate) ? '' : (row.required === 'yes' || row.required === 'true' ? 'Y' : ''),
				other: (isNote || isCalculate) ? '' : (lsType.other ? 'Y' : ''),
				default: (isNote || isCalculate) ? '' : (row.default || ''),
				same_default: '',
				hidden: isCalculate ? '1' : '',
			});
		}

		// Reset answer sequence for this question
		this.answerSeq = 0;
		this.subquestionSeq = 0;

		// Add answers/subquestions for select types (notes don't have answers)
		if (!isNote && xfTypeInfo.listName) {
			this.addAnswers(xfTypeInfo, lsType);
		}
	}

	private async addMatrixHeader(row: SurveyRow, xfTypeInfo: TypeInfo): Promise<void> {
		const questionName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `Q${this.questionSeq}`;

		this.questionSeq++;
		this.inMatrix = true;
		this.matrixListName = xfTypeInfo.listName;
		this.subquestionSeq = 0;

		// Emit Q row with type F (Array)
		for (const lang of this.availableLanguages) {
			this.bufferRow({
				class: 'Q',
				'type/scale': 'F',
				name: questionName,
				relevance: await this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || questionName,
				help: this.getLanguageSpecificValue(row.hint, lang) || '',
				language: lang,
				validation: '',
				em_validation_q: '',
				mandatory: row.required === 'yes' || row.required === 'true' ? 'Y' : '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private async addMatrixSubquestion(row: SurveyRow): Promise<void> {
		const sqName = row.name && row.name.trim() !== ''
			? this.sanitizeName(row.name.trim())
			: `SQ${this.subquestionSeq}`;

		this.subquestionSeq++;

		for (const lang of this.availableLanguages) {
			this.bufferRow({
				class: 'SQ',
				'type/scale': '',
				name: sqName,
				relevance: await this.convertRelevance(row.relevant),
				text: this.getLanguageSpecificValue(row.label, lang) || sqName,
				help: '',
				language: lang,
				validation: '',
				em_validation_q: '',
				mandatory: row.required === 'yes' || row.required === 'true' ? 'Y' : '',
				other: '',
				default: '',
				same_default: ''
			});
		}
	}

	private flushMatrix(): void {
		if (!this.inMatrix || !this.matrixListName) {
			this.inMatrix = false;
			this.matrixListName = null;
			return;
		}

		const choices = this.choicesMap.get(this.matrixListName);
		if (choices) {
			let seq = 0;
			for (const choice of choices) {
				const choiceName = choice.name && choice.name.trim() !== ''
					? this.sanitizeAnswerCode(choice.name.trim())
					: `A${seq++}`;

				for (const lang of this.availableLanguages) {
					this.bufferRow({
						class: 'A',
						'type/scale': '',
						name: choiceName,
						relevance: '',
						text: this.getLanguageSpecificValue(choice.label, lang) || choiceName,
						help: '',
						language: lang,
						validation: '',
						em_validation_q: '',
						mandatory: '',
						other: '',
						default: '',
						same_default: ''
					});
				}
			}
		}

		this.inMatrix = false;
		this.matrixListName = null;
	}

	private parseType(typeStr: string): TypeInfo {
		return this.typeMapper.parseType(typeStr);
	}

	private mapType(xfTypeInfo: TypeInfo): LSType {
		return this.typeMapper.mapType(xfTypeInfo);
	}

	private addAnswers(xfTypeInfo: TypeInfo, lsType: LSType): void {
		const choices = this.choicesMap.get(xfTypeInfo.listName!);
		if (!choices) {
			console.warn(`Choice list not found: ${xfTypeInfo.listName}`);
			return;
		}

		// Use the answer class from the type mapping
		const answerClass = lsType.answerClass || (xfTypeInfo.base === 'select_multiple' ? 'SQ' : 'A');

		// Pre-compute sanitized choice names
		const choiceNames: string[] = [];
		for (const choice of choices) {
			const rawName = choice.name && choice.name.trim() !== '' ? choice.name.trim() : '';
			choiceNames.push(
				rawName
					? this.sanitizeAnswerCode(rawName)
					: (answerClass === 'SQ' ? `SQ${this.subquestionSeq++}` : `A${this.answerSeq++}`)
			);
		}

		// Resolve duplicate names by appending a counter suffix
		const usedNames = new Set<string>();
		for (let i = 0; i < choiceNames.length; i++) {
			let name = choiceNames[i];
			if (usedNames.has(name)) {
				let counter = 1;
				let candidate: string;
				do {
					const suffix = String(counter);
					candidate = name.substring(0, 5 - suffix.length) + suffix;
					counter++;
				} while (usedNames.has(candidate));
				console.warn(`Duplicate answer code "${name}" resolved to "${candidate}"`);
				choiceNames[i] = candidate;
			}
			usedNames.add(choiceNames[i]);
		}

		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i];
			const choiceName = choiceNames[i];

			// Add answer for each language
			for (const lang of this.availableLanguages) {
				this.bufferRow({
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
					em_validation_q: '',
					mandatory: '',
					other: '',
					default: '',
					same_default: ''
				});
			}
		}
	}

	private lookupAnswerCode(fieldName: string, choiceValue: string): { code: string; listName: string | undefined } {
		// Truncate to 20 chars to match converter's field sanitization
		// (the transpiler only removes _/- but doesn't truncate)
		const truncated = fieldName.length > 20 ? fieldName.substring(0, 20) : fieldName;
		const listName = this.questionToListMap.get(truncated);
		if (!listName) return { code: choiceValue, listName: undefined };
		const codeMap = this.answerCodeMap.get(listName);
		if (!codeMap) return { code: choiceValue, listName };
		return { code: codeMap.get(choiceValue) ?? choiceValue, listName };
	}

	private buildTranspilerContext(): TranspilerContext {
		return {
			lookupAnswerCode: (fieldName: string, choiceValue: string) => {
				return this.lookupAnswerCode(fieldName, choiceValue).code;
			},
			buildSelectedExpr: (fieldName: string, choiceValue: string) => {
				const truncated = fieldName.length > 20 ? fieldName.substring(0, 20) : fieldName;
				const { code } = this.lookupAnswerCode(fieldName, choiceValue);
				const baseType = this.questionBaseTypeMap.get(truncated);
				if (baseType === 'select_multiple') {
					return `(${truncated}_${code}.NAOK == 'Y')`;
				}
				return `(${truncated}.NAOK=='${code}')`;
			},
		};
	}

	private async convertRelevance(relevant?: string): Promise<string> {
		if (!relevant) return '1';
		return await convertRelevance(relevant, this.buildTranspilerContext());
	}


}
