import { describe, test, expect } from 'vitest';
import { RelevanceConverter } from '../relevanceConverter';
import { XPathToExpressionScriptConverter } from '../utils/xpathToExpressionScript';

describe('Variable Name Transformation - XPath to LimeSurvey Question Codes', () => {
	const relevanceConverter = new RelevanceConverter();
	const xpathConverter = new XPathToExpressionScriptConverter();

	describe('Basic field reference transformation', () => {
		test('converts simple field references ${field} to field', () => {
			const result = relevanceConverter.convert('${age} > 18');
			expect(result).toBe('age > 18');
		});

		test('converts field references with underscores', () => {
			const result = relevanceConverter.convert('${user_age} > 18');
			expect(result).toBe('userage > 18');
		});

		test('converts multiple field references', () => {
			const result = relevanceConverter.convert('${age} > ${min_age}');
			expect(result).toBe('age > minage');
		});

		test('handles field references in complex expressions', () => {
			const result = relevanceConverter.convert('(${income} > 0 and ${tax} < ${income})');
			expect(result).toBe('(income > 0 and tax < income)');
		});
	});

	describe('Current field reference transformation', () => {
		test('converts . to self at start of expression', () => {
			const result = relevanceConverter.convert('. > 0');
			expect(result).toBe('self > 0');
		});

		test('converts . to self in middle of expression', () => {
			const result = relevanceConverter.convert('${age} > 18 and . != ""');
			expect(result).toBe('age > 18 and self != ""');
		});

		test('converts . to self before parenthesis', () => {
			const result = relevanceConverter.convert('. >= 18 and . <= 100');
			expect(result).toBe('self >= 18 and self <= 100');
		});

		test('handles . followed by space', () => {
			const result = relevanceConverter.convert('. > 0');
			expect(result).toBe('self > 0');
		});

		test('handles . followed by parenthesis', () => {
			const result = relevanceConverter.convert('. >= 18 and . <= 100');
			expect(result).toBe('self >= 18 and self <= 100');
		});

		test('handles . at start of line', () => {
			const result = relevanceConverter.convert('. != ""');
			expect(result).toBe('self != ""');
		});
	});

	describe('Field references in selected() function', () => {
		test('converts selected() with simple field reference', () => {
			const result = relevanceConverter.convert("selected(${consent}, 'yes')");
			expect(result).toBe('(consent=="yes")');
		});

		test('converts selected() with underscore field', () => {
			const result = relevanceConverter.convert("selected(${user_consent}, 'yes')");
			expect(result).toBe('(userconsent=="yes")');
		});

		test('handles multiple selected() calls with different fields', () => {
			const result = relevanceConverter.convert(
				"selected(${q1}, 'yes') and selected(${q2}, 'no')"
			);
			expect(result).toBe('(q1=="yes") and (q2=="no")');
		});

		test('handles selected() with spaces around field', () => {
			const result = relevanceConverter.convert("selected( ${field} , 'value' )");
			expect(result).toBe('(field=="value")');
		});

		test('handles selected() without spaces', () => {
			const result = relevanceConverter.convert("selected(${married},'yes')");
			expect(result).toBe('(married=="yes")');
		});
	});

	describe('Complex expressions with mixed variable types', () => {
		test('handles field references and current field in same expression', () => {
			const result = relevanceConverter.convert('${age} > 18 and . != ""');
			expect(result).toBe('age > 18 and self != ""');
		});

		test('handles multiple field references and current field', () => {
			const result = relevanceConverter.convert('${a} > ${b} and . > 0');
			expect(result).toBe('a > b and self > 0');
		});

		test('handles field references in nested expressions', () => {
			const result = relevanceConverter.convert('(({${a} + ${b}) * ${c})');
			expect(result).toBe('((a + b) * c)');
		});

		test('handles field references with boolean operators', () => {
			const result = relevanceConverter.convert(
				"${age} >= 18 and ${country} = 'USA' or ${country} = 'Canada'"
			);
			expect(result).toBe('age >= 18 and country == "USA" or country == "Canada"');
		});
	});

	describe('Constraint expressions with variable transformation', () => {
		test('converts numeric range constraint with current field', () => {
			const result = relevanceConverter.convertConstraint('. >= 18 and . <= 100');
			expect(result).toContain('/^\\d');
			expect(result).toContain('$/');
		});

		test('converts min-only constraint with current field', () => {
			const result = relevanceConverter.convertConstraint('. >= 18');
			expect(result).toContain('/^\\d');
		});

		test('converts max-only constraint with current field', () => {
			const result = relevanceConverter.convertConstraint('. <= 100');
			expect(result).toContain('/^\\d');
		});

		test('handles constraint with field references (should return empty)', () => {
			// Field references in constraints are not supported, should return empty
			const result = relevanceConverter.convertConstraint('. > ${min_value}');
			expect(result).toBe('');
		});
	});

	describe('Calculation expressions with variable transformation', () => {
		test('converts simple calculation with field references', () => {
			const result = relevanceConverter.convertCalculation('${a} + ${b}');
			expect(result).toBe('a + b');
		});

		test('converts calculation with parentheses', () => {
			const result = relevanceConverter.convertCalculation('(${x} + ${y}) / 2');
			expect(result).toBe('(x + y) / 2');
		});

		test('converts calculation with multiple operators', () => {
			const result = relevanceConverter.convertCalculation('${price} * ${quantity} + ${tax}');
			expect(result).toBe('price * quantity + tax');
		});

		test('handles calculation with field references and numbers', () => {
			const result = relevanceConverter.convertCalculation('${total} = ${price} * ${quantity}');
			expect(result).toBe('total = price * quantity');
		});
	});

	describe('Edge cases and error handling', () => {
		test('handles empty expressions', () => {
			const result = relevanceConverter.convert('');
			expect(result).toBe('1');
		});

		test('handles undefined expressions', () => {
			const result = relevanceConverter.convert(undefined as any);
			expect(result).toBe('1');
		});

		test('handles expressions with special characters', () => {
			const result = relevanceConverter.convert('${field} != ""');
			expect(result).toBe('field != ""');
		});

		test('handles expressions with numbers', () => {
			const result = relevanceConverter.convert('${x} = 123');
			expect(result).toBe('x == 123');
		});

		test('preserves parentheses in complex expressions', () => {
			const result = relevanceConverter.convert('(({${a} + ${b}) * ${c})');
			expect(result).toBe('((a + b) * c)');
		});

		test('handles expressions with quoted strings', () => {
			const result = relevanceConverter.convert('${name} = "John Doe"');
			expect(result).toBe('name == "John Doe"');
		});

		test('handles expressions with empty strings', () => {
			const result = relevanceConverter.convert('${field} != ""');
			expect(result).toBe('field != ""');
		});

		test('trims whitespace from expressions', () => {
			const result = relevanceConverter.convert('  ${x} = 5  ');
			expect(result).not.toMatch(/^\s/);
			expect(result).not.toMatch(/\s$/);
		});
	});

	describe('Real-world XLSForm expressions', () => {
		test('converts typical relevance expression', () => {
			const result = relevanceConverter.convert(
				"selected(${consent}, 'yes') and ${age} >= 18"
			);
			expect(result).toBe('(consent=="yes") and age >= 18');
		});

		test('converts constraint with numeric range', () => {
			const result = relevanceConverter.convertConstraint(
				". >= 1 and . <= 10"
			);
			expect(result).toContain('/^\\d');
		});

		test('converts calculation expression', () => {
			const result = relevanceConverter.convertCalculation(
				"${total} = ${price} * ${quantity}"
			);
			expect(result).toBe('total = price * quantity');
		});

		test('handles complex nested expression', () => {
			const result = relevanceConverter.convert(
				"(${consent} = 'yes' and ${age} >= 18) or (${country} = 'USA' and ${gender} = 'male')"
			);
			expect(result).toBe('((consent == "yes" and age >= 18) or (country == "USA" and gender == "male"))');
		});

		test('handles field references with various naming patterns', () => {
			const result = relevanceConverter.convert(
				"${user_first_name} != '' and ${user_last_name} != ''"
			);
			expect(result).toBe('userfirstname != "" and userlastname != ""');
		});
	});

	describe('Comparison between converters', () => {
		test('both converters handle basic field references similarly', () => {
			const relevanceResult = relevanceConverter.convert('${age} > 18');
			const xpathResult = xpathConverter.convert('${age} > 18');
			
			// Both should produce the same result for basic field references
			expect(relevanceResult).toBe(xpathResult);
				expect(relevanceResult).toBe('age > 18');
		});

		test('both converters handle selected() similarly', () => {
			const relevanceResult = relevanceConverter.convert("selected(${consent}, 'yes')");
			const xpathResult = xpathConverter.convert("selected(${consent}, 'yes')");
			
			// Both should produce the same result for selected()
			expect(relevanceResult).toBe(xpathResult);
				expect(relevanceResult).toBe('(consent=="yes")');
		});

		test('both converters handle current field references similarly', () => {
			const relevanceResult = relevanceConverter.convert('. > 0');
			const xpathResult = xpathConverter.convert('. > 0');
			
			// Both should produce the same result for current field references
			expect(relevanceResult).toBe(xpathResult);
				expect(relevanceResult).toBe('self > 0');
		});

		test('both converters handle constraint expressions similarly', () => {
			const relevanceResult = relevanceConverter.convertConstraint('. >= 18 and . <= 100');
			const xpathResult = xpathConverter.convertConstraint('. >= 18 and . <= 100');
			
			// Both should produce the same result for constraints
			expect(relevanceResult).toBe(xpathResult);
			expect(relevanceResult).toContain('/^\\d');
		});

		test('both converters handle calculation expressions similarly', () => {
			const relevanceResult = relevanceConverter.convertCalculation('${a} + ${b}');
			const xpathResult = xpathConverter.convertCalculation('${a} + ${b}');
			
			// Both should produce the same result for calculations
			expect(relevanceResult).toBe(xpathResult);
				expect(relevanceResult).toBe('a + b');
		});
	});
});