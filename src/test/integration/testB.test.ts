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
		// original: selected(${project_role_project-alpha}, 'role-survey-design')
		const sqRow = rows.find(r => r.class === 'SQ' && r.name === 'soscisurvey');
		expect(sqRow).toBeDefined();
		expect(sqRow!.relevance).toContain('projectroleprojectalpha');
		expect(sqRow!.relevance).toContain('role-survey-design');

		// Project-beta role relevance: selected(${project_role_project-beta}, 'role-visualization')
		const powerbiRow = rows.find(r => r.class === 'SQ' && r.name === 'powerbi');
		expect(powerbiRow).toBeDefined();
		expect(powerbiRow!.relevance).toContain('projectroleprojectbeta');
		expect(powerbiRow!.relevance).toContain('role-visualization');

		// Project-gamma role relevance: selected(${project_role_project-gamma}, 'role-machine-learning')
		const jupyterRow = rows.find(r => r.class === 'SQ' && r.name === 'jupyter');
		expect(jupyterRow).toBeDefined();
		expect(jupyterRow!.relevance).toContain('projectroleprojectgamma');
		expect(jupyterRow!.relevance).toContain('role-machine-learning');

		// Simple equality relevant: ${past_applications} = 'not_successful'
		const pastDetailsRow = rows.find(r => r.name === 'pastapplicationsdeta' && r.class === 'Q');
		expect(pastDetailsRow).toBeDefined();
		expect(pastDetailsRow!.relevance).toContain('pastapplications');
		expect(pastDetailsRow!.relevance).toContain('not_successful');
	});

	it('should preserve correct question ordering from the survey sheet', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		// Extract Q-class rows (questions) in order, deduplicate by name (multilingual rows)
		const questionNames: string[] = [];
		for (const r of rows) {
			if (r.class === 'Q' && !questionNames.includes(r.name)) {
				questionNames.push(r.name);
			}
		}

		// Verify key ordering: notes -> project -> roles -> skills -> demographics
		const indexOf = (name: string) => questionNames.indexOf(name);
		expect(indexOf('Hallo')).toBeLessThan(indexOf('projectid'));
		expect(indexOf('projectid')).toBeLessThan(indexOf('projectroleprojectal'));
		expect(indexOf('projectroleprojectal')).toBeLessThan(indexOf('projectroleprojectbe'));
		expect(indexOf('projectroleprojectbe')).toBeLessThan(indexOf('projectroleprojectga'));
		expect(indexOf('projectroleprojectga')).toBeLessThan(indexOf('ratingtechnologiesto'));
		expect(indexOf('ratingtechnologiesto')).toBeLessThan(indexOf('ratingtechniqueshead'));
		expect(indexOf('ratingtechniqueshead')).toBeLessThan(indexOf('ratingtopicsheader'));
		expect(indexOf('motivationskills')).toBeLessThan(indexOf('firstname'));
		expect(indexOf('gender')).toBeLessThan(indexOf('consentprivacypolicy'));
	});

	it('should produce correct groups (parent-only flattened, orphans get auto-groups)', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData, { skipValidation: true });

		const converter = new XLSFormToTSVConverter();
		const tsv = await converter.convert(surveyData, choicesData, settingsData);
		const rows = parseTSV(tsv);

		// Extract unique group names from G-class rows
		const groupNames = new Set<string>();
		for (const r of rows) {
			if (r.class === 'G') {
				groupNames.add(r.name);
			}
		}

		// grouplt58n55 is parent-only (no direct questions, only child groups)
		// so it gets flattened into a note question instead of a G row
		expect(groupNames).not.toContain('grouplt58n55');

		// Named groups from the XLSForm
		for (const group of [
			'groupgi4rv46',
			'ratingtechnologiesto',
			'ratingtechniques',
			'ratingtopics',
			'grouppr7pr34',
			'demographics',
		]) {
			expect(groupNames).toContain(group);
		}

		// Orphan questions (outside any group) get auto-generated groups:
		// - project_id and project_role_* are between groupgi4rv46 and grouplt58n55
		// - consent_privacy_policy is after demographics
		expect(groupNames.size).toBe(8);

		// projectroleprojectal must NOT be in the same group as Hallo
		const gRows = rows.filter(r => r.class === 'G' || r.class === 'Q');
		let currentGroup = '';
		const questionGroup = new Map<string, string>();
		for (const r of gRows) {
			if (r.class === 'G') currentGroup = r.name;
			if (r.class === 'Q') {
				if (!questionGroup.has(r.name)) questionGroup.set(r.name, currentGroup);
			}
		}
		expect(questionGroup.get('Hallo')).not.toBe(questionGroup.get('projectroleprojectal'));

		// grouplt58n55 should appear as a note question (type X) in the first child group
		const noteRow = rows.find(r => r.class === 'Q' && r.name === 'grouplt58n55');
		expect(noteRow).toBeDefined();
		expect(noteRow!['type/scale']).toBe('X');
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
