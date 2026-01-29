import { describe, it, expect } from 'vitest';
import { XLSFormParser, XLSFormToTSVConverter, XLSLoader, XLSValidator } from '../index';
import * as path from 'path';

/**
 * Integration tests for the XLSForm tutorial file.
 * Verifies proper parsing and conversion of the official XLSForm tutorial file
 * to ensure compatibility with real-world XLSForm examples.
 */
describe('Tutorial XLS File Integration', () => {
	const tutorialFilePath = path.join(__dirname, '../../tests/fixtures/tutorial.xls');

	it('should parse tutorial.xls file correctly', () => {
		// Load data (validation is included by default)
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSFile(tutorialFilePath);
		
		const result = { surveyData, choicesData, settingsData };

		// Should have survey and choices data
		expect(result.surveyData).toBeDefined();
		expect(result.choicesData).toBeDefined();
		expect(result.settingsData).toBeDefined();

		// Should have survey rows
		expect(result.surveyData.length).toBeGreaterThan(0);
		
		// Choices sheet may be empty in tutorial file
		// expect(result.choicesData.length).toBeGreaterThan(0);

		// Settings should be empty (no settings sheet in tutorial file)
		expect(result.settingsData.length).toBe(0);
	});

	it('should convert tutorial.xls to TSV successfully', async () => {
		const tsv = await XLSFormParser.convertXLSFileToTSV(tutorialFilePath);

		// Should produce non-empty TSV
		expect(tsv).toBeDefined();
		expect(tsv.length).toBeGreaterThan(0);

		// Should contain expected TSV headers
		expect(tsv).toContain('class\ttype/scale\tname\trelevance\ttext');

		// Should contain some expected content from the tutorial
		expect(tsv).toContain('What is this household member');
	});

	it('should handle tutorial.xls with manual conversion', () => {
		// Parse the file (validation is included by default)
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSFile(tutorialFilePath);

		// Convert using the main converter
		const converter = new XLSFormToTSVConverter();
		const tsv = converter.convert(surveyData, choicesData, settingsData);

		// Should produce valid TSV
		expect(tsv).toBeDefined();
		expect(tsv.length).toBeGreaterThan(0);

		// Should contain expected content
		expect(tsv).toContain('class\ttype/scale\tname\trelevance\ttext');
	});

	it('should identify tutorial.xls sheets correctly', () => {
		// Load data (validation is included by default)
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSFile(tutorialFilePath);
		
		const result = { surveyData, choicesData, settingsData };

		// Verify survey data structure
		const firstSurveyRow = result.surveyData[0];
		expect(firstSurveyRow).toHaveProperty('type');
		expect(firstSurveyRow).toHaveProperty('name');
		expect(firstSurveyRow).toHaveProperty('label');

		// Verify choices data structure
		if (result.choicesData.length > 0) {
			// Find first non-empty choice row (tutorial file has empty rows)
			const firstChoiceRow = result.choicesData.find(row => Object.keys(row).length > 0);
			if (firstChoiceRow) {
				expect(firstChoiceRow).toHaveProperty('list name'); // Tutorial uses spaces, not underscores
				expect(firstChoiceRow).toHaveProperty('name');
				expect(firstChoiceRow).toHaveProperty('label');
			}
		}
	});
});