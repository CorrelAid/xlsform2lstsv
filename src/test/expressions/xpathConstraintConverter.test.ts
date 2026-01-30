import { describe, test, expect } from 'vitest';
import { convertConstraint } from '../../converters/xpathTranspiler';

describe('XPath Constraint Conversion', () => {

	describe('basic constraint conversions', () => {
		test('converts empty constraint to empty string', () => {
			expect(convertConstraint('')).toBe('');
		});

		test('converts . to self in constraints', () => {
			const result = convertConstraint('. >= 18');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 18');
		});

		test('converts . to self throughout constraint', () => {
			const result = convertConstraint('. >= 1 and . <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 1 and self <= 100');
		});

		test('converts constraint with field references', () => {
			const result = convertConstraint('. > ${min_value}');
			// AST-based converter handles field references
			expect(result).toBe('self > minvalue');
		});

		test('handles regexMatch with logical condition as first argument', () => {
			// This test case addresses the issue where regexMatch is called with a logical condition
			// instead of a regex pattern as the first argument
			const result = convertConstraint('regexMatch("self >= 18 and self <= 120", age.NAOK)');
			// The converter treats the first argument as a logical expression
			expect(result).toBe('self >= 18 and self <= 120');
		});

		test('handles regexMatch with actual regex pattern', () => {
			// Test case with a proper regex pattern to ensure it's handled differently
			const result = convertConstraint('regexMatch("^[A-Z][a-z]+$", name)');
			// regex() is supported and mapped to regexMatch()
			expect(result).toBe(`regexMatch('^[A-Z][a-z]+$', name)`);
		});
	});

	describe('numeric range constraints', () => {
		test('converts constraint with range validation', () => {
			const result = convertConstraint('. >= 5 and . <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 5 and self <= 100');
		});

		test('converts constraint with min validation', () => {
			const result = convertConstraint('. >= 18');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 18');
		});

		test('converts constraint with max validation', () => {
			const result = convertConstraint('. <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self <= 100');
		});

		test('converts numeric range constraint', () => {
			const result = convertConstraint('. >= 18 and . <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 18 and self <= 100');
		});

		test('converts numeric range constraint with same digit count', () => {
			const result = convertConstraint('. >= 10 and . <= 99');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 10 and self <= 99');
		});

		test('converts numeric range constraint with different digit counts', () => {
			const result = convertConstraint('. >= 1 and . <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 1 and self <= 100');
		});
	});

	describe('min-only constraints', () => {
		test('converts constraint with minimum value', () => {
			const result = convertConstraint('. >= 18');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 18');
		});

		test('converts constraint with single digit minimum', () => {
			const result = convertConstraint('. >= 5');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 5');
		});

		test('converts constraint with three digit minimum', () => {
			const result = convertConstraint('. >= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self >= 100');
		});
	});

	describe('max-only constraints', () => {
		test('converts constraint with maximum value', () => {
			const result = convertConstraint('. <= 100');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self <= 100');
		});

		test('converts constraint with single digit maximum', () => {
			const result = convertConstraint('. <= 9');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self <= 9');
		});

		test('converts constraint with two digit maximum', () => {
			const result = convertConstraint('. <= 99');
			// AST-based converter returns LimeSurvey expressions
			expect(result).toBe('self <= 99');
		});
	});

	describe('regex pattern constraints', () => {
		test('returns empty for regex patterns (not valid XPath)', () => {
			const result = convertConstraint('^[A-Z][a-z]+$');
			// AST-based converter cannot parse regex patterns as XPath
			expect(result).toBe('');
		});

		test('returns empty for regex patterns with anchors', () => {
			const result = convertConstraint('^[0-9]{5}$');
			// AST-based converter cannot parse regex patterns as XPath
			expect(result).toBe('');
		});

		test('returns empty for regex patterns with character classes', () => {
			const result = convertConstraint('^[A-Za-z0-9]+$');
			// AST-based converter cannot parse regex patterns as XPath
			expect(result).toBe('');
		});

		test('returns empty for regex patterns with quantifiers', () => {
			const result = convertConstraint('^[A-Z][a-z]{2,10}$');
			// AST-based converter cannot parse regex patterns as XPath
			expect(result).toBe('');
		});
	});

	describe('regexMatch function extraction', () => {
		test('returns regexMatch for supported regex patterns', () => {
			const result = convertConstraint('regexMatch("^[A-Z][a-z]+$", .)');
			expect(result).toBe(`regexMatch('^[A-Z][a-z]+$', self)`);
		});

		test('returns regexMatch for complex regex patterns', () => {
			const result = convertConstraint('regexMatch("^[0-9]{5}$", .)');
			expect(result).toBe(`regexMatch('^[0-9]{5}$', self)`);
		});

		test('returns empty for regexMatch with different argument order', () => {
			const result = convertConstraint('regexMatch(., "^[A-Z][a-z]+$")');
			// AST-based converter doesn't support regexMatch function
			expect(result).toBe('');
		});
	});

	describe('unsupported constraint patterns', () => {
		test('returns empty for unsupported patterns', () => {
			const result = convertConstraint('${field} > 18');
			expect(result).toBe('field > 18'); // New transpiler converts field references
		});

		test('returns empty for complex expressions', () => {
			const result = convertConstraint('${age} > 18 and ${consent} = "yes"');
			expect(result).toBe('age > 18 and consent == "yes"'); // New transpiler converts complex expressions
		});

		test('returns empty for function calls', () => {
			const result = convertConstraint('count(${items}) > 0');
			expect(result).toBe('count(items) > 0'); // New transpiler converts function calls
		});
	});

	describe('edge cases', () => {
		test('handles constraint with today() function', () => {
			const result = convertConstraint('. > today()');
			// AST-based converter converts date functions to expressions
			expect(result).toBe('self > today()');
		});

		test('handles constraint with now() function', () => {
			const result = convertConstraint('. > now()');
			// AST-based converter converts date functions to expressions
			expect(result).toBe('self > now()');
		});

		test('handles constraint with string comparison', () => {
			const result = convertConstraint('. = "yes"');
			// AST-based converter converts string comparisons
			expect(result).toBe('self == "yes"');
		});

		test('handles constraint with boolean logic', () => {
			const result = convertConstraint('. > 18 and . < 100');
			// AST-based converter converts boolean logic
			expect(result).toBe('self > 18 and self < 100');
		});
	});


});
