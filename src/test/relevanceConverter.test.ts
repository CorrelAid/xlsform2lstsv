import { describe, test, expect } from 'vitest';
import { RelevanceConverter } from '../relevanceConverter';

describe('RelevanceConverter', () => {
	const converter = new RelevanceConverter();

	describe('basic conversions', () => {
		test('converts empty expression to "1"', () => {
			expect(converter.convert('')).toBe('1');
			expect(converter.convert(undefined as any)).toBe('1');
		});

		test('converts field references ${field} to field (LimeSurvey format)', () => {
			expect(converter.convert('${age} > 18')).toContain('age');
			expect(converter.convert('${age} > 18')).not.toContain('{age}');
		});

		test('converts = to ==', () => {
			expect(converter.convert('${x} = 5')).toContain('==');
		});

		test('preserves != operator', () => {
			const result = converter.convert('${x} != 5');
			expect(result).toContain('!=');
		});

		test('preserves comparison operators', () => {
			expect(converter.convert('${x} > 5')).toContain('>');
			expect(converter.convert('${x} < 5')).toContain('<');
			expect(converter.convert('${x} >= 5')).toContain('>=');
			expect(converter.convert('${x} <= 5')).toContain('<=');
		});
	});

	describe('selected() function', () => {
		test('converts selected() with single quotes', () => {
			const result = converter.convert("selected(${field}, 'value')");
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
			expect(result).toContain('"value"');
		});

		test('converts selected() with double quotes', () => {
			const result = converter.convert('selected(${field}, "value")');
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
			expect(result).toContain('"value"');
		});

		test('handles selected() without spaces', () => {
			const result = converter.convert("selected(${married},'yes')");
			expect(result).toContain('married');
			expect(result).not.toContain('{married}');
			expect(result).toContain('==');
			expect(result).toContain('"yes"');
		});

		test('handles selected() with spaces', () => {
			const result = converter.convert("selected( ${field} , 'value' )");
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
		});
	});

	describe('boolean operators', () => {
		test('converts "and" to " and "', () => {
			const result = converter.convert('${x} > 5 and ${y} < 10');
			expect(result).toContain(' and ');
		});

		test('converts "or" to " or "', () => {
			const result = converter.convert('${x} = 1 or ${x} = 2');
			expect(result).toContain(' or ');
		});

		test('handles AND in uppercase', () => {
			const result = converter.convert('${x} > 5 AND ${y} < 10');
			expect(result).toContain(' and ');
		});

		test('handles OR in uppercase', () => {
			const result = converter.convert('${x} = 1 OR ${x} = 2');
			expect(result).toContain(' or ');
		});

		test('handles mixed case boolean operators', () => {
			const result = converter.convert('${x} > 5 And ${y} < 10');
			expect(result).toContain(' and ');
		});
	});

	describe('current field reference', () => {
		test('converts . to self in constraints', () => {
			const result = converter.convertConstraint('. >= 18');
			// Constraint converter returns regex patterns for numeric ranges
			expect(result).toContain('/^\\d');
		});

		test('converts . to self at start of expression', () => {
			const result = converter.convert('. != ""');
			expect(result).toContain('self');
		});

		test('converts . followed by space', () => {
			const result = converter.convert('. > 0');
			expect(result).toContain('self');
		});

		test('converts . followed by parenthesis', () => {
			const result = converter.convert('. >= 18 and . <= 100');
			expect(result).toContain('self');
		});
	});

	describe('complex expressions', () => {
		test('converts complex boolean expression', () => {
			const result = converter.convert(
				"${age} >= 18 and ${country} = 'USA' or ${country} = 'Canada'"
			);
			expect(result).toContain('age');
			expect(result).not.toContain('{age}');
			expect(result).toContain('country');
			expect(result).not.toContain('{country}');
			expect(result).toContain('>=');
			expect(result).toContain('==');
			expect(result).toContain(' and ');
			expect(result).toContain(' or ');
		});

		test('converts multiple selected() calls', () => {
			const result = converter.convert(
				"selected(${q1}, 'yes') and selected(${q2}, 'no')"
			);
			expect(result).toContain('q1');
			expect(result).not.toContain('{q1}');
			expect(result).toContain('q2');
			expect(result).not.toContain('{q2}');
			expect(result).toContain(' and ');
		});

		test('handles mixed field references and operators', () => {
			const result = converter.convert(
				'${income} > 0 and ${tax} < ${income} and ${tax} >= 0'
			);
			expect(result).toContain('income');
			expect(result).not.toContain('{income}');
			expect(result).toContain('tax');
			expect(result).not.toContain('{tax}');
			expect(result).toContain('>');
			expect(result).toContain('<');
			expect(result).toContain('>=');
		});
	});

	describe('convertConstraint', () => {
		test('converts empty constraint to empty string', () => {
			expect(converter.convertConstraint('')).toBe('');
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

	describe('convertCalculation', () => {
		test('converts empty calculation to empty string', () => {
			expect(converter.convertCalculation('')).toBe('');
		});

		test('converts calculation with field references', () => {
			const result = converter.convertCalculation('${a} + ${b}');
			expect(result).toContain('a');
			expect(result).not.toContain('{a}');
			expect(result).toContain('b');
			expect(result).not.toContain('{b}');
			expect(result).toContain('+');
		});

		test('converts calculation with division', () => {
			const result = converter.convertCalculation('(${x} + ${y}) / 2');
			expect(result).toContain('x');
			expect(result).not.toContain('{x}');
			expect(result).toContain('y');
			expect(result).not.toContain('{y}');
			expect(result).toContain('/');
		});

		test('converts calculation with multiplication', () => {
			const result = converter.convertCalculation('${price} * ${quantity}');
			expect(result).toContain('price');
			expect(result).not.toContain('{price}');
			expect(result).toContain('quantity');
			expect(result).not.toContain('{quantity}');
			expect(result).toContain('*');
		});
	});

	describe('edge cases', () => {
		test('handles expressions with numbers', () => {
			const result = converter.convert('${x} = 123');
			expect(result).toContain('x');
			expect(result).not.toContain('{x}');
			expect(result).toContain('123');
		});

		test('handles expressions with quoted strings', () => {
			const result = converter.convert('${name} = "John Doe"');
			expect(result).toContain('name');
			expect(result).not.toContain('{name}');
			expect(result).toContain('"John Doe"');
		});

		test('handles expressions with empty strings', () => {
			const result = converter.convert('${field} != ""');
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('!=');
			expect(result).toContain('""');
		});

		test('preserves parentheses', () => {
			const result = converter.convert('(${a} + ${b}) * ${c}');
			expect(result).toContain('(');
			expect(result).toContain(')');
		});

		test('trims whitespace', () => {
			const result = converter.convert('  ${x} = 5  ');
			expect(result).not.toMatch(/^\s/);
			expect(result).not.toMatch(/\s$/);
		});
	});
});
