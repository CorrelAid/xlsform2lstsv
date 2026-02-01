import { describe, test, expect } from 'vitest';
import { convertConstraint, convertRelevance, xpathToLimeSurvey } from '../../converters/xpathTranspiler';

describe('XPath Function Conversion', () => {

	describe('selected() function', () => {
		test('converts selected() with single quotes', async () => {
			const result = await xpathToLimeSurvey("selected(${gender}, 'female')");
			expect(result).toBe('(gender=="female")');
		});

		test('converts selected() with double quotes', async () => {
			const result = await xpathToLimeSurvey('selected(${gender}, "female")');
			expect(result).toBe('(gender=="female")');
		});

		test('converts selected() without spaces', async () => {
			const result = await xpathToLimeSurvey("selected(${consent},'yes')");
			expect(result).toBe('(consent=="yes")');
		});

		test('converts selected() with spaces', async () => {
			const result = await xpathToLimeSurvey("selected( ${consent} , 'yes' )");
			expect(result).toBe('(consent=="yes")');
		});
	});

	describe('regex() function', () => {
		test('converts regex() with field reference', async () => {
			const result = await xpathToLimeSurvey('regex(${name}, "^[A-Z][a-z]+$")');
			expect(result).toBe('regexMatch(name, "^[A-Z][a-z]+$")');
		});

		test('converts regex() with current field', async () => {
			const result = await xpathToLimeSurvey('regex(., "^[A-Z][a-z]+$")');
			expect(result).toBe('regexMatch(self, "^[A-Z][a-z]+$")');
		});
	});

	describe('count() function', () => {
		test('converts count() function', async () => {
			const result = await xpathToLimeSurvey('count(${items}) > 0');
			expect(result).toBe('count(items) > 0');
		});
	});

	describe('concat() function', () => {
		test('converts concat() function', async () => {
			const result = await xpathToLimeSurvey("concat(${first}, ' ', ${last})");
			expect(result).toBe('first + \' \' + last');
		});
	});

	describe('contains() function', () => {
		test('converts contains() function', async () => {
			const result = await xpathToLimeSurvey("contains(${text}, 'prohibited')");
			expect(result).toBe('contains(text, \'prohibited\')');
		});
	});

	describe('string functions', () => {
		test('converts string-length() function', async () => {
			const result = await xpathToLimeSurvey('string-length(${name}) > 5');
			expect(result).toBe('strlen(name) > 5');
		});

		test('converts substring() function', async () => {
			const result = await xpathToLimeSurvey('substring(${code}, 1, 3)');
			expect(result).toBe('substr(code, 1, 3)');
		});

		test('converts starts-with() function', async () => {
			const result = await xpathToLimeSurvey("starts-with(${name}, 'Dr')");
			expect(result).toBe('startsWith(name, \'Dr\')');
		});

		test('converts ends-with() function', async () => {
			const result = await xpathToLimeSurvey("ends-with(${name}, 'Jr')");
			expect(result).toBe('endsWith(name, \'Jr\')');
		});
	});

	describe('number functions', () => {


		test('converts floor() function', async () => {
			const result = await xpathToLimeSurvey('floor(${value})');
			expect(result).toBe('floor(value)');
		});

		test('converts ceiling() function', async () => {
			const result = await xpathToLimeSurvey('ceiling(${value})');
			expect(result).toBe('ceil(value)');
		});

		test('converts round() function', async () => {
			const result = await xpathToLimeSurvey('round(${value})');
			expect(result).toBe('round(value)');
		});

		test('converts sum() function', async () => {
			const result = await xpathToLimeSurvey('sum(${values})');
			expect(result).toBe('sum(values)');
		});
	});

	describe('math functions', () => {
		test('converts basic arithmetic', async () => {
			const result = await xpathToLimeSurvey('${a} + ${b} * ${c}');
			expect(result).toBe('a + b * c');
		});


	});

	describe('date functions', () => {
		test('converts today() function', async () => {
			const result = await xpathToLimeSurvey('${date} > today()');
			expect(result).toBe('date > today()');
		});

		test('converts now() function', async () => {
			const result = await xpathToLimeSurvey('${time} > now()');
			expect(result).toBe('time > now()');
		});
	});

	describe('logical functions', () => {
		test('converts not() function', async () => {
			const result = await xpathToLimeSurvey('not(${consent})');
			expect(result).toBe('!(consent)');
		});


	});

	describe('conditional functions', () => {
		test('converts if() function to ternary', async () => {
			const result = await xpathToLimeSurvey('if(${age} > 18, "adult", "minor")');
			expect(result).toBe('(age > 18 ? "adult" : "minor")');
		});
	});
});