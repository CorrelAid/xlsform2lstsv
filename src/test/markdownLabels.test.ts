import { describe, test, expect } from 'vitest';
import { markdownToHtml } from '../utils/markdownRenderer';
import { convertAndParse, findRowByName, findRowsByClass } from './helpers';

// ==============================================================
// Unit tests for the markdownToHtml utility
// ==============================================================

describe('markdownToHtml utility', () => {
	test('plain text passes through unchanged', () => {
		expect(markdownToHtml('Hello world')).toBe('Hello world');
	});

	test('bold converts to <strong>', () => {
		expect(markdownToHtml('**bold**')).toBe('<strong>bold</strong>');
	});

	test('italic converts to <em>', () => {
		expect(markdownToHtml('_italic_')).toBe('<em>italic</em>');
	});

	test('link converts to <a>', () => {
		expect(markdownToHtml('[Visit us](https://example.com)')).toBe(
			'<a href="https://example.com">Visit us</a>'
		);
	});

	test('inline code converts to <code>', () => {
		expect(markdownToHtml('use `npm install`')).toBe('use <code>npm install</code>');
	});

	test('single paragraph has <p> wrapper stripped', () => {
		const result = markdownToHtml('Just a sentence.');
		expect(result).toBe('Just a sentence.');
		expect(result).not.toContain('<p>');
	});

	test('multiple paragraphs keep <p> wrappers', () => {
		const result = markdownToHtml('Para one.\n\nPara two.');
		expect(result).toContain('<p>Para one.</p>');
		expect(result).toContain('<p>Para two.</p>');
	});

	test('empty string returns empty string', () => {
		expect(markdownToHtml('')).toBe('');
	});

	test('combined formatting in a label', () => {
		const result = markdownToHtml('Please provide your **full name** or [contact us](https://example.com)');
		expect(result).toContain('<strong>full name</strong>');
		expect(result).toContain('<a href="https://example.com">contact us</a>');
		expect(result).not.toContain('<p>');
	});
});

// ==============================================================
// Integration tests: markdown in converter pipeline
// ==============================================================

describe('Markdown label conversion in converter pipeline', () => {
	describe('question text (label field)', () => {
		test('bold in question label converts to <strong>', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'Enter your **full name**' }];
			const rows = await convertAndParse(survey);
			expect(findRowByName(rows, 'q1')?.text).toBe('Enter your <strong>full name</strong>');
		});

		test('link in question label converts to <a>', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'See [our site](https://example.com)' }];
			const rows = await convertAndParse(survey);
			expect(findRowByName(rows, 'q1')?.text).toContain('<a href="https://example.com">our site</a>');
		});

		test('plain text label is unchanged', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'What is your name?' }];
			const rows = await convertAndParse(survey);
			expect(findRowByName(rows, 'q1')?.text).toBe('What is your name?');
		});
	});

	describe('hint text (help field)', () => {
		test('bold in hint converts to <strong>', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'Q', hint: 'Use **full name**' }];
			const rows = await convertAndParse(survey);
			expect(findRowByName(rows, 'q1')?.help).toBe('Use <strong>full name</strong>');
		});

		test('link in hint converts to <a>', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'Q', hint: '[Help](https://example.com)' }];
			const rows = await convertAndParse(survey);
			expect(findRowByName(rows, 'q1')?.help).toContain('<a href="https://example.com">Help</a>');
		});

		test('multi-paragraph hint keeps <p> blocks', async () => {
			const survey = [{ type: 'text', name: 'q1', label: 'Q', hint: 'Step one.\n\nStep two.' }];
			const rows = await convertAndParse(survey);
			const help = findRowByName(rows, 'q1')?.help ?? '';
			expect(help).toContain('<p>Step one.</p>');
			expect(help).toContain('<p>Step two.</p>');
		});
	});

	describe('group labels', () => {
		test('bold in group label converts to <strong>', async () => {
			const survey = [
				{ type: 'begin_group', name: 'grp', label: '**Important** Section' },
				{ type: 'text', name: 'q1', label: 'Q' },
				{ type: 'end_group' },
			];
			const rows = await convertAndParse(survey);
			const grp = findRowsByClass(rows, 'G')[0];
			expect(grp?.name).toBe('<strong>Important</strong> Section');
		});
	});

	describe('answer / subquestion labels', () => {
		test('bold in select_one answer label converts to <strong>', async () => {
			const survey = [{ type: 'select_one yesno', name: 'q1', label: 'Q' }];
			const choices = [
				{ list_name: 'yesno', name: 'yes', label: '**Yes**' },
				{ list_name: 'yesno', name: 'no', label: 'No' },
			];
			const rows = await convertAndParse(survey, choices);
			const yesAnswer = rows.find(r => r.class === 'A' && r.name === 'yes');
			expect(yesAnswer?.text).toBe('<strong>Yes</strong>');
			expect(rows.find(r => r.class === 'A' && r.name === 'no')?.text).toBe('No');
		});

		test('bold in select_multiple subquestion label converts to <strong>', async () => {
			const survey = [{ type: 'select_multiple colors', name: 'q1', label: 'Q' }];
			const choices = [
				{ list_name: 'colors', name: 'red', label: '_Red_' },
				{ list_name: 'colors', name: 'blue', label: 'Blue' },
			];
			const rows = await convertAndParse(survey, choices);
			const redSQ = rows.find(r => r.class === 'SQ' && r.name === 'red');
			expect(redSQ?.text).toBe('<em>Red</em>');
		});
	});

	describe('welcome and end note labels', () => {
		test('markdown in welcome note converts to HTML in SL row', async () => {
			const survey = [
				{ type: 'note', name: 'welcome', label: '**Welcome!** Please [read this](https://example.com) first.' },
				{ type: 'text', name: 'q1', label: 'Q' },
			];
			const rows = await convertAndParse(survey, [], [{ form_title: 'T', default_language: 'en' }]);
			const welcomeRow = findRowsByClass(rows, 'SL').find(r => r.name === 'surveyls_welcometext');
			expect(welcomeRow?.text).toContain('<strong>Welcome!</strong>');
			expect(welcomeRow?.text).toContain('<a href="https://example.com">read this</a>');
		});

		test('multi-paragraph end note keeps HTML structure', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Q' },
				{ type: 'note', name: 'end', label: 'Thank you!\n\nYour response has been saved.' },
			];
			const rows = await convertAndParse(survey, [], [{ form_title: 'T', default_language: 'en' }]);
			const endRow = findRowsByClass(rows, 'SL').find(r => r.name === 'surveyls_endtext');
			expect(endRow?.text).toContain('<p>Thank you!</p>');
			expect(endRow?.text).toContain('<p>Your response has been saved.</p>');
		});
	});

	describe('multilingual labels', () => {
		test('markdown is converted per language', async () => {
			const survey = [
				{
					type: 'text',
					name: 'q1',
					label: { en: '**Name** please', de: 'Bitte **Name**' },
				},
			];
			const rows = await convertAndParse(survey, [], [{ form_title: 'T', default_language: 'en' }]);
			const enRow = rows.find(r => r.name === 'q1' && r.language === 'en');
			const deRow = rows.find(r => r.name === 'q1' && r.language === 'de');
			expect(enRow?.text).toBe('<strong>Name</strong> please');
			expect(deRow?.text).toBe('Bitte <strong>Name</strong>');
		});
	});
});
