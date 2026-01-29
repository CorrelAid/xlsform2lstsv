/**
 * XPath to Expression Script Converter
 * 
 * This module provides comprehensive conversion from XPath expressions (used in XLSForm)
 * to LimeSurvey Expression Manager syntax.
 * 
 * Supported XPath functions and their EM equivalents:
 * - selected() → field comparison
 * - string() → string conversion
 * - number() → numeric conversion
 * - concat() → string concatenation
 * - substring() → substr()
 * - string-length() → len()
 * - contains() → strpos() > 0
 * - starts-with() → startsWith()
 * - ends-with() → endsWith()
 * - if() → ternary operator
 * - today() → today()
 * - now() → now()
 * - count() → count()
 * - sum() → sum()
 * - floor() → floor()
 * - ceiling() → ceil()
 * - round() → round()
 */

export class XPathToExpressionScriptConverter {
    private sanitizeName(name: string): string {
        // Remove underscores to match LimeSurvey's naming conventions
        return name.replace(/_/g, '');
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
        
        result = this.convertComparisonOperators(result);
        result = this.convertBooleanOperators(result);
        result = this.convertCurrentFieldReferences(result);

        return result.trim();
    }

    /**
     * Convert selected(${field}, 'value') to (field == "value")
     */
    private convertSelectedFunctions(expr: string): string {
        return expr.replace(
            /selected\s*\(\s*\$\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
            (_match, fieldName, value) => {
                return `(${this.sanitizeName(fieldName)}=="${value}")`;
            }
        );
    }

    /**
     * Convert ${field} references to field names
     */
    private convertFieldReferences(expr: string): string {
        return expr.replace(/\$\{(\w+)\}/g, (_match, fieldName) => {
            return this.sanitizeName(fieldName);
        });
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
     * Convert comparison operators
     */
    private convertComparisonOperators(expr: string): string {
        let result = expr;
        
        // Convert operators in order of specificity
        result = result.replace(/\s*!=\s*/g, ' != ');
        result = result.replace(/\s*<=\s*/g, ' <= ');
        result = result.replace(/\s*>=\s*/g, ' >= ');
        
        // Handle < and > but not when part of <=, >=
        result = result.replace(/([^<>=])\s*<\s*([^=])/g, '$1 < $2');
        result = result.replace(/([^<>=])\s*>\s*([^=])/g, '$1 > $2');
        
        // Convert single = to == (but not if already part of ==, !=, <=, >=)
        result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1 == $2');
        
        return result;
    }

    /**
     * Convert boolean operators
     */
    private convertBooleanOperators(expr: string): string {
        let result = expr;
        
        // Convert and/or operators (case insensitive)
        result = result.replace(/\band\b/gi, ' and ');
        result = result.replace(/\bor\b/gi, ' or ');
        
        return result;
    }

    /**
     * Convert current field references (. to self)
     */
    private convertCurrentFieldReferences(expr: string): string {
        let result = expr;
        
        result = result.replace(/\.\s/g, 'self ');
        result = result.replace(/\.\)/g, 'self)');
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
        const regexMatchPattern = /regexMatch\s*\(\s*["']([^'"]+)["']\s*,\s*[^)]+\)/;
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
     * Convert XPath calculation to EM equation
     */
    convertCalculation(calculation: string): string {
        if (!calculation) return '';
        return this.convert(calculation);
    }
}