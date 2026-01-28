import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName, findRowsByClass } from './helpers';

describe('Special Question Types', () => {
	describe('note', () => {
		test('converts note to boilerplate text', () => {
			const survey = [
				{ type: 'note', name: 'intro', label: 'Welcome to the survey!' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'intro');

			expect(question).toBeDefined();
			expect(question?.class).toBe('Q');
			expect(question?.['type/scale']).toBe('X'); // Boilerplate in LimeSurvey
			expect(question?.text).toBe('Welcome to the survey!');
		});

		test('auto-generates name for note without name', () => {
			const survey = [
				{ type: 'note', label: 'Important information' }
			];

			const rows = convertAndParse(survey);
			const notes = findRowsByClass(rows, 'Q').filter(q => q['type/scale'] === 'X');

			expect(notes.length).toBeGreaterThan(0);
			expect(notes[notes.length - 1].name).toMatch(/^Q\d+$/);
		});

		test('converts note with hint', () => {
			const survey = [
				{ type: 'note', name: 'n1', label: 'Note', hint: 'Additional help' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'n1');

			expect(question?.help).toBe('Additional help');
		});

		test('converts note with relevance', () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{
					type: 'note',
					name: 'conditional_note',
					label: 'This appears conditionally',
					relevant: '${q1} != ""'
				}
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'conditionalnote'); // Underscores removed

			expect(question?.relevance).toContain('q1'); // Underscores removed
		});
	});

	describe('calculate', () => {
		test('converts calculate to equation', () => {
			const survey = [
				{ type: 'integer', name: 'a', label: 'First number' },
				{ type: 'integer', name: 'b', label: 'Second number' },
				{ type: 'calculate', name: 'sum', calculation: '${a} + ${b}' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'sum');

			expect(question).toBeDefined();
			expect(question?.class).toBe('Q');
			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
			expect(question?.validation).toContain('a'); // Underscores removed
			expect(question?.validation).toContain('b'); // Underscores removed
		});

		test('converts calculation with functions', () => {
			const survey = [
				{ type: 'integer', name: 'x', label: 'X' },
				{ type: 'integer', name: 'y', label: 'Y' },
				{ type: 'calculate', name: 'avg', calculation: '(${x} + ${y}) / 2' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'avg');

			expect(question?.validation).toContain('x'); // Underscores removed
			expect(question?.validation).toContain('y'); // Underscores removed
			expect(question?.validation).toContain('/');
		});

		test('auto-generates name for calculate without name', () => {
			const survey = [
				{ type: 'calculate', calculation: '1 + 1' }
			];

			const rows = convertAndParse(survey);
			const equations = findRowsByClass(rows, 'Q').filter(q => q['type/scale'] === '*');

			expect(equations.length).toBeGreaterThan(0);
			expect(equations[equations.length - 1].name).toMatch(/^Q\d+$/);
		});

		test('converts calculate with label', () => {
			const survey = [
				{
					type: 'calculate',
					name: 'calc1',
					label: 'Calculated value',
					calculation: '10 * 2'
				}
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'calc1');

			expect(question?.text).toBe('Calculated value');
		});
	});

	describe('hidden', () => {
		test('converts hidden to equation', () => {
			const survey = [
				{ type: 'hidden', name: 'device_id', calculation: 'uuid()' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'deviceid'); // Underscores removed

			expect(question).toBeDefined();
			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});

		test('converts hidden with default value', () => {
			const survey = [
				{ type: 'hidden', name: 'version', default: '1.0' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'version');

			expect(question?.default).toBe('1.0');
		});
	});

	describe('other types', () => {
		test('converts geopoint as short text', () => {
			const survey = [
				{ type: 'geopoint', name: 'location', label: 'Current location' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'location');

			expect(question?.['type/scale']).toBe('S');
		});

		test('converts geotrace as long text', () => {
			const survey = [
				{ type: 'geotrace', name: 'path', label: 'Path taken' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'path');

			expect(question?.['type/scale']).toBe('T');
		});

		test('converts geoshape as long text', () => {
			const survey = [
				{ type: 'geoshape', name: 'area', label: 'Area boundary' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'area');

			expect(question?.['type/scale']).toBe('T');
		});

		test('converts image as file upload', () => {
			const survey = [
				{ type: 'image', name: 'photo', label: 'Take a photo' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'photo');

			expect(question?.['type/scale']).toBe('|');
		});

		test('converts audio as file upload', () => {
			const survey = [
				{ type: 'audio', name: 'recording', label: 'Record audio' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'recording');

			expect(question?.['type/scale']).toBe('|');
		});

		test('converts video as file upload', () => {
			const survey = [
				{ type: 'video', name: 'clip', label: 'Record video' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'clip');

			expect(question?.['type/scale']).toBe('|');
		});

		test('converts file as file upload', () => {
			const survey = [
				{ type: 'file', name: 'attachment', label: 'Upload file' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'attachment');

			expect(question?.['type/scale']).toBe('|');
		});

		test('converts barcode as short text', () => {
			const survey = [
				{ type: 'barcode', name: 'product_code', label: 'Scan barcode' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'productcode'); // Underscores removed

			expect(question?.['type/scale']).toBe('S');
		});

		test('converts acknowledge as boilerplate', () => {
			const survey = [
				{ type: 'acknowledge', name: 'consent', label: 'I agree to the terms' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'consent');

			expect(question?.['type/scale']).toBe('X');
		});

		test('converts rank as ranking', () => {
			const survey = [
				{ type: 'rank', name: 'preferences', label: 'Rank your preferences' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'preferences');

			expect(question?.['type/scale']).toBe('R');
		});

		test('handles unknown type as short text', () => {
			const survey = [
				{ type: 'unknown_type', name: 'q1', label: 'Question' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'q1');

			expect(question?.['type/scale']).toBe('S'); // Default fallback
		});
	});
});
