import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from '../helpers';

describe('Datetime Question Type', () => {
	test('converts basic datetime question', () => {
		const survey = [
			{ type: 'datetime', name: 'appt', label: 'Appointment time' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'appt');

		expect(question).toBeDefined();
		expect(question?.class).toBe('Q');
		expect(question?.['type/scale']).toBe('D'); // Date in LimeSurvey
		expect(question?.text).toBe('Appointment time');
	});

	test('converts required datetime question', () => {
		const survey = [
			{ type: 'datetime', name: 'meeting', label: 'Meeting time', required: 'yes' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'meeting');

		expect(question?.mandatory).toBe('Y');
	});

	test('converts datetime question with default value', () => {
		const survey = [
			{ type: 'datetime', name: 'now', label: 'Current time', default: 'now()' }
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'now');

		expect(question?.default).toBe('now()');
	});

	test('converts datetime question with relevance', () => {
		const survey = [
			{ type: 'select_one yesno', name: 'hasevent', label: 'Do you have an event?' },
			{
				type: 'datetime',
				name: 'eventtime',
				label: 'Event time',
				relevant: "${has_event} = 'yes'"
			}
		];

		const choices = [
			{ list_name: 'yesno', name: 'yes', label: 'Yes' },
			{ list_name: 'yesno', name: 'no', label: 'No' }
		];

		const rows = convertAndParse(survey, choices);
		const question = findRowByName(rows, 'eventtime');

		expect(question?.relevance).toContain('hasevent'); // Underscores removed
	});

	test('converts datetime question with hint', () => {
		const survey = [
			{
				type: 'datetime',
				name: 'schedule',
				label: 'Schedule time',
				hint: 'Format: YYYY-MM-DD HH:MM'
			}
		];

		const rows = convertAndParse(survey);
		const question = findRowByName(rows, 'schedule');

		expect(question?.help).toBe('Format: YYYY-MM-DD HH:MM');
	});
});