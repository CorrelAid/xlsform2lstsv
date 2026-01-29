/**
 * Expression Converter
 * 
 * Unified converter for XPath → LimeSurvey Expression Manager transformations.
 * 
 * Converts XLSForm XPath expressions to LimeSurvey Expression Manager syntax.
 * 
 * References:
 * - XLSForm Relevance: https://xlsform.org/en/#relevant
 * - XLSForm Constraints: https://xlsform.org/en/#constraints
 * 
 * Handles both relevance expressions and constraints using XLSForm terminology:
 * - Relevance: Determines when questions should be shown/hidden
 * - Constraints: Defines validation rules for question answers
 */

export class ExpressionConverter {
    /**
     * Sanitize field names by removing underscores to match LimeSurvey's naming conventions
     */
    sanitizeName(name: string): string {
        return name.replace(/_/g, '');
    }

    /**
     * Convert selected(${field}, 'value') to (field=="value")
     */
    protected convertSelectedFunctions(expr: string): string {
        return expr.replace(
            /selected\(\s*\$\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
            (_match, fieldName, value) => {
                return `(${this.sanitizeName(fieldName)}=="${value}")`;
            }
        );
    }

    /**
     * Convert single quotes to double quotes for consistency
     */
    protected convertQuotes(expr: string): string {
        return expr.replace(/'/g, '"');
    }

    /**
     * Clean up extra parentheses that might have been introduced during conversion
     * Note: This only removes truly redundant parentheses where the inner expression
     * is completely balanced. It does not attempt to "fix" unbalanced expressions.
     */
    protected cleanParentheses(expr: string): string {
        // Only handle cases where we have double opening and double closing parentheses
        // Input: ((balanced)) → Output: (balanced)
        if (expr.startsWith('((') && expr.endsWith('))') && !expr.startsWith('(((')) {
            const inner = expr.substring(1, expr.length - 1); // Remove first ( and last )
            // Check if the inner expression is balanced
            let balance = 0;
            for (const char of inner) {
                if (char === '(') balance++;
                if (char === ')') balance--;
                if (balance < 0) break; // Early exit if unbalanced
            }
            if (balance === 0) {
                return inner;
            }
        }
        
        // For unbalanced expressions, return as-is
        return expr;
    }

    /**
     * Validate that an expression has balanced parentheses
     * @param expr The expression to validate
     * @returns true if balanced, false otherwise
     */
    protected hasBalancedParentheses(expr: string): boolean {
        let balance = 0;
        for (const char of expr) {
            if (char === '(') balance++;
            if (char === ')') balance--;
            if (balance < 0) return false; // More closing than opening
        }
        return balance === 0;
    }

    /**
     * Add outer parentheses for complex expressions that need them
     * This handles cases like: (expr1) or (expr2) → ((expr1) or (expr2))
     */
    protected addOuterParenthesesForComplexExpressions(expr: string): string {
        // Check if this is a complex expression with 'or' at the top level
        // Pattern: (something) or (something else)
        // We need to be careful not to add parentheses if they already exist
        const orPattern = /^\([^)]*\)\s+or\s+\([^)]*\)$/;
        if (orPattern.test(expr) && !expr.startsWith('((')) {
            return `(${expr})`;
        }
        
        // Also handle more complex nested expressions with nested parentheses
        // Pattern: ((something) or (something else)) - but check if it already has outer parentheses
        const complexOrPattern = /^\([^)]*\)\s+or\s+\([^)]*\)$/;
        if (complexOrPattern.test(expr) && !expr.startsWith('((')) {
            return `(${expr})`;
        }
        
        return expr;
    }

    /**
     * Convert ${field} references to field names
     */
    protected convertFieldReferences(expr: string): string {
        return expr.replace(/\${(\w+)}/g, (_match, fieldName) => {
            return this.sanitizeName(fieldName);
        });
    }

    /**
     * Convert comparison operators
     * @param preserveWhitespace - Whether to preserve whitespace around operators
     * @param isCalculation - Whether this is a calculation expression (uses = instead of ==)
     */
    protected convertComparisonOperators(expr: string, preserveWhitespace: boolean = false, isCalculation: boolean = false): string {
        let result = expr;
        
        if (preserveWhitespace) {
            // Keep spaces around operators
            result = result.replace(/\s*!=\s*/g, ' != ');
            result = result.replace(/\s*<=\s*/g, ' <= ');
            result = result.replace(/\s*>=\s*/g, ' >= ');
            result = result.replace(/([^<>=])\s*<\s*([^=])/g, '$1 < $2');
            result = result.replace(/([^<>=])\s*>\s*([^=])/g, '$1 > $2');
            if (isCalculation) {
                result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1 = $2');
            } else {
                result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1 == $2');
            }
        } else {
            // Remove extra whitespace around operators
            result = result.replace(/\s*!=\s*/g, '!=');
            result = result.replace(/\s*<=\s*/g, '<=');
            result = result.replace(/\s*>=\s*/g, '>=');
            result = result.replace(/([^<>=])\s*<\s*([^=])/g, '$1<$2');
            result = result.replace(/([^<>=])\s*>\s*([^=])/g, '$1>$2');
            if (isCalculation) {
                result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1=$2');
            } else {
                result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1==$2');
            }
        }
        
        return result;
    }

    /**
     * Convert boolean operators
     * @param preserveWhitespace - Whether to preserve whitespace around operators
     */
    protected convertBooleanOperators(expr: string, preserveWhitespace: boolean = false): string {
        let result = expr;
        
        if (preserveWhitespace) {
            // Replace and/or with single space around them
            result = result.replace(/\band\b/gi, ' and ');
            result = result.replace(/\bor\b/gi, ' or ');
            // Remove duplicate spaces that might have been created
            result = result.replace(/\s+and\s+/g, ' and ');
            result = result.replace(/\s+or\s+/g, ' or ');
        } else {
            result = result.replace(/\band\b/gi, 'and');
            result = result.replace(/\bor\b/gi, 'or');
        }
        
        return result;
    }

    /**
     * Convert current field references (. to self)
     */
    protected convertCurrentFieldReferences(expr: string): string {
        let result = expr;
        
        result = result.replace(/\.\s/g, 'self ');
        result = result.replace(/\.\)/g, "self$1");
        result = result.replace(/^\.\s*/, 'self ');
        
        return result;
    }

    /**
     * Convert XPath constraint to regex validation pattern for LimeSurvey
     */
    convertConstraint(constraint: string): string {
        if (!constraint) return '';

        let expr = constraint;

        // Extract from regexMatch() pattern if present
        const regexMatchPattern = /regexMatch\s*\\(\s*["']([^'"]+)["']\s*,\s*[^)]+\\)/;
        const regexMatch = expr.match(regexMatchPattern);
        if (regexMatch) {
            expr = regexMatch[1];
        }

        // Try to detect numeric range patterns: . >= X and . <= Y
        const rangePattern = /^\.\s*>=\s*(\d+)\s+and\s+\.\s*<=\s*(\d+)$/i;
        const rangeMatch = expr.match(rangePattern);
        if (rangeMatch) {
            const min = parseInt(rangeMatch[1]);
            const max = parseInt(rangeMatch[2]);

            // Generate regex for numeric range
            const minDigits = min.toString().length;
            const maxDigits = max.toString().length;

            if (minDigits === maxDigits) {
                return `/^\\d{${minDigits}}$/`;
            } else {
                return `/^\\d{${minDigits},${maxDigits}}$/`;
            }
        }

        // Try min-only pattern: . >= X
        const minOnlyPattern = /^\.\s*>=\s*(\d+)$/i;
        const minMatch = expr.match(minOnlyPattern);
        if (minMatch) {
            const min = parseInt(minMatch[1]);
            const minDigits = min.toString().length;
            return `/^\\d{${minDigits},}$/`;
        }

        // Try max-only pattern: . <= X
        const maxOnlyPattern = /^\.\s*<=\s*(\d+)$/i;
        const maxMatch = expr.match(maxOnlyPattern);
        if (maxMatch) {
            const max = parseInt(maxMatch[1]);
            const maxDigits = max.toString().length;
            return `/^\\d{1,${maxDigits}}$/`;
        }

        // For regex-like patterns that start/end with regex anchors, pass them through directly
        if ((expr.startsWith('^') || expr.startsWith('.') || expr.startsWith('[')) &&
            (expr.endsWith('$') || expr.includes('*') || expr.includes('+') || expr.includes('?'))) {
            return expr;
        }

        // For other constraints, return empty (not supported as regex)
        return '';
    }

    /**
     * Convert string functions
     */
    private convertStringFunctions(expr: string): string {
        let result = expr;
        
        // string() → String() or just remove if not needed
        result = result.replace(/\bstring\s*\(\s*([^)]+)\s*\)/g, '$1');
        
        // concat() → string concatenation with +
        result = result.replace(
            /\bconcat\s*\(\s*([^)]+)\s*\)/g,
            (_match, args) => {
                // Split arguments and join with +
                const argList = args.split(/\s*,\s*/);
                return argList.join(' + ');
            }
        );
        
        // substring(string, start, length) → substr(string, start, length)
        // Use word boundary to ensure we match the full function name
        result = result.replace(
            /\bsubstring\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            'substr($1, $2, $3)'
        );
        
        // Also handle substring(string, start) → substr(string, start)
        result = result.replace(
            /\bsubstring\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            'substr($1, $2)'
        );
        
        // string-length(string) → len(string)
        result = result.replace(
            /\bstring-length\s*\(\s*([^)]+)\s*\)/g,
            'len($1)'
        );
        
        // contains(string, substring) → strpos(string, substring) > 0
        result = result.replace(
            /\bcontains\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            'strpos($1, $2) > 0'
        );
        
        // starts-with(string, prefix) → startsWith(string, prefix)
        result = result.replace(
            /\bstarts-with\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            'startsWith($1, $2)'
        );
        
        // ends-with(string, suffix) → endsWith(string, suffix)
        result = result.replace(
            /\bends-with\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            'endsWith($1, $2)'
        );
        
        return result;
    }

    /**
     * Convert number functions
     */
    private convertNumberFunctions(expr: string): string {
        let result = expr;
        
        // number() → Number() or just remove if not needed
        result = result.replace(/\bnumber\s*\(\s*([^)]+)\s*\)/g, '$1');
        
        // floor(number) → floor(number)
        result = result.replace(
            /\bfloor\s*\(\s*([^)]+)\s*\)/g,
            'floor($1)'
        );
        
        // ceiling(number) → ceil(number)
        result = result.replace(
            /\bceiling\s*\(\s*([^)]+)\s*\)/g,
            'ceil($1)'
        );
        
        // round(number) → round(number)
        result = result.replace(
            /\bround\s*\(\s*([^)]+)\s*\)/g,
            'round($1)'
        );
        
        return result;
    }

    /**
     * Convert math functions
     */
    private convertMathFunctions(expr: string): string {
        let result = expr;
        
        // sum(nodeset) → sum(nodeset)
        result = result.replace(
            /\bsum\s*\(\s*([^)]+)\s*\)/g,
            'sum($1)'
        );
        
        // count(nodeset) → count(nodeset)
        result = result.replace(
            /\bcount\s*\(\s*([^)]+)\s*\)/g,
            'count($1)'
        );
        
        return result;
    }

    /**
     * Convert date functions
     */
    private convertDateFunctions(expr: string): string {
        let result = expr;
        
        // today() → today()
        result = result.replace(/\btoday\s*\(\s*\)/g, 'today()');
        
        // now() → now()
        result = result.replace(/\bnow\s*\(\s*\)/g, 'now()');
        
        return result;
    }

    /**
     * Convert logical functions
     */
    private convertLogicalFunctions(expr: string): string {
        let result = expr;
        
        // not(expression) → !expression
        result = result.replace(
            /\bnot\s*\(\s*([^)]+)\s*\)/g,
            '!($1)'
        );
        
        return result;
    }

    /**
     * Convert conditional functions
     */
    private convertConditionalFunctions(expr: string): string {
        // if(condition, true-value, false-value) → condition ? true-value : false-value
        return expr.replace(
            /\bif\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            '($1 ? $2 : $3)'
        );
    }

    /**
     * Main conversion method for XPath expressions to EM
     */
    convert(expr: string): string {
        if (!expr || expr.trim() === '') return '1';

        let result = expr;

        // Apply transformations in order of specificity
        // Functions must be processed BEFORE field references
        result = this.convertSelectedFunctions(result);
        result = this.convertStringFunctions(result);
        result = this.convertNumberFunctions(result);
        result = this.convertMathFunctions(result);
        result = this.convertDateFunctions(result);
        result = this.convertLogicalFunctions(result);
        result = this.convertConditionalFunctions(result);
        
        // Field references must be processed AFTER functions
        result = this.convertFieldReferences(result);
        
        result = this.convertComparisonOperators(result, true);
        result = this.convertBooleanOperators(result, true);
        result = this.convertCurrentFieldReferences(result);
        
        // Convert single quotes to double quotes
        result = this.convertQuotes(result);

        // Add outer parentheses for complex expressions
        result = this.addOuterParenthesesForComplexExpressions(result);

        return result.trim();
    }

    /**
     * Convert XPath calculation to EM equation
     */
    convertCalculation(calculation: string): string {
        if (!calculation) return '';
        
        let result = calculation;
        
        // For calculations, we need to handle functions and field references
        result = this.convertStringFunctions(result);
        result = this.convertNumberFunctions(result);
        result = this.convertMathFunctions(result);
        result = this.convertFieldReferences(result);
        result = this.convertComparisonOperators(result, true, true); // Use = instead of == for calculations
        result = this.convertBooleanOperators(result, true);
        result = this.convertCurrentFieldReferences(result);
        
        return result.trim();
    }

    /**
     * Convert XPath relevance expression to LimeSurvey Expression Manager syntax
     * 
     * XLSForm relevance expressions use XPath syntax to determine when questions
     * should be shown. This method converts them to LimeSurvey EM syntax.
     * 
     * @param xpath The XPath relevance expression
     * @returns LimeSurvey Expression Manager syntax
     * 
     * Example:
     * - Input: `${age} > 18 and selected(${consent}, 'yes')`
     * - Output: `age > 18 and (consent=="yes")`
     */
    convertRelevance(xpath: string): string {
        if (!xpath) return '1';

        let result = this.convert(xpath);

        // Handle selected() with just {field} (without $) - edge case
        result = result.replace(
            /selected\s*\(\s*\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
            (_match, fieldName, value) => {
                return `(${this.sanitizeName(fieldName)}=="${value}")`;
            }
        );

        // Clean up and add outer parentheses for complex expressions
        result = this.cleanParentheses(result);
        result = this.addOuterParenthesesForComplexExpressions(result);

        // Validate and warn if unbalanced
        if (!this.hasBalancedParentheses(result)) {
            console.warn(`Unbalanced parentheses in relevance expression: "${result}"`);
        }

        return result.trim();
    }

    /**
     * Convert XPath constraint to LimeSurvey validation pattern
     * 
     * XLSForm constraints define validation rules using XPath syntax.
     * This method converts them to LimeSurvey validation patterns.
     * 
     * @param xpath The XPath constraint expression
     * @returns Validation pattern (regex or EM equation)
     * 
     * Example:
     * - Input: `. >= 18 and . <= 100`

    /**
     * General XPath to EM conversion (unified interface)
     * 
     * Provides a single entry point for any XPath → EM conversion.
     * Automatically detects whether it's a relevance or constraint expression
     * and routes accordingly.
     * 
     * @param xpath The XPath expression
     * @param type 'relevance' or 'constraint' (auto-detected if not specified)
     * @returns Converted Expression Manager syntax
     */
    convertXPathToEM(xpath: string, type?: 'relevance' | 'constraint'): string {
        if (!xpath) return type === 'constraint' ? '' : '1';

        // Auto-detect type if not specified
        if (!type) {
            // Relevance expressions typically have field references or selected()
            if (xpath.includes('${') || xpath.includes('selected(')) {
                return this.convertRelevance(xpath);
            }
            // Constraint expressions typically use current field (.)
            if (xpath.includes('.')) {
                return this.convertConstraint(xpath);
            }
            // Default to relevance
            return this.convertRelevance(xpath);
        }

        return type === 'relevance' ? this.convertRelevance(xpath) : this.convertConstraint(xpath);
    }
}