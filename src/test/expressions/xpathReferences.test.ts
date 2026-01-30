import { describe, test, expect } from 'vitest';
import { convertConstraint, convertRelevance, xpathToLimeSurvey } from '../../converters/xpathTranspiler';

describe('XPath Reference Conversion', () => {

	describe('field references', () => {
		test('converts basic field reference', () => {
			const result = xpathToLimeSurvey('${age} > 18');
			expect(result).toBe('age > 18');
		});

		test('converts multiple field references', () => {
			const result = xpathToLimeSurvey('${age} > ${min_age}');
			expect(result).toBe('age > minage');
		});

		test('converts field reference with underscores', () => {
			const result = xpathToLimeSurvey('${first_name} = "John"');
			expect(result).toBe('firstname == "John"');
		});

		test('converts field reference in function', () => {
			const result = xpathToLimeSurvey('count(${items}) > 0');
			expect(result).toBe('count(items) > 0');
		});
	});

	describe('current field references', () => {
		test('converts current field reference at start', () => {
			const result = xpathToLimeSurvey('. > 18');
			expect(result).toBe('self > 18');
		});

		test('converts current field reference followed by space', () => {
			const result = xpathToLimeSurvey('. >= 18');
			expect(result).toBe('self >= 18');
		});

		test('converts current field reference in comparison', () => {
			const result = xpathToLimeSurvey('. = "yes"');
			expect(result).toBe('self == "yes"');
		});

		test('converts current field reference in function', () => {
			const result = xpathToLimeSurvey('string-length(.) > 5');
			expect(result).toBe('strlen(self) > 5');
		});

		test('converts multiple current field references', () => {
			const result = xpathToLimeSurvey('. > 18 and . < 100');
			expect(result).toBe('self > 18 and self < 100');
		});
	});

	describe('literal values', () => {
		test('converts string literals', () => {
			const result = xpathToLimeSurvey("${gender} = 'female'");
			expect(result).toBe('gender == \'female\'');
		});

		test('converts numeric literals', () => {
			const result = xpathToLimeSurvey('${age} > 18');
			expect(result).toBe('age > 18');
		});



		test('converts mixed literals', () => {
			const result = xpathToLimeSurvey("${status} = 'active' and ${count} > 0");
			expect(result).toBe('status == \'active\' and count > 0');
		});
	});

	describe('complex expressions with references', () => {
		test('converts complex expression with field references', () => {
			const result = xpathToLimeSurvey('${age} > 18 and ${consent} = "yes" and ${parent} = "no"');
			expect(result).toBe('age > 18 and consent == "yes" and parent == "no"');
		});

		test('converts expression with mixed references', () => {
			const result = xpathToLimeSurvey('${age} > 18 and . = "yes"');
			expect(result).toBe('age > 18 and self == "yes"');
		});

		test('converts expression with functions and references', () => {
			const result = xpathToLimeSurvey('count(${items}) > 0 and ${status} = "active"');
			expect(result).toBe('count(items) > 0 and status == "active"');
		});
	});

	describe('edge cases in references', () => {
		test('handles field names that are XPath keywords', () => {
			const result = xpathToLimeSurvey('${and} > 0');
			expect(result).toBe('and > 0');
		});

		test('handles field names with numbers', () => {
			const result = xpathToLimeSurvey('${field123} = "value"');
			expect(result).toBe('field123 == "value"');
		});


	});
});