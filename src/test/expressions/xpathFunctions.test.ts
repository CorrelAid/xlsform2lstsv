import { describe, test, expect } from 'vitest';
import { convertConstraint, convertRelevance, xpathToLimeSurvey } from '../../converters/xpathTranspiler';

describe('XPath Function Conversion', () => {

	describe('selected() function', () => {
		test('converts selected() with single quotes', () => {
			const result = xpathToLimeSurvey("selected(${gender}, 'female')");
			expect(result).toBe('(gender=="female")');
		});

		test('converts selected() with double quotes', () => {
			const result = xpathToLimeSurvey('selected(${gender}, "female")');
			expect(result).toBe('(gender=="female")');
		});

		test('converts selected() without spaces', () => {
			const result = xpathToLimeSurvey("selected(${consent},'yes')");
			expect(result).toBe('(consent=="yes")');
		});

		test('converts selected() with spaces', () => {
			const result = xpathToLimeSurvey("selected( ${consent} , 'yes' )");
			expect(result).toBe('(consent=="yes")');
		});
	});

	describe('regex() function', () => {
		test('converts regex() with field reference', () => {
			const result = xpathToLimeSurvey('regex(${name}, "^[A-Z][a-z]+$")');
			expect(result).toBe('regexMatch(name, "^[A-Z][a-z]+$")');
		});

		test('converts regex() with current field', () => {
			const result = xpathToLimeSurvey('regex(., "^[A-Z][a-z]+$")');
			expect(result).toBe('regexMatch(self, "^[A-Z][a-z]+$")');
		});
	});

	describe('count() function', () => {
		test('converts count() function', () => {
			const result = xpathToLimeSurvey('count(${items}) > 0');
			expect(result).toBe('count(items) > 0');
		});
	});

	describe('concat() function', () => {
		test('converts concat() function', () => {
			const result = xpathToLimeSurvey("concat(${first}, ' ', ${last})");
			expect(result).toBe('first + \' \' + last');
		});
	});

	describe('contains() function', () => {
		test('converts contains() function', () => {
			const result = xpathToLimeSurvey("contains(${text}, 'prohibited')");
			expect(result).toBe('contains(text, \'prohibited\')');
		});
	});

	describe('string functions', () => {
		test('converts string-length() function', () => {
			const result = xpathToLimeSurvey('string-length(${name}) > 5');
			expect(result).toBe('strlen(name) > 5');
		});

		test('converts substring() function', () => {
			const result = xpathToLimeSurvey('substring(${code}, 1, 3)');
			expect(result).toBe('substr(code, 1, 3)');
		});

		test('converts starts-with() function', () => {
			const result = xpathToLimeSurvey("starts-with(${name}, 'Dr')");
			expect(result).toBe('startsWith(name, \'Dr\')');
		});

		test('converts ends-with() function', () => {
			const result = xpathToLimeSurvey("ends-with(${name}, 'Jr')");
			expect(result).toBe('endsWith(name, \'Jr\')');
		});
	});

	describe('number functions', () => {


		test('converts floor() function', () => {
			const result = xpathToLimeSurvey('floor(${value})');
			expect(result).toBe('floor(value)');
		});

		test('converts ceiling() function', () => {
			const result = xpathToLimeSurvey('ceiling(${value})');
			expect(result).toBe('ceil(value)');
		});

		test('converts round() function', () => {
			const result = xpathToLimeSurvey('round(${value})');
			expect(result).toBe('round(value)');
		});

		test('converts sum() function', () => {
			const result = xpathToLimeSurvey('sum(${values})');
			expect(result).toBe('sum(values)');
		});
	});

	describe('math functions', () => {
		test('converts basic arithmetic', () => {
			const result = xpathToLimeSurvey('${a} + ${b} * ${c}');
			expect(result).toBe('a + b * c');
		});


	});

	describe('date functions', () => {
		test('converts today() function', () => {
			const result = xpathToLimeSurvey('${date} > today()');
			expect(result).toBe('date > today()');
		});

		test('converts now() function', () => {
			const result = xpathToLimeSurvey('${time} > now()');
			expect(result).toBe('time > now()');
		});
	});

	describe('logical functions', () => {
		test('converts not() function', () => {
			const result = xpathToLimeSurvey('not(${consent})');
			expect(result).toBe('!(consent)');
		});


	});

	describe('conditional functions', () => {
		test('converts if() function to ternary', () => {
			const result = xpathToLimeSurvey('if(${age} > 18, "adult", "minor")');
			expect(result).toBe('(age > 18 ? "adult" : "minor")');
		});
	});
});