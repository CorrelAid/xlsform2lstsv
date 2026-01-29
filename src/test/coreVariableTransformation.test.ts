import { describe, test, expect } from 'vitest';
import { RelevanceConverter } from '../relevanceConverter';
import { XPathToExpressionScriptConverter } from '../utils/xpathToExpressionScript';

describe('Core Variable Transformation - XPath to LimeSurvey Question Codes', () => {
	const relevanceConverter = new RelevanceConverter();
	const xpathConverter = new XPathToExpressionScriptConverter();

	describe('Core variable transformation functionality', () => {
		test('transforms ${field} to field correctly', () => {
			const result = relevanceConverter.convert('${age} > 18');
			expect(result).toContain('age');
			expect(result).not.toContain('${age}');
			expect(result).not.toContain('{age}');
		});

		test('transforms field references with underscores', () => {
			const result = relevanceConverter.convert('${user_age} > 18');
			expect(result).toContain('userage');
			expect(result).not.toContain('${user_age}');
			expect(result).not.toContain('{user_age}');
		});

		test('transforms multiple field references', () => {
			const result = relevanceConverter.convert('${age} > ${min_age}');
			expect(result).toContain('age');
			expect(result).toContain('minage');
			expect(result).not.toContain('${');
		});

		test('transforms current field . to self', () => {
			const result = relevanceConverter.convert('. > 0');
			expect(result).toContain('self');
			expect(result).not.toContain('.');
		});

		test('transforms field references in selected() function', () => {
			const result = relevanceConverter.convert("selected(${consent}, 'yes')");
			expect(result).toContain('consent');
			expect(result).not.toContain('${consent}');
			expect(result).not.toContain('{consent}');
		});

		test('transforms field references in complex expressions', () => {
			const result = relevanceConverter.convert('(${income} > 0 and ${tax} < ${income})');
			expect(result).toContain('income');
			expect(result).toContain('tax');
			expect(result).not.toContain('${');
		});
	});

	describe('Variable transformation in different contexts', () => {
		test('transforms variables in relevance expressions', () => {
			const result = relevanceConverter.convert("selected(${consent}, 'yes') and ${age} >= 18");
			expect(result).toContain('consent');
			expect(result).toContain('age');
			expect(result).not.toContain('${');
		});

		test('transforms variables in constraint expressions', () => {
			const result = relevanceConverter.convertConstraint('. >= 18 and . <= 100');
			expect(result).toContain('/^\\d');
		});

		test('transforms variables in calculation expressions', () => {
			const result = relevanceConverter.convertCalculation('${a} + ${b}');
			expect(result).toContain('a');
			expect(result).toContain('b');
			expect(result).not.toContain('${');
		});

		test('transforms variables in nested expressions', () => {
			const result = relevanceConverter.convert('(({${a} + ${b}) * ${c})');
			expect(result).toContain('a');
			expect(result).toContain('b');
			expect(result).toContain('c');
			expect(result).not.toContain('${');
		});
	});

	describe('Edge cases and error conditions', () => {
		test('handles empty expressions', () => {
			const result = relevanceConverter.convert('');
			expect(result).toBe('1');
		});

		test('handles undefined expressions', () => {
			const result = relevanceConverter.convert(undefined as any);
			expect(result).toBe('1');
		});

		test('handles expressions with no variables', () => {
			const result = relevanceConverter.convert('1 > 0');
			expect(result).toBe('1 > 0');
		});

		test('handles expressions with only current field', () => {
			const result = relevanceConverter.convert('. != ""');
			expect(result).toContain('self');
		});
	});

	describe('Comparison between converters', () => {
		test('both converters transform basic field references', () => {
			const relevanceResult = relevanceConverter.convert('${age} > 18');
			const xpathResult = xpathConverter.convert('${age} > 18');
			
			// Both should contain the transformed field name
			expect(relevanceResult).toContain('age');
			expect(xpathResult).toContain('age');
			expect(relevanceResult).not.toContain('${');
			expect(xpathResult).not.toContain('${');
		});

		test('both converters transform selected() function', () => {
			const relevanceResult = relevanceConverter.convert("selected(${consent}, 'yes')");
			const xpathResult = xpathConverter.convert("selected(${consent}, 'yes')");
			
			// Both should contain the transformed field name
			expect(relevanceResult).toContain('consent');
			expect(xpathResult).toContain('consent');
			expect(relevanceResult).not.toContain('${');
			expect(xpathResult).not.toContain('${');
		});

		test('both converters transform current field references', () => {
			const relevanceResult = relevanceConverter.convert('. > 0');
			const xpathResult = xpathConverter.convert('. > 0');
			
			// Both should contain 'self'
			expect(relevanceResult).toContain('self');
			expect(xpathResult).toContain('self');
			expect(relevanceResult).not.toContain('.');
			expect(xpathResult).not.toContain('.');
		});

		test('both converters handle constraint expressions', () => {
			const relevanceResult = relevanceConverter.convertConstraint('. >= 18 and . <= 100');
			const xpathResult = xpathConverter.convertConstraint('. >= 18 and . <= 100');
			
			// Both should return similar regex patterns
			expect(relevanceResult).toBe(xpathResult);
			expect(relevanceResult).toContain('/^\\d');
		});

		test('both converters handle calculation expressions', () => {
			const relevanceResult = relevanceConverter.convertCalculation('${a} + ${b}');
			const xpathResult = xpathConverter.convertCalculation('${a} + ${b}');
			
			// Both should contain the transformed field names
			expect(relevanceResult).toContain('a');
			expect(relevanceResult).toContain('b');
			expect(xpathResult).toContain('a');
			expect(xpathResult).toContain('b');
		});
	});

	describe('Real-world XLSForm variable transformation', () => {
		test('transforms variables in typical relevance expression', () => {
			const result = relevanceConverter.convert(
				"selected(${consent}, 'yes') and ${age} >= 18"
			);
			
			// Should contain transformed field names
			expect(result).toContain('consent');
			expect(result).toContain('age');
			// Should not contain original XPath syntax
			expect(result).not.toContain('${');
		});

		test('transforms variables in constraint with numeric range', () => {
			const result = relevanceConverter.convertConstraint(
				". >= 1 and . <= 10"
			);
			
			// Should return a regex pattern for numeric validation
			expect(result).toContain('/^\\d');
		});

		test('transforms variables in calculation expression', () => {
			const result = relevanceConverter.convertCalculation(
				"${total} = ${price} * ${quantity}"
			);
			
			// Should contain transformed field names
			expect(result).toContain('total');
			expect(result).toContain('price');
			expect(result).toContain('quantity');
			// Should not contain original XPath syntax
			expect(result).not.toContain('${');
		});

		test('transforms variables in complex nested expression', () => {
			const result = relevanceConverter.convert(
				"(${consent} = 'yes' and ${age} >= 18) or (${country} = 'USA' and ${gender} = 'male')"
			);
			
			// Should contain all transformed field names
			expect(result).toContain('consent');
			expect(result).toContain('age');
			expect(result).toContain('country');
			expect(result).toContain('gender');
			// Should not contain original XPath syntax
			expect(result).not.toContain('${');
		});

		test('transforms variables with various naming patterns', () => {
			const result = relevanceConverter.convert(
				"${user_first_name} != '' and ${user_last_name} != ''"
			);
			
			// Should contain transformed field names (underscores removed)
			expect(result).toContain('userfirstname');
			expect(result).toContain('userlastname');
			// Should not contain original XPath syntax
			expect(result).not.toContain('${');
		});
	});

	describe('Variable transformation validation', () => {
		test('ensures all ${field} references are transformed', () => {
			const result = relevanceConverter.convert('${field1} > ${field2} and ${field3} < 10');
			
			// Should not contain any remaining ${...} patterns
			expect(result).not.toContain('${');
		});

		test('ensures all . references are transformed to self', () => {
			const result = relevanceConverter.convert('. > 0 and . < 100');
			
			// Should not contain any remaining . patterns (except in numbers)
			expect(result).not.toContain('. >');
			expect(result).not.toContain('. <');
			expect(result).toContain('self');
		});

		test('ensures selected() function variables are transformed', () => {
			const result = relevanceConverter.convert("selected(${field}, 'value')");
			
			// Should not contain any remaining ${...} patterns
			expect(result).not.toContain('${');
			expect(result).not.toContain('{field}');
		});

		test('handles mixed variable types correctly', () => {
			const result = relevanceConverter.convert('${field} > 0 and . != ""');
			
			// Should transform both field references and current field
			expect(result).toContain('field');
			expect(result).toContain('self');
			expect(result).not.toContain('${');
		});
	});
});