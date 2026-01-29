import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName, findRowsByClass, createChoices } from '../helpers';

describe('Rank Question Type', () => {
	test('converts rank as ranking', () => {
		const survey = [
			{ type: 'rank', name: 'pref', label: 'Rank your preferences' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'pref');

		expect(question?.['type/scale']).toBe('R');
	});

	test('converts rank with required', () => {
		const survey = [
			{ type: 'rank', name: 'priority', label: 'Priority ranking', required: 'yes' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'priority');

		expect(question?.mandatory).toBe('Y');
	});

	test('converts rank with hint', () => {
		const survey = [
			{
				type: 'rank',
				name: 'order',
				label: 'Order items',
				hint: 'Drag and drop to rank from most to least important'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'order');

		expect(question?.help).toBe('Drag and drop to rank from most to least important');
	});

	test('converts rank with relevance', () => {
		const survey = [
			{ type: 'select_one yesno', name: 'hasrank', label: 'Do you want to rank?' },
			{
				type: 'rank',
				name: 'ranking',
				label: 'Your ranking',
				relevant: "${has_rank} = 'yes'"
			}
		];

		const choices = [
			{ list_name: 'yesno', name: 'yes', label: 'Yes' },
			{ list_name: 'yesno', name: 'no', label: 'No' }
		];

		const rows = convertAndParse(survey, choices);
		const question = findRowByName(rows, 'ranking');

		expect(question?.relevance).toContain('hasrank'); // Underscores removed
	});

	describe('answer options', () => {
		test('creates answer options for rank questions', () => {
			const survey = [
				{ type: 'rank priorities', name: 'ranking', label: 'Rank your priorities' }
			];

			const choices = createChoices('priorities', [
				{ name: 'hlth', label: 'Health' },
				{ name: 'educ', label: 'Education' },
				{ name: 'envr', label: 'Environment' }
			]);

			const rows = convertAndParse(survey, choices);
			const answers = findRowsByClass(rows, 'A');

			expect(answers.length).toBeGreaterThanOrEqual(3);
			expect(answers.map(a => a.name)).toContain('hlth');
			expect(answers.map(a => a.name)).toContain('educ');
			expect(answers.map(a => a.name)).toContain('envr');
		});

		test('handles rank questions with missing choice list', () => {
			const survey = [
				{ type: 'rank missing_list', name: 'ranking', label: 'Rank items' }
			];

			// Don't provide the choice list
			const rows = convertAndParse(survey, []);
			const question = findRowByName(rows, 'ranking');

			expect(question).toBeDefined();
			expect(question?.['type/scale']).toBe('R');
		});

		test('handles rank questions with or_other', () => {
			const survey = [
				{ type: 'rank options or_other', name: 'ranking', label: 'Rank options' }
			];

			const choices = createChoices('options', [
				{ name: 'opt1', label: 'Option 1' },
				{ name: 'opt2', label: 'Option 2' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'ranking');

			expect(question?.other).toBe('Y');
		});
	});
});