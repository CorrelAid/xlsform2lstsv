import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowsByClass, findRowByName } from './helpers';

describe('Groups and Survey Structure', () => {
	describe('explicit groups', () => {
		test('converts begin_group and end_group', () => {
			const survey = [
				{ type: 'begin_group', name: 'demographics', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			expect(groups.length).toBeGreaterThan(0);
			const demoGroup = findRowByName(rows, 'demographics');
			expect(demoGroup?.text).toBe('Demographics');
		});

		test('handles begin group with spaces', () => {
			const survey = [
				{ type: 'begin group', name: 'section1', label: 'Section 1' },
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'end group' }
			];

			const rows = convertAndParse(survey);
			const group = findRowByName(rows, 'section1');

			expect(group).toBeDefined();
			expect(group?.class).toBe('G');
		});

		test('auto-generates group name if missing', () => {
			const survey = [
				{ type: 'begin_group', label: 'Unnamed Group' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have auto-generated group name
			const autoGroup = groups.find(g => g.name.match(/^G\d+$/));
			expect(autoGroup).toBeDefined();
			expect(autoGroup?.text).toBe('Unnamed Group');
		});

		test('handles multiple groups', () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'g2', label: 'Group 2' },
				{ type: 'text', name: 'q2', label: 'Q2' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have at least 2 groups (plus possible default)
			expect(groups.length).toBeGreaterThanOrEqual(2);
			expect(findRowByName(rows, 'g1')).toBeDefined();
			expect(findRowByName(rows, 'g2')).toBeDefined();
		});

		test('converts group with hint', () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'personal',
					label: 'Personal Info',
					hint: 'Please provide your personal information'
				},
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const group = findRowByName(rows, 'personal');

			expect(group?.help).toBe('Please provide your personal information');
		});

		test('converts group with relevance', () => {
			const survey = [
				{ type: 'select_one yesno', name: 'has_info', label: 'Provide info?' },
				{
					type: 'begin_group',
					name: 'details',
					label: 'Details',
					relevant: "${has_info} = 'yes'"
				},
				{ type: 'text', name: 'detail', label: 'Detail' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' }
			];

			const rows = convertAndParse(survey, choices);
			const group = findRowByName(rows, 'details');

			expect(group?.relevance).toContain('hasinfo'); // Underscores removed
		});
	});

	describe('default group', () => {
		test('creates default group when no groups defined', () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'text', name: 'q2', label: 'Question 2' }
			];

			const rows = convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have a default group
			expect(groups.length).toBeGreaterThan(0);
			expect(groups[0].text).toBe('Questions');
		});

		test('does not create default group when explicit groups exist', () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should not have a default "Questions" group
			const defaultGroup = groups.find(g => g.text === 'Questions' && g.name === 'Questions');
			expect(defaultGroup).toBeUndefined();
		});
	});

	describe('survey settings', () => {
		test('creates survey settings rows', () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const settings = [
				{ form_title: 'My Test Survey', default_language: 'en' }
			];

			const rows = convertAndParse(survey, [], settings);
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

		test('uses default values for missing settings', () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const rows = convertAndParse(survey, [], [{}]);
			const langRows = findRowsByClass(rows, 'SL');

			const titleRow = langRows.find(r => r.name === 'surveyls_title');
			expect(titleRow?.text).toBe('Untitled Survey');
		});

		test('creates description row', () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const rows = convertAndParse(survey);
			const langRows = findRowsByClass(rows, 'SL');

			const descRow = langRows.find(r => r.name === 'surveyls_description');
			expect(descRow).toBeDefined();
		});
	});

	describe('repeats', () => {
		test('logs warning for repeats but continues', () => {
			const survey = [
				{ type: 'begin_repeat', name: 'rep1', label: 'Repeat' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end_repeat' }
			];

			// Should not throw error
			const rows = convertAndParse(survey);

		// Converter continues processing
		expect(rows).toBeDefined();
		expect(rows.length).toBeGreaterThan(0);
		});

		test('handles begin repeat with spaces', () => {
			const survey = [
				{ type: 'begin repeat', name: 'rep1', label: 'Repeat' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end repeat' }
			];

			// Should not throw error
			const rows = convertAndParse(survey);
			expect(rows).toBeDefined();
		});
	});

	describe('overall structure', () => {
		test('creates complete survey structure', () => {
			const survey = [
				{ type: 'note', name: 'intro', label: 'Welcome!' },
				{ type: 'begin_group', name: 'demographics', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'feedback', label: 'Feedback' },
				{ type: 'text', name: 'comments', label: 'Comments' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);

			// Should have S (settings), SL (language settings), G (groups), Q (questions)
			expect(findRowsByClass(rows, 'S').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'SL').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'G').length).toBeGreaterThanOrEqual(2);
			expect(findRowsByClass(rows, 'Q').length).toBeGreaterThanOrEqual(4);
		});

		test('preserves question order within groups', () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group' },
				{ type: 'text', name: 'q1', label: 'First' },
				{ type: 'text', name: 'q2', label: 'Second' },
				{ type: 'text', name: 'q3', label: 'Third' },
				{ type: 'end_group' }
			];

			const rows = convertAndParse(survey);
			const questions = findRowsByClass(rows, 'Q');

			const q1Index = questions.findIndex(q => q.name === 'q1');
			const q2Index = questions.findIndex(q => q.name === 'q2');
			const q3Index = questions.findIndex(q => q.name === 'q3');

			expect(q1Index).toBeLessThan(q2Index);
			expect(q2Index).toBeLessThan(q3Index);
		});
	});
});
