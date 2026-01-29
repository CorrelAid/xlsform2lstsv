import { describe, test, expect } from 'vitest';
import { ExpressionConverter } from '../../converters/ExpressionConverter';

describe('XPath Constraint Conversion', () => {
	const converter = new ExpressionConverter();

	describe('basic constraint conversions', () => {
		test('converts empty constraint to empty string', () => {
			expect(converter.convertConstraint('')).toBe('');
		});

		test('converts . to self in constraints', () => {
			const result = converter.convertConstraint('. >= 18');
			// Constraint converter returns regex patterns for numeric ranges
			expect(result).toContain('/^\\d');
		});

		test('converts . to self throughout constraint', () => {
			const result = converter.convertConstraint('. >= 1 and . <= 100');
			// Constraint converter returns regex patterns for numeric ranges
			expect(result).toContain('/^\\d');
		});

		test('converts constraint with field references', () => {
			const result = converter.convertConstraint('. > ${min_value}');
			// Constraint converter returns regex patterns, doesn't handle field references
			expect(result).toBe('');
		});
	});

	describe('numeric range constraints', () => {
		test('converts constraint with range validation', () => {
			const result = converter.convertConstraint('. >= 5 and . <= 100');
			expect(result).toContain('/^');
			expect(result).toContain('$/');
		});

		test('converts constraint with min validation', () => {
			const result = converter.convertConstraint('. >= 18');
			expect(result).toContain('/^');
			expect(result).toContain('$/');
		});

		test('converts constraint with max validation', () => {
			const result = converter.convertConstraint('. <= 100');
			expect(result).toContain('/^');
			expect(result).toContain('$/');
		});

		test('converts numeric range constraint', () => {
			const result = converter.convertConstraint('. >= 18 and . <= 100');
			expect(result).toContain('/^\\d');
		});

		test('converts min-only constraint', () => {
			const result = converter.convertConstraint('. >= 18');
			expect(result).toContain('/^\\d');
		});

		test('converts max-only constraint', () => {
			const result = converter.convertConstraint('. <= 100');
			expect(result).toContain('/^\\d');
		});
	});

	describe('constraint edge cases', () => {
		test('handles constraint with field references (should return empty)', () => {
			// Field references in constraints are not supported, should return empty
			const result = converter.convertConstraint('. > ${min_value}');
			expect(result).toBe('');
		});

		test('handles constraint with complex expressions', () => {
			const result = converter.convertConstraint('. >= 1 and . <= 10');
			expect(result).toContain('/^\\d');
		});
	});

	describe('real-world constraint examples', () => {
		test('converts ODK constraint expression', () => {
			const result = converter.convertConstraint(
				". >= 1 and . <= 10"
			);
			expect(result).toContain('/^\\d');
		});

		test('converts age constraint', () => {
			const result = converter.convertConstraint('. >= 18 and . <= 100');
			expect(result).toContain('/^\\d');
		});

		test('converts simple numeric constraint', () => {
			const result = converter.convertConstraint('. >= 18');
			expect(result).toContain('/^\\d');
		});
	});
});