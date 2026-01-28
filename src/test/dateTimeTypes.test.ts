import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from './helpers';

describe('Date and Time Question Types', () => {
	test('converts date question', () => {
		const survey = [
			{ type: 'date', name: 'birthdate', label: 'Date of birth' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'birthdate');

		expect(question).toBeDefined();
		expect(question?.class).toBe('Q');
		expect(question?.['type/scale']).toBe('D'); // Date in LimeSurvey
		expect(question?.text).toBe('Date of birth');
	});

	test('converts datetime question', () => {
		const survey = [
			{ type: 'datetime', name: 'appointment', label: 'Appointment time' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'appointment');

		expect(question?.['type/scale']).toBe('D');
	});

	test('converts time question', () => {
		const survey = [
			{ type: 'time', name: 'meeting_time', label: 'Meeting time' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'meetingtime'); // Underscores are removed by sanitization

		// LimeSurvey doesn't have time-only, maps to date
		expect(question?.['type/scale']).toBe('D');
	});

	test('converts required date question', () => {
		const survey = [
			{ type: 'date', name: 'start_date', label: 'Start date', required: 'yes' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'startdate'); // Underscores removed

		expect(question?.mandatory).toBe('Y');
	});

	test('converts date question with constraint', () => {
		const survey = [
			{
				type: 'date',
				name: 'future_date',
				label: 'Future date',
				constraint: '. > today()'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'futuredate'); // Underscores removed

		// Constraint converter returns empty for non-numeric constraints
		expect(question?.validation).toBe('');
	});

	test('converts date question with default value', () => {
		const survey = [
			{ type: 'date', name: 'default_date', label: 'Date', default: 'today()' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'defaultdate'); // Underscores removed

		expect(question?.default).toBe('today()');
	});

	test('converts date question with relevance', () => {
		const survey = [
			{ type: 'select_one yesno', name: 'has_date', label: 'Do you have a date?' },
			{
				type: 'date',
				name: 'the_date',
				label: 'Enter date',
				relevant: "${has_date} = 'yes'"
			}
		];

		const choices = [
			{ list_name: 'yesno', name: 'yes', label: 'Yes' },
			{ list_name: 'yesno', name: 'no', label: 'No' }
		];

		const rows = convertAndParse(survey, choices);
		const question = findRowByName(rows, 'thedate'); // Underscores removed

		expect(question?.relevance).toContain('hasdate'); // Underscores removed
	});

	test('converts date question with hint', () => {
		const survey = [
			{
				type: 'date',
				name: 'event_date',
				label: 'Event date',
				hint: 'Format: YYYY-MM-DD'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'eventdate'); // Underscores removed

		expect(question?.help).toBe('Format: YYYY-MM-DD');
	});
});
