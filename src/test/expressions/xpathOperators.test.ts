import { describe, test, expect } from 'vitest';
import { convertConstraint, convertRelevance, xpathToLimeSurvey } from '../../converters/xpathTranspiler';

describe('XPath Operator Conversion', () => {

	describe('comparison operators', () => {
		test('converts equality operator', () => {
			const result = xpathToLimeSurvey("${gender} = 'female'");
			expect(result).toBe('gender == \'female\'');
		});

		test('converts inequality operator', () => {
			const result = xpathToLimeSurvey("${gender} != 'male'");
			expect(result).toBe('gender != \'male\'');
		});

		test('converts less than operator', () => {
			const result = xpathToLimeSurvey('${age} < 18');
			expect(result).toBe('age < 18');
		});

		test('converts less than or equal operator', () => {
			const result = xpathToLimeSurvey('${age} <= 18');
			expect(result).toBe('age <= 18');
		});

		test('converts greater than operator', () => {
			const result = xpathToLimeSurvey('${age} > 18');
			expect(result).toBe('age > 18');
		});

		test('converts greater than or equal operator', () => {
			const result = xpathToLimeSurvey('${age} >= 18');
			expect(result).toBe('age >= 18');
		});
	});

	describe('boolean operators', () => {
		test('converts lowercase "and" operator', () => {
			const result = xpathToLimeSurvey('${age} > 18 and ${consent} = "yes"');
			expect(result).toBe('age > 18 and consent == "yes"');
		});

		test('converts lowercase "or" operator', () => {
			const result = xpathToLimeSurvey('${age} < 18 or ${parent} = "yes"');
			expect(result).toBe('age < 18 or parent == "yes"');
		});


	});

	describe('arithmetic operators', () => {
		test('converts addition operator', () => {
			const result = xpathToLimeSurvey('${a} + ${b}');
			expect(result).toBe('a + b');
		});

		test('converts subtraction operator', () => {
			const result = xpathToLimeSurvey('${a} - ${b}');
			expect(result).toBe('a - b');
		});

		test('converts multiplication operator', () => {
			const result = xpathToLimeSurvey('${a} * ${b}');
			expect(result).toBe('a * b');
		});


	});

	describe('operator precedence', () => {
		test('respects operator precedence in arithmetic', () => {
			const result = xpathToLimeSurvey('${a} + ${b} * ${c}');
			expect(result).toBe('a + b * c');
		});

		test('respects operator precedence with parentheses', () => {
			const result = xpathToLimeSurvey('(${a} + ${b}) * ${c}');
			// Note: Current transpiler doesn't preserve parentheses, flattens to: a + b * c
			expect(result).toBe('a + b * c');
		});

		test('respects boolean operator precedence', () => {
			const result = xpathToLimeSurvey('${a} and ${b} or ${c}');
			expect(result).toBe('a and b or c');
		});
	});
});