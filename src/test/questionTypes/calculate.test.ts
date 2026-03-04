import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from '../helpers';

describe('Calculate Question Type', () => {
	test('converts calculate to equation question type (*)', async () => {
		const survey = [
			{ type: 'decimal', name: 'amount', label: 'What was the price?' },
			{ type: 'calculate', name: 'tip', calculation: '${amount} * 0.18' }
		];

		const rows = await convertAndParse(survey);
		const tip = findRowByName(rows, 'tip');

		expect(tip).toBeDefined();
		expect(tip?.class).toBe('Q');
		expect(tip?.['type/scale']).toBe('*');
	});

	test('transpiles calculation expression to EM syntax in text field', async () => {
		const survey = [
			{ type: 'decimal', name: 'amount', label: 'What was the price?' },
			{ type: 'calculate', name: 'tip', calculation: '${amount} * 0.18' }
		];

		const rows = await convertAndParse(survey);
		const tip = findRowByName(rows, 'tip');

		// The text field should contain the transpiled expression wrapped in {}
		expect(tip?.text).toBe('{amount * 0.18}');
	});

	test('transpiles calculation with function calls', async () => {
		const survey = [
			{ type: 'calculate', name: 'day', calculation: 'today()' }
		];

		const rows = await convertAndParse(survey);
		const day = findRowByName(rows, 'day');

		expect(day?.text).toBe('{today()}');
	});

	test('calculate has no mandatory, validation, default, or other', async () => {
		const survey = [
			{ type: 'calculate', name: 'calc', calculation: '1 + 2' }
		];

		const rows = await convertAndParse(survey);
		const calc = findRowByName(rows, 'calc');

		expect(calc?.mandatory).toBe('');
		expect(calc?.other).toBe('');
		expect(calc?.default).toBe('');
	});

	test('calculate without calculation field uses empty expression', async () => {
		const survey = [
			{ type: 'calculate', name: 'empty_calc' }
		];

		const rows = await convertAndParse(survey);
		const calc = findRowByName(rows, 'emptycalc');

		expect(calc).toBeDefined();
		expect(calc?.['type/scale']).toBe('*');
		expect(calc?.text).toBe('{}');
	});
});

describe('Variable References in Labels', () => {
	test('converts ${var} to {var} in note labels', async () => {
		const survey = [
			{ type: 'decimal', name: 'amount', label: 'Price?' },
			{ type: 'calculate', name: 'tip', calculation: '${amount} * 0.18' },
			{ type: 'note', name: 'display', label: '18% tip for your meal is: ${tip}' }
		];

		const rows = await convertAndParse(survey);
		const note = findRowByName(rows, 'display');

		expect(note?.text).toBe('18% tip for your meal is: {tip}');
	});

	test('converts ${var_with_underscores} to {varwithunderscores}', async () => {
		const survey = [
			{ type: 'text', name: 'first_name', label: 'First name?' },
			{ type: 'note', name: 'greeting', label: 'Hello ${first_name}!' }
		];

		const rows = await convertAndParse(survey);
		const note = findRowByName(rows, 'greeting');

		expect(note?.text).toBe('Hello {firstname}!');
	});

	test('converts multiple ${var} references in one label', async () => {
		const survey = [
			{ type: 'text', name: 'a', label: 'A?' },
			{ type: 'text', name: 'b', label: 'B?' },
			{ type: 'note', name: 'summary', label: 'A is ${a} and B is ${b}' }
		];

		const rows = await convertAndParse(survey);
		const note = findRowByName(rows, 'summary');

		expect(note?.text).toBe('A is {a} and B is {b}');
	});

	test('converts ${var} references in hint text', async () => {
		const survey = [
			{ type: 'text', name: 'name', label: 'Name?' },
			{ type: 'text', name: 'q1', label: 'Question', hint: 'Previously you entered: ${name}' }
		];

		const rows = await convertAndParse(survey);
		const q = findRowByName(rows, 'q1');

		expect(q?.help).toBe('Previously you entered: {name}');
	});

	test('leaves text without ${} references unchanged', async () => {
		const survey = [
			{ type: 'note', name: 'plain', label: 'This has no variable references' }
		];

		const rows = await convertAndParse(survey);
		const note = findRowByName(rows, 'plain');

		expect(note?.text).toBe('This has no variable references');
	});
});
