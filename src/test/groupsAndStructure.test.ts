import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowsByClass, findRowByName } from './helpers';

describe('Groups and Survey Structure', () => {
	describe('explicit groups', () => {
		test('converts begin_group and end_group', async () => {
			const survey = [
				{ type: 'begin_group', name: 'demo', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			expect(groups.length).toBeGreaterThan(0);
			const demoGroup = findRowByName(rows, 'demo');
			expect(demoGroup?.text).toBe('Demographics');
		});

		

		test('auto-generates group name if missing', async () => {
			const survey = [
				{ type: 'begin_group', label: 'Unnamed Group' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have auto-generated group name
			const autoGroup = groups.find(g => g.name.match(/^G\d+$/));
			expect(autoGroup).toBeDefined();
			expect(autoGroup?.text).toBe('Unnamed Group');
		});

		test('handles multiple groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'g2', label: 'Group 2' },
				{ type: 'text', name: 'q2', label: 'Q2' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have at least 2 groups (plus possible default)
			expect(groups.length).toBeGreaterThanOrEqual(2);
			expect(findRowByName(rows, 'g1')).toBeDefined();
			expect(findRowByName(rows, 'g2')).toBeDefined();
		});

		test('converts group with hint', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'pers',
					label: 'Personal Info',
					hint: 'Please provide your personal information'
				},
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const group = findRowByName(rows, 'pers');

			expect(group?.help).toBe('Please provide your personal information');
		});

		test('converts group with relevance', async () => {
			const survey = [
				{ type: 'select_one yesno', name: 'hasinfo', label: 'Provide info?' },
				{
					type: 'begin_group',
					name: 'det',
					label: 'Details',
					relevant: "${has_info} = 'yes'"
				},
				{ type: 'text', name: 'det', label: 'Detail' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' }
			];

			const rows = await convertAndParse(survey, choices);
			const group = findRowByName(rows, 'det');

			expect(group?.relevance).toContain('hasinfo'); // Underscores removed
		});
	});

	describe('default group', () => {
		test('creates default group when no groups defined', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'text', name: 'q2', label: 'Question 2' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have a default group
			expect(groups.length).toBeGreaterThan(0);
			expect(groups[0].text).toBe('Questions');
		});

		test('does not create default group when explicit groups exist', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should not have a default "Questions" group
			const defaultGroup = groups.find(g => g.text === 'Questions' && g.name === 'Questions');
			expect(defaultGroup).toBeUndefined();
		});
	});

	describe('survey settings', () => {
		test('creates survey settings rows', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const settings = [
				{ form_title: 'My Test Survey', default_language: 'en' }
			];

			const rows = await convertAndParse(survey, [], settings);
			const settingsRows = findRowsByClass(rows, 'S');
			const langRows = findRowsByClass(rows, 'SL');

			expect(settingsRows.length).toBeGreaterThan(0);
			expect(langRows.length).toBeGreaterThan(0);

			// Check title
			const titleRow = langRows.find(r => r.name === 'surveyls_title');
			expect(titleRow?.text).toBe('My Test Survey');

			// Check language
			const langRow = settingsRows.find(r => r.name === 'language');
			expect(langRow?.text).toBe('en');
		});

		test('uses default values for missing settings', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const rows = await convertAndParse(survey, [], [{}]);
			const langRows = findRowsByClass(rows, 'SL');

			const titleRow = langRows.find(r => r.name === 'surveyls_title');
			expect(titleRow?.text).toBe('Untitled Survey');
		});


	});

	describe('overall structure', () => {
		test('creates complete survey structure', async () => {
			const survey = [
				{ type: 'note', name: 'intro', label: 'Welcome!' },
				{ type: 'begin_group', name: 'demo', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'feed', label: 'Feedback' },
				{ type: 'text', name: 'comm', label: 'Comments' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);

			// Should have S (settings), SL (language settings), G (groups), Q (questions)
			expect(findRowsByClass(rows, 'S').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'SL').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'G').length).toBeGreaterThanOrEqual(2);
			expect(findRowsByClass(rows, 'Q').length).toBeGreaterThanOrEqual(4);
		});

		test('preserves question order within groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group' },
				{ type: 'text', name: 'q1', label: 'First' },
				{ type: 'text', name: 'q2', label: 'Second' },
				{ type: 'text', name: 'q3', label: 'Third' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const questions = findRowsByClass(rows, 'Q');

			const q1Index = questions.findIndex(q => q.name === 'q1');
			const q2Index = questions.findIndex(q => q.name === 'q2');
			const q3Index = questions.findIndex(q => q.name === 'q3');

			expect(q1Index).toBeLessThan(q2Index);
			expect(q2Index).toBeLessThan(q3Index);
		});
	});
});
