import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from './helpers';

describe('Numeric Question Types', () => {
	test('converts integer question', () => {
		const survey = [
			{ type: 'integer', name: 'age', label: 'How old are you?' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'age');

		expect(question).toBeDefined();
		expect(question?.class).toBe('Q');
		expect(question?.['type/scale']).toBe('N'); // Numeric in LimeSurvey
		expect(question?.text).toBe('How old are you?');
	});

	test('converts int type as numeric', () => {
		const survey = [
			{ type: 'int', name: 'count', label: 'Count' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'count');

		expect(question?.['type/scale']).toBe('N');
	});

	test('converts decimal question', () => {
		const survey = [
			{ type: 'decimal', name: 'price', label: 'Enter price' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'price');

		expect(question?.['type/scale']).toBe('N');
	});

	test('converts range question', () => {
		const survey = [
			{ type: 'range', name: 'rating', label: 'Rate from 1-10' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'rating');

		expect(question?.['type/scale']).toBe('N');
	});

	test('converts required numeric question', () => {
		const survey = [
			{ type: 'integer', name: 'year', label: 'Birth year', required: 'true' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'year');

		expect(question?.mandatory).toBe('Y');
	});

	test('converts numeric question with constraint', () => {
		const survey = [
			{
				type: 'integer',
				name: 'age',
				label: 'Age',
				constraint: '. >= 18 and . <= 100'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'age');

		// Constraint converter returns regex patterns for numeric ranges
		expect(question?.validation).toContain('/^\\d');
	});

	test('converts numeric question with default value', () => {
		const survey = [
			{ type: 'integer', name: 'quantity', label: 'Quantity', default: '1' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'quantity');

		expect(question?.default).toBe('1');
	});

	test('converts numeric question with relevance based on another numeric', () => {
		const survey = [
			{ type: 'integer', name: 'income', label: 'Annual income' },
			{
				type: 'integer',
				name: 'tax',
				label: 'Tax paid',
				relevant: '${income} > 0'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'tax');

		expect(question?.relevance).toContain('income');
		expect(question?.relevance).toContain('>');
	});

	test('handles numeric question with hint', () => {
		const survey = [
			{
				type: 'decimal',
				name: 'gpa',
				label: 'GPA',
				hint: 'Enter as decimal (e.g., 3.75)'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'gpa');

		expect(question?.help).toBe('Enter as decimal (e.g., 3.75)');
	});
});
