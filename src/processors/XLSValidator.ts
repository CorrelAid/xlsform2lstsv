
import { SurveyRow, ChoiceRow } from '../config/types';

export class XLSValidator {
	/**
	 * Validate that required sheets are present
	 * @param hasSurveySheet Whether survey sheet was found
	 * @param hasChoicesSheet Whether choices sheet was found
	 * @throws Error if required sheets are missing
	 */
	static validateRequiredSheets(hasSurveySheet: boolean, hasChoicesSheet: boolean): void {
		const missingSheets = [];
		if (!hasSurveySheet) missingSheets.push('survey');
		if (!hasChoicesSheet) missingSheets.push('choices');

		if (missingSheets.length > 0) {
			throw new Error(`XLSX file is missing required sheets: ${missingSheets.join(', ')}. An XLSForm must contain survey and choices sheets.`);
		}
	}

	/**
	 * Validate that survey sheet has required columns
	 * @param data Survey data
	 * @param sheetName Name of the survey sheet
	 * @throws Error if required columns are missing
	 */
	static validateSurveySheetColumns(data: SurveyRow[], sheetName: string): void {
		if (data.length === 0) {
			console.warn(`Warning: Survey sheet "${sheetName}" is empty.`);
			return;
		}

		// Find the first non-empty row to check for headers
		const firstNonEmptyRow = data.find(row => row && Object.keys(row).length > 0);
		if (!firstNonEmptyRow) {
			console.warn(`Warning: Survey sheet "${sheetName}" has no valid data rows.`);
			return;
		}

		// Check for required columns
		const requiredColumns = ['type', 'name', 'label'];
		const missingColumns = requiredColumns.filter(col => !firstNonEmptyRow[col]);

		if (missingColumns.length > 0) {
			throw new Error(`Survey sheet "${sheetName}" is missing required columns: ${missingColumns.join(', ')}. A survey sheet must contain type, name, and label columns.`);
		}

		// Warn about unexpected columns
		const expectedColumns = ['type', 'name', 'label', 'hint', 'required', 'relevant', 'constraint', 'constraint_message', 'calculation', 'default'];
		const allColumns = Object.keys(firstNonEmptyRow);
		const unexpectedColumns = allColumns.filter(col => !expectedColumns.includes(col));

		if (unexpectedColumns.length > 0) {
			console.warn(`Warning: Survey sheet "${sheetName}" contains unexpected columns: ${unexpectedColumns.join(', ')}. These columns will be ignored.`);
		}
	}

	/**
	 * Validate that choices sheet has required columns
	 * @param data Choices data
	 * @param sheetName Name of the choices sheet
	 * @throws Error if required columns are missing
	 */
	static validateChoicesSheetColumns(data: ChoiceRow[], sheetName: string): void {
		if (data.length === 0) {
			console.warn(`Warning: Choices sheet "${sheetName}" is empty.`);
			return;
		}

		// Find the first non-empty row to check for headers
		const firstNonEmptyRow = data.find(row => row && Object.keys(row).length > 0);
		if (!firstNonEmptyRow) {
			console.warn(`Warning: Choices sheet "${sheetName}" has no valid data rows.`);
			return;
		}

		// Check for required columns (handle both list_name and list name variations)
		const hasListName = firstNonEmptyRow['list_name'] || firstNonEmptyRow['list name'];
		const hasName = firstNonEmptyRow['name'];
		const hasLabel = firstNonEmptyRow['label'];

		const missingColumns = [];
		if (!hasListName) missingColumns.push('list_name');
		if (!hasName) missingColumns.push('name');
		if (!hasLabel) missingColumns.push('label');

		if (missingColumns.length > 0) {
			throw new Error(`Choices sheet "${sheetName}" is missing required columns: ${missingColumns.join(', ')}. A choices sheet must contain list_name, name, and label columns.`);
		}

		// Warn about unexpected columns
		const expectedColumns = ['list_name', 'list name', 'name', 'label', 'filter'];
		const allColumns = Object.keys(firstNonEmptyRow);
		const unexpectedColumns = allColumns.filter(col => !expectedColumns.includes(col));

		if (unexpectedColumns.length > 0) {
			console.warn(`Warning: Choices sheet "${sheetName}" contains unexpected columns: ${unexpectedColumns.join(', ')}. These columns will be ignored.`);
		}
	}

	/**
	 * Validate all sheets in the parsed data
	 * @param surveyData Survey data
	 * @param choicesData Choices data
	 * @param hasSurveySheet Whether survey sheet was found
	 * @param hasChoicesSheet Whether choices sheet was found
	 * @param surveySheetName Name of the survey sheet
	 * @param choicesSheetName Name of the choices sheet
	 */
	static validateAll(
		surveyData: SurveyRow[],
		choicesData: ChoiceRow[],
		hasSurveySheet: boolean,
		hasChoicesSheet: boolean,
		surveySheetName: string = 'survey',
		choicesSheetName: string = 'choices'
	): void {
		// Validate required sheets
		this.validateRequiredSheets(hasSurveySheet, hasChoicesSheet);

		// Validate survey sheet columns
		if (hasSurveySheet && surveyData.length > 0) {
			this.validateSurveySheetColumns(surveyData, surveySheetName);
		}

		// Validate choices sheet columns
		if (hasChoicesSheet && choicesData.length > 0) {
			this.validateChoicesSheetColumns(choicesData, choicesSheetName);
		}
	}
}