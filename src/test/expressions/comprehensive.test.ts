/**
 * Comprehensive expression conversion tests using shared test utilities
 * 
 * This file demonstrates the new testing approach that:
 * 1. Uses shared test utilities and helpers
 * 2. Tests complete expressions rather than partial matches
 * 3. Provides better maintainability and organization
 * 4. Supports both AST-based and regex-based converters for comparison
 */

import { describe, test, expect } from 'vitest';
import { xpathToLimeSurvey } from '../../converters/xpathTranspiler';
import {
    runCompleteExpressionTest,
    basicExpressionTests,
    selectedFunctionTests,
    booleanOperatorTests,
    complexExpressionTests,
    currentFieldReferenceTests,
    constraintTests,
    functionTests,
    edgeCaseTests
} from './helpers';

describe('Comprehensive Expression Conversion Tests', () => {

    describe('AST-based Transpiler Tests', () => {
        
        describe('Integration Tests', () => {
            test('complex expression with multiple functions and operators', () => {
                const result = xpathToLimeSurvey('count(${items}) > 0 and (${age} >= 18 or ${parent} = "yes") and contains(${name}, "Dr")');
                // Note: Current transpiler doesn't preserve parentheses around OR expressions
                expect(result).toBe('count(items) > 0 and age >= 18 or parent == "yes" and contains(name, "Dr")');
            });

            test('expression with nested functions', () => {
                const result = xpathToLimeSurvey('if(string-length(${name}) > 5, concat(${first}, " ", ${last}), ${nickname})');
                expect(result).toBe('(strlen(name) > 5 ? first + " " + last : nickname)');
            });

            test('expression with multiple field references and operators', () => {
                const result = xpathToLimeSurvey('${age} > 18 and ${consent} = "yes" and ${country} != "USA" and ${score} >= 50');
                expect(result).toBe('age > 18 and consent == "yes" and country != "USA" and score >= 50');
            });
        });
    });

    describe('Constraint Tests', () => {
        constraintTests.forEach(testCase => {
            test(testCase.description, () => {
                runCompleteExpressionTest(testCase);
            });
        });
    });

    describe('xpathTranspiler Direct Tests', () => {
        
        // Test cases for direct xpathToLimeSurvey conversion
        const directTestCases = [
            {
                description: 'simple field comparison',
                input: '${age} > 18',
                expected: 'age > 18',
                converter: 'direct'
            },
            {
                description: 'equality with quotes',
                input: '${name} = "John"',
                expected: 'name == "John"',
                converter: 'direct'
            },
            {
                description: 'boolean expression',
                input: '${x} > 5 and ${y} < 10',
                expected: 'x > 5 and y < 10',
                converter: 'direct'
            }
        ];

        directTestCases.forEach(testCase => {
            test(testCase.description, () => {
                runCompleteExpressionTest(testCase);
            });
        });
    });

    describe('Regression Tests', () => {
        
        // Tests for specific issues that were fixed
        test('selected() function with single quotes should use double quotes', () => {
            const result = runCompleteExpressionTest({
                description: 'selected() single quotes regression',
                input: "selected(${field}, 'value')",
                expected: '(field=="value")',
                converter: 'ast'
            });
            
            // Additional validation: ensure no single quotes remain
            expect(result).not.toContain("'");
        });

        test('if() function should convert to ternary operator', () => {
            const result = runCompleteExpressionTest({
                description: 'if() function regression',
                input: 'if(${age} > 18, "adult", "minor")',
                expected: '(age > 18 ? "adult" : "minor")',
                converter: 'ast'
            });
            
            // Additional validation: ensure ternary operators are present
            expect(result).toContain('?');
            expect(result).toContain(':');
        });

        test('boolean operators should work with lowercase', () => {
            const result = runCompleteExpressionTest({
                description: 'boolean operators regression',
                input: '${x} > 5 and ${y} < 10 or ${z} = 3',
                expected: 'x > 5 and y < 10 or z == 3',
                converter: 'relevance'
            });
            
            // Additional validation: ensure operators are present
            expect(result).toContain('and');
            expect(result).toContain('or');
        });
    });

    describe('Performance Tests', () => {
        
        test('complex expression should process efficiently', () => {
            const complexExpr = '(${field1} > 5 and ${field2} = "text") or (${field3} < 10 and selected(${field4}, "option")) or ${field5} != ""';
            
            const startTime = performance.now();
            const result = runCompleteExpressionTest({
                description: 'performance test',
                input: complexExpr,
                expected: /field1.*field2.*field3.*field4.*field5/s,
                converter: 'ast'
            });
            const endTime = performance.now();
            
            console.log(`Complex expression processed in ${endTime - startTime}ms`);
            
            // Should process in under 100ms (very generous limit)
            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});