import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName, findRowsByClass } from './helpers';

describe('Text Question Types', () => {
	test('converts basic text question', () => {
		const survey = [
			{ type: 'text', name: 'name', label: 'What is your name?' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'name');

		expect(question).toBeDefined();
		expect(question?.class).toBe('Q');
		expect(question?.['type/scale']).toBe('S'); // Short text in LimeSurvey
		expect(question?.text).toBe('What is your name?');
		expect(question?.name).toBe('name');
	});

	test('converts text question with hint', () => {
		const survey = [
			{
				type: 'text',
				name: 'address',
				label: 'Address',
				hint: 'Enter your full address'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'address');

		expect(question?.help).toBe('Enter your full address');
	});

	test('converts required text question', () => {
		const survey = [
			{ type: 'text', name: 'email', label: 'Email', required: 'yes' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'email');

		expect(question?.mandatory).toBe('Y');
	});

	test('converts text question with default value', () => {
		const survey = [
			{ type: 'text', name: 'country', label: 'Country', default: 'USA' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'country');

		expect(question?.default).toBe('USA');
	});

	test('converts text question with relevance', () => {
		const survey = [
			{ type: 'text', name: 'q1', label: 'First question' },
			{
				type: 'text',
				name: 'q2',
				label: 'Follow-up',
				relevant: '${q1} != ""'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'q2');

		expect(question?.relevance).toContain('q1');
		expect(question?.relevance).toContain('!=');
	});

	test('auto-generates name for text question without name', () => {
		const survey = [
			{ type: 'text', label: 'Question without name' }
		];

		const rows = convertAndParse(survey);
		const questions = findRowsByClass(rows, 'Q');

		expect(questions.length).toBeGreaterThan(0);
		expect(questions[questions.length - 1].name).toMatch(/^Q\d+$/);
	});

	test('converts string type as short text', () => {
		const survey = [
			{ type: 'string', name: 'str', label: 'String input' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'str');

		expect(question?.['type/scale']).toBe('S');
	});

	test('preserves exact label text', () => {
		const survey = [
			{
				type: 'text',
				name: 'q1',
				label: 'What is your name? (First and Last)'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'q1');

		expect(question?.text).toBe('What is your name? (First and Last)');
	});
});
