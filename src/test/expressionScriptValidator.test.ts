import { describe, test, expect } from 'vitest';
import { ExpressionScriptValidator } from '../utils/expressionScriptValidator';

describe('ExpressionScriptValidator', () => {
	const validator = new ExpressionScriptValidator();

	describe('basic validation', () => {
		test('validates empty expression as valid', () => {
			expect(validator.isValid('')).toBe(true);
			expect(validator.validate('')).toEqual([]);
		});

		test('validates simple valid expression', () => {
			expect(validator.isValid('age > 18')).toBe(true);
			expect(validator.validate('age > 18')).toEqual([]);
		});

		test('detects unbalanced parentheses', () => {
			const errors = validator.validate('(age > 18');
			expect(errors).toContain('Unbalanced parentheses');
			expect(validator.isValid('(age > 18')).toBe(false);
		});

		test('detects unbalanced single quotes', () => {
			const errors = validator.validate("age == 'test");
			expect(errors).toContain('Unbalanced single quotes');
			expect(validator.isValid("age == 'test")).toBe(false);
		});

		test('detects unbalanced double quotes', () => {
			const errors = validator.validate('age == "test');
			expect(errors).toContain('Unbalanced double quotes');
			expect(validator.isValid('age == "test')).toBe(false);
		});

		test('detects unbalanced brackets', () => {
			const errors = validator.validate('array[0');
			expect(errors).toContain('Unbalanced brackets');
			expect(validator.isValid('array[0')).toBe(false);
		});
	});

	describe('function validation', () => {
		test('accepts supported functions', () => {
			expect(validator.isValid('len(name) > 0')).toBe(true);
			expect(validator.isValid('substr(text, 1, 5)')).toBe(true);
			expect(validator.isValid('today()')).toBe(true);
		});

		test('rejects unsupported functions', () => {
			const errors = validator.validate('unsupportedFunction(x)');
			expect(errors).toContain('Unsupported function: unsupportedFunction');
			expect(validator.isValid('unsupportedFunction(x)')).toBe(false);
		});

		test('accepts common math functions', () => {
			expect(validator.isValid('floor(value)')).toBe(true);
			expect(validator.isValid('round(price)')).toBe(true);
			expect(validator.isValid('sum(items)')).toBe(true);
		});

		test('accepts string functions', () => {
			expect(validator.isValid('startsWith(text, "prefix")')).toBe(true);
			expect(validator.isValid('endsWith(text, "suffix")')).toBe(true);
			expect(validator.isValid('concat(first, " ", last)')).toBe(true);
		});
	});

	describe('operator validation', () => {
		test('accepts comparison operators', () => {
			expect(validator.isValid('x == y')).toBe(true);
			expect(validator.isValid('x != y')).toBe(true);
			expect(validator.isValid('x < y')).toBe(true);
			expect(validator.isValid('x > y')).toBe(true);
			expect(validator.isValid('x <= y')).toBe(true);
			expect(validator.isValid('x >= y')).toBe(true);
		});

		test('accepts logical operators', () => {
			expect(validator.isValid('x && y')).toBe(true);
			expect(validator.isValid('x || y')).toBe(true);
			expect(validator.isValid('!x')).toBe(true);
		});

		test('accepts arithmetic operators', () => {
			expect(validator.isValid('x + y')).toBe(true);
			expect(validator.isValid('x - y')).toBe(true);
			expect(validator.isValid('x * y')).toBe(true);
			expect(validator.isValid('x / y')).toBe(true);
			expect(validator.isValid('x % y')).toBe(true);
		});
	});

	describe('variable name validation', () => {
		test('accepts valid variable names', () => {
			expect(validator.isValid('age > 18')).toBe(true);
			expect(validator.isValid('user_name == "John"')).toBe(true);
			expect(validator.isValid('_private_var')).toBe(true);
		});

		test('rejects invalid variable names', () => {
			const errors = validator.validate('123invalid = 5');
			expect(errors).toContain('Invalid variable name: 123invalid');
		});
	});

	describe('complex expressions', () => {
		test('validates complex boolean expressions', () => {
			expect(validator.isValid('(age >= 18 && country == "USA") || (age >= 21 && country == "Canada")')).toBe(true);
		});

		test('validates expressions with functions and operators', () => {
			expect(validator.isValid('len(trim(name)) > 0 && startsWith(name, "A")')).toBe(true);
		});

		test('validates nested function calls', () => {
			expect(validator.isValid('substr(concat(first, " ", last), 1, 10)')).toBe(true);
		});

		test('detects errors in complex expressions', () => {
			const errors = validator.validate('(age > 18 && unsupportedFunc(x)');
			expect(errors).toContain('Unbalanced parentheses');
			expect(errors).toContain('Unsupported function: unsupportedFunc');
		});
	});

	describe('supported functions list', () => {
		test('returns list of supported functions', () => {
			const functions = validator.getSupportedFunctions();
			expect(functions).toContain('len');
			expect(functions).toContain('substr');
			expect(functions).toContain('today');
			expect(functions).toContain('if');
		});

		test('returns list of supported operators', () => {
			const operators = validator.getSupportedOperators();
			expect(operators).toContain('==');
			expect(operators).toContain('&&');
			expect(operators).toContain('+');
		});

		test('returns list of reserved keywords', () => {
			const keywords = validator.getReservedKeywords();
			expect(keywords).toContain('self');
			expect(keywords).toContain('true');
			expect(keywords).toContain('false');
		});
	});

	describe('real-world validation', () => {
		test('validates converted XPath expressions', () => {
			// These are examples of what our XPath converter would produce
			expect(validator.isValid('consent == "yes" and age >= 18')).toBe(true);
			expect(validator.isValid('self != ""')).toBe(true);
			expect(validator.isValid('len(name) > 0')).toBe(true);
		});

		test('detects issues in converted expressions', () => {
			const errors = validator.validate('age > 18 and unsupportedFunction(x)');
			expect(errors.length).toBeGreaterThan(0);
		});

		test('validates constraint patterns', () => {
			expect(validator.isValid('/^\\d{2,3}$/')).toBe(true);
			expect(validator.isValid('/^[A-Z].*$/')).toBe(true);
		});
	});
});