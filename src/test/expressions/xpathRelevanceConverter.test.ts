import { describe, test, expect } from 'vitest';
import { convertRelevance } from '../../converters/xpathTranspiler';

describe('XPath Relevance Conversion', () => {

	describe('basic relevance conversions', () => {
		test('converts empty expression to "1"', () => {
			expect(convertRelevance('')).toBe('1');
			expect(convertRelevance(undefined as any)).toBe('1');
		});

		test('converts field references ${field} to field (LimeSurvey format)', () => {
			expect(convertRelevance('${age} > 18')).toBe('age > 18');
		});

		test('converts = to ==', () => {
			expect(convertRelevance('${x} = 5')).toContain('==');
		});

		test('preserves != operator', () => {
			const result = convertRelevance('${x} != 5');
			expect(result).toContain('!=');
		});

		test('preserves comparison operators', () => {
			expect(convertRelevance('${x} > 5')).toContain('>');
			expect(convertRelevance('${x} < 5')).toContain('<');
			expect(convertRelevance('${x} >= 5')).toContain('>=');
			expect(convertRelevance('${x} <= 5')).toContain('<=');
		});
	});

	describe('selected() function in relevance', () => {
		test('converts selected() with single quotes', () => {
			const result = convertRelevance("selected(${field}, 'value')");
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
			expect(result).toContain('"value"');
		});

		test('converts selected() with double quotes', () => {
			const result = convertRelevance('selected(${field}, "value")');
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
			expect(result).toContain('"value"');
		});

		test('handles selected() without spaces', () => {
			const result = convertRelevance("selected(${married},'yes')");
			expect(result).toContain('married');
			expect(result).not.toContain('{married}');
			expect(result).toContain('==');
			expect(result).toContain('"yes"');
		});

		test('handles selected() with spaces', () => {
			const result = convertRelevance("selected( ${field} , 'value' )");
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('==');
		});
	});

	describe('boolean operators in relevance', () => {
		test('converts "and" to " and "', () => {
			const result = convertRelevance('${x} > 5 and ${y} < 10');
			expect(result).toContain(' and ');
		});

		test('converts "or" to " or "', () => {
			const result = convertRelevance('${x} = 1 or ${x} = 2');
			expect(result).toContain(' or ');
		});

		test('handles AND in uppercase', () => {
			const result = convertRelevance('${x} > 5 AND ${y} < 10');
			expect(result).toContain(' and ');
		});

		test('handles OR in uppercase', () => {
			const result = convertRelevance('${x} = 1 OR ${x} = 2');
			expect(result).toContain(' or ');
		});

		test('handles mixed case boolean operators', () => {
			const result = convertRelevance('${x} > 5 And ${y} < 10');
			expect(result).toContain(' and ');
		});
	});

	describe('current field reference in relevance', () => {
		test('converts . to self at start of expression', () => {
			const result = convertRelevance('. != ""');
			expect(result).toContain('self');
		});

		test('converts . followed by space', () => {
			const result = convertRelevance('. > 0');
			expect(result).toContain('self');
		});

		test('converts . followed by parenthesis', () => {
			const result = convertRelevance('. >= 18 and . <= 100');
			expect(result).toContain('self');
		});
	});

	describe('complex relevance expressions', () => {
		test('converts complex boolean expression', () => {
			const result = convertRelevance(
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
			const result = convertRelevance(
				"selected(${q1}, 'yes') and selected(${q2}, 'no')"
			);
			expect(result).toContain('q1');
			expect(result).not.toContain('{q1}');
			expect(result).toContain('q2');
			expect(result).not.toContain('{q2}');
			expect(result).toContain(' and ');
		});

		test('handles mixed field references and operators', () => {
			const result = convertRelevance(
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

	describe('edge cases in relevance expressions', () => {
		test('converts nested if() expressions', () => {
			const result = convertRelevance(
				"if(${age} < 18, 'minor', if(${age} < 65, 'adult', 'senior'))"
			);
			expect(result).toContain('?');
			expect(result).toContain(':');
			expect(result).toContain('age');
			expect(result).not.toContain('{age}');
		});

		test('converts complex nested boolean logic', () => {
			const result = convertRelevance(
				"(${consent} = 'yes' and ${age} >= 18) or (${country} = 'USA' and ${gender} = 'male')"
			);
			expect(result).toContain('consent');
			expect(result).toContain('age');
			expect(result).toContain('country');
			expect(result).toContain('gender');
			expect(result).toContain(' and ');
			expect(result).toContain(' or ');
		});

		test('handles multiple parentheses levels', () => {
			const result = convertRelevance(
				"(((${field1} != '') and (${field2} != '')) or (${field3} = 'test'))"
			);
			expect(result).toContain('field1');
			expect(result).toContain('field2');
			expect(result).toContain('field3');
		});
	});

	describe('edge cases', () => {
		test('handles expressions with numbers', () => {
			const result = convertRelevance('${x} = 123');
			expect(result).toContain('x');
			expect(result).not.toContain('{x}');
			expect(result).toContain('123');
		});

		test('handles expressions with quoted strings', () => {
			const result = convertRelevance('${name} = "John Doe"');
			expect(result).toContain('name');
			expect(result).not.toContain('{name}');
			expect(result).toContain('"John Doe"');
		});

		test('handles expressions with empty strings', () => {
			const result = convertRelevance('${field} != ""');
			expect(result).toContain('field');
			expect(result).not.toContain('{field}');
			expect(result).toContain('!=');
			expect(result).toContain('""');
		});

		test('preserves parentheses in function calls', () => {
			const result = convertRelevance('count(${a}) + count(${b})');
			expect(result).toContain('(');
			expect(result).toContain(')');
		});

		test('trims whitespace', () => {
			const result = convertRelevance('  ${x} = 5  ');
			expect(result).not.toMatch(/^\s/);
			expect(result).not.toMatch(/\s$/);
		});
	});
});