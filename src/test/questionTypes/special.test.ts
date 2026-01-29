import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from '../helpers';

describe('Special Question Types', () => {


	describe('unknown types', () => {
		test('handles unknown type as short text', () => {
			const survey = [
				{ type: 'unknown_type', name: 'q1', label: 'Question' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'q1');

			expect(question?.['type/scale']).toBe('S'); // Default fallback
		});

		test('handles empty type as short text', () => {
			const survey = [
				{ type: '', name: 'q2', label: 'Empty type question' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'q2');

			// Empty types should be handled gracefully - they might not create questions
			expect(question).toBeUndefined();
		});
	});

	describe('system variables', () => {
		test('converts start as equation', () => {
			const survey = [
				{ type: 'start', name: 'start_time', label: 'Start time' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'starttime'); // Underscores removed

			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});

		test('converts end as equation', () => {
			const survey = [
				{ type: 'end', name: 'end_time', label: 'End time' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'endtime'); // Underscores removed

			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});

		test('converts today as equation', () => {
			const survey = [
				{ type: 'today', name: 'today_date', label: 'Today date' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'todaydate'); // Underscores removed

			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});

		test('converts deviceid as equation', () => {
			const survey = [
				{ type: 'deviceid', name: 'device_id', label: 'Device ID' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'deviceid'); // Underscores removed

			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});

		test('converts username as equation', () => {
			const survey = [
				{ type: 'username', name: 'user_name', label: 'Username' }
			];

			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'username'); // Underscores removed

			expect(question?.['type/scale']).toBe('*'); // Equation in LimeSurvey
		});
	});
});