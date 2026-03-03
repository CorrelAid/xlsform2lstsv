import { describe, it, expect } from 'vitest';
import { XLSLoader, XLSFormToTSVConverter } from '../../index';
import { parseTSV } from '../helpers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testFilePath = path.join(__dirname, '../../../docker_tests/fixtures/testB.xlsx');
const testFileData = fs.readFileSync(testFilePath);

describe('Integration: testB.xlsx', () => {
	it('should load the xlsx file', () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		expect(surveyData.length).toBeGreaterThan(0);
		expect(choicesData.length).toBeGreaterThan(0);
		expect(settingsData.length).toBeGreaterThan(0);
	});

	it('should convert without throwing', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		expect(tsv).toBeTruthy();
	});

	it('should silently skip start and end metadata types', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		// start/end rows should not appear in the output
		expect(rows.find(r => r['type/scale'] === 'start')).toBeUndefined();
		expect(rows.find(r => r['type/scale'] === 'end')).toBeUndefined();
	});

	it('should produce matrix questions (type F) for label/list-nolabel patterns', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		// The tools matrix header should be type F (Array)
		const toolsMatrix = rows.filter(r => r.name === 'ratingtechnologiesto' && r.class === 'Q');
		expect(toolsMatrix.length).toBeGreaterThan(0);
		expect(toolsMatrix[0]['type/scale']).toBe('F');

		// There should be SQ rows for the subquestions (e.g. soscisurvey)
		const subquestions = rows.filter(r => r.class === 'SQ' && r.name === 'soscisurvey');
		expect(subquestions.length).toBeGreaterThan(0);

		// There should be A rows for the shared answer options (beginner, user, etc.)
		const answers = rows.filter(r => r.class === 'A' && r.name === 'begin');
		expect(answers.length).toBeGreaterThan(0);
	});

	it('should transpile relevant expressions with hyphens in variable names', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		// The sosci_survey subquestion should have a proper relevance expression
		// original: selected(${project_role_2026-02-DTC}, 'role-surveydesign-datacollection')
		const sqRow = rows.find(r => r.class === 'SQ' && r.name === 'soscisurvey');
		expect(sqRow).toBeDefined();
		expect(sqRow!.relevance).toContain('projectrole202602DTC');
		expect(sqRow!.relevance).toContain('role-surveydesign-datacollection');

		// Simple equality relevant: ${past_applications} = 'not_successful'
		const pastDetailsRow = rows.find(r => r.name === 'pastapplicationsdeta' && r.class === 'Q');
		expect(pastDetailsRow).toBeDefined();
		expect(pastDetailsRow!.relevance).toContain('pastapplications');
		expect(pastDetailsRow!.relevance).toContain('not_successful');
	});

	it('should produce both languages (de and en)', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		const deRows = rows.filter(r => r.language === 'de');
		const enRows = rows.filter(r => r.language === 'en');
		expect(deRows.length).toBeGreaterThan(0);
		expect(enRows.length).toBeGreaterThan(0);
	});
});
