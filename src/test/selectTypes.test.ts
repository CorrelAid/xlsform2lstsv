import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName, findRowsByClass, createChoices } from './helpers';

describe('Select Question Types', () => {
	describe('select_one', () => {
		test('converts basic select_one question', () => {
			const survey = [
				{ type: 'select_one yesno', name: 'agree', label: 'Do you agree?' }
			];

			const choices = createChoices('yesno', [
				{ name: 'yes', label: 'Yes' },
				{ name: 'no', label: 'No' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'agree');

			expect(question?.class).toBe('Q');
			expect(question?.['type/scale']).toBe('L'); // List radio in LimeSurvey
		});

		test('creates answer options for select_one', () => {
			const survey = [
				{ type: 'select_one colors', name: 'color', label: 'Favorite color?' }
			];

			const choices = createChoices('colors', [
				{ name: 'red', label: 'Red' },
				{ name: 'blue', label: 'Blue' },
				{ name: 'green', label: 'Green' }
			]);

			const rows = convertAndParse(survey, choices);
			const answers = findRowsByClass(rows, 'A');

			expect(answers.length).toBeGreaterThanOrEqual(3);
			expect(answers.map(a => a.name)).toContain('red');
			expect(answers.map(a => a.name)).toContain('blue');
			expect(answers.map(a => a.name)).toContain('green');
		});

		test('converts select_one with or_other', () => {
			const survey = [
				{ type: 'select_one yesno or_other', name: 'choice', label: 'Choose' }
			];

			const choices = createChoices('yesno', [
				{ name: 'yes', label: 'Yes' },
				{ name: 'no', label: 'No' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'choice');

			expect(question?.other).toBe('Y');
		});

		test('handles select_one with required', () => {
			const survey = [
				{
					type: 'select_one yesno',
					name: 'required_choice',
					label: 'Make a choice',
					required: 'yes'
				}
			];

			const choices = createChoices('yesno', [
				{ name: 'yes', label: 'Yes' },
				{ name: 'no', label: 'No' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'requiredchoice'); // Underscores removed

			expect(question?.mandatory).toBe('Y');
		});

		test('handles missing choice list gracefully', () => {
			const survey = [
				{ type: 'select_one missing_list', name: 'q1', label: 'Question' }
			];

			// Don't provide the choice list
			const rows = convertAndParse(survey, []);
			const question = findRowByName(rows, 'q1');

			expect(question).toBeDefined();
			expect(question?.['type/scale']).toBe('L');
		});
	});

	describe('select_multiple', () => {
		test('converts basic select_multiple question', () => {
			const survey = [
				{ type: 'select_multiple interests', name: 'hobbies', label: 'What are your hobbies?' }
			];

			const choices = createChoices('interests', [
				{ name: 'sports', label: 'Sports' },
				{ name: 'music', label: 'Music' },
				{ name: 'reading', label: 'Reading' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'hobbies');

			expect(question?.class).toBe('Q');
			expect(question?.['type/scale']).toBe('M'); // Multiple choice in LimeSurvey
		});

		test('creates subquestions for select_multiple', () => {
			const survey = [
				{ type: 'select_multiple pets', name: 'animals', label: 'Which pets do you have?' }
			];

			const choices = createChoices('pets', [
				{ name: 'dog', label: 'Dog' },
				{ name: 'cat', label: 'Cat' },
				{ name: 'fish', label: 'Fish' }
			]);

			const rows = convertAndParse(survey, choices);
			const subquestions = findRowsByClass(rows, 'SQ');

			expect(subquestions.length).toBeGreaterThanOrEqual(3);
			expect(subquestions.map(sq => sq.name)).toContain('dog');
			expect(subquestions.map(sq => sq.name)).toContain('cat');
			expect(subquestions.map(sq => sq.name)).toContain('fish');
		});

		test('converts select_multiple with or_other', () => {
			const survey = [
				{ type: 'select_multiple items or_other', name: 'stuff', label: 'Select items' }
			];

			const choices = createChoices('items', [
				{ name: 'item1', label: 'Item 1' },
				{ name: 'item2', label: 'Item 2' }
			]);

			const rows = convertAndParse(survey, choices);
			const question = findRowByName(rows, 'stuff');

			expect(question?.other).toBe('Y');
		});

		test('handles auto-generated subquestion names', () => {
			const survey = [
				{ type: 'select_multiple list1', name: 'q1', label: 'Question' }
			];

			const choices = [
				{ list_name: 'list1', label: 'Choice 1' }, // No name
				{ list_name: 'list1', label: 'Choice 2' }  // No name
			];

			const rows = convertAndParse(survey, choices);
			const subquestions = findRowsByClass(rows, 'SQ');

			// Should have auto-generated names like SQ0, SQ1
			expect(subquestions.length).toBe(2);
			expect(subquestions.some(sq => sq.name.match(/^SQ\d+$/))).toBe(true);
		});
	});

	describe('choice filters', () => {
		test('handles choice filters in relevance', () => {
			const survey = [
				{ type: 'select_one countries', name: 'country', label: 'Country' },
				{ type: 'select_one cities', name: 'city', label: 'City' }
			];

			const choices = [
				...createChoices('countries', [
					{ name: 'usa', label: 'USA' },
					{ name: 'canada', label: 'Canada' }
				]),
				{ list_name: 'cities', name: 'nyc', label: 'New York', filter: 'usa' },
				{ list_name: 'cities', name: 'la', label: 'Los Angeles', filter: 'usa' },
				{ list_name: 'cities', name: 'toronto', label: 'Toronto', filter: 'canada' }
			];

			const rows = convertAndParse(survey, choices);
			const nycAnswer = findRowByName(rows, 'nyc');
			const torontoAnswer = findRowByName(rows, 'toronto');

			expect(nycAnswer?.relevance).toBeTruthy();
			expect(torontoAnswer?.relevance).toBeTruthy();
		});
	});

	describe('relevance with select questions', () => {
		test('converts select question with relevance based on selected value', () => {
			const survey = [
				{ type: 'select_one yesno', name: 'married', label: 'Are you married?' },
				{
					type: 'text',
					name: 'spouse',
					label: 'Spouse name',
					relevant: "selected(${married}, 'yes')"
				}
			];

			const choices = createChoices('yesno', [
				{ name: 'yes', label: 'Yes' },
				{ name: 'no', label: 'No' }
			]);

			const rows = convertAndParse(survey, choices);
			const spouseQuestion = findRowByName(rows, 'spouse');

			expect(spouseQuestion?.relevance).toContain('married'); // Underscores removed
			expect(spouseQuestion?.relevance).toContain('==');
			expect(spouseQuestion?.relevance).toContain('yes');
		});
	});
});
