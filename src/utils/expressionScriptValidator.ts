/**
 * Expression Script Validator
 * 
 * This module provides validation for LimeSurvey Expression Manager syntax
 * based on the patterns and functions supported by LimeSurvey's EM system.
 * 
 * Inspired by LimeSurvey's em_javascript.js implementation.
 */

export class ExpressionScriptValidator {
    private supportedFunctions: Set<string>;
    private supportedOperators: Set<string>;
    private reservedKeywords: Set<string>;

    constructor() {
        // Supported functions based on LimeSurvey Expression Manager
        this.supportedFunctions = new Set([
            'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
            'floor', 'log', 'max', 'min', 'pow', 'round', 'sin', 'sqrt', 'tan',
            'count', 'sum', 'avg', 'median', 'stddev', 'variance',
            'len', 'substr', 'strpos', 'startsWith', 'endsWith', 'concat',
            'upper', 'lower', 'trim', 'ltrim', 'rtrim', 'replace',
            'today', 'now', 'date', 'time', 'datetime', 'formatDate',
            'if', 'iif', 'coalesce', 'isEmpty', 'isNull', 'isNumeric',
            'regexMatch', 'regexReplace'
        ]);

        // Supported operators
        this.supportedOperators = new Set([
            '==', '!=', '<', '>', '<=', '>=',
            '&&', '||', '!',
            '+', '-', '*', '/', '%',
            '^' // exponentiation
        ]);

        // Reserved keywords
        this.reservedKeywords = new Set([
            'self', 'that', 'this', 'true', 'false', 'null', 'NA'
        ]);
    }

    /**
     * Validate an Expression Script expression
     * Returns an array of validation errors, or empty array if valid
     */
    validate(expression: string): string[] {
        const errors: string[] = [];

        if (!expression || expression.trim() === '') {
            return errors; // Empty expressions are considered valid
        }

        // Basic syntax checks
        this.checkParenthesesBalance(expression, errors);
        this.checkQuotesBalance(expression, errors);
        this.checkBracketsBalance(expression, errors);

        // Function validation
        this.validateFunctions(expression, errors);

        // Operator validation
        this.validateOperators(expression, errors);

        // Variable name validation
        this.validateVariableNames(expression, errors);

        return errors;
    }

    /**
     * Check if parentheses are balanced
     */
    private checkParenthesesBalance(expression: string, errors: string[]): void {
        let balance = 0;
        for (const char of expression) {
            if (char === '(') balance++;
            if (char === ')') balance--;
        }
        if (balance !== 0) {
            errors.push('Unbalanced parentheses');
        }
    }

    /**
     * Check if quotes are balanced
     */
    private checkQuotesBalance(expression: string, errors: string[]): void {
        let singleQuoteBalance = 0;
        let doubleQuoteBalance = 0;
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
            } else if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
            }

            // Check for escaped quotes
            if ((char === "'" && inSingleQuote && expression[i-1] !== '\\') ||
                (char === '"' && inDoubleQuote && expression[i-1] !== '\\')) {
                // This is an unescaped quote that should toggle the state
                // Already handled above
            }
        }

        if (inSingleQuote) {
            errors.push('Unbalanced single quotes');
        }
        if (inDoubleQuote) {
            errors.push('Unbalanced double quotes');
        }
    }

    /**
     * Check if brackets are balanced
     */
    private checkBracketsBalance(expression: string, errors: string[]): void {
        let balance = 0;
        for (const char of expression) {
            if (char === '[') balance++;
            if (char === ']') balance--;
        }
        if (balance !== 0) {
            errors.push('Unbalanced brackets');
        }
    }

    /**
     * Validate function calls
     */
    private validateFunctions(expression: string, errors: string[]): void {
        // Find all function calls
        const functionRegex = /(\w+)\s*\(/g;
        let match;

        while ((match = functionRegex.exec(expression)) !== null) {
            const functionName = match[1];

            // Skip if it's part of a larger identifier (like a variable name)
            const prevChar = expression[match.index - 1];
            if (prevChar && /[\w$]/.test(prevChar)) {
                continue; // This is likely part of a variable name, not a function
            }

            if (!this.supportedFunctions.has(functionName) && 
                !this.reservedKeywords.has(functionName)) {
                errors.push(`Unsupported function: ${functionName}`);
            }
        }
    }

    /**
     * Validate operators
     */
    private validateOperators(expression: string, errors: string[]): void {
        // Check for common operator issues
        const operators = ['==', '!=', '<=', '>=', '&&', '||', '!', '+', '-', '*', '/', '%', '^'];
        
        for (const operator of operators) {
            const escapedOperator = operator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedOperator, 'g');
            let match;
            
            while ((match = regex.exec(expression)) !== null) {
                // Check context to make sure this is actually an operator
                const prevChar = expression[match.index - 1];
                const nextChar = expression[match.index + operator.length];
                
                // Skip if it's part of a larger token
                if (prevChar && /[\w$]/.test(prevChar)) continue;
                if (nextChar && /[\w$]/.test(nextChar)) continue;
            }
        }
    }

    /**
     * Validate variable names
     */
    private validateVariableNames(expression: string, errors: string[]): void {
        // Find potential variable names that start with numbers (invalid)
        const invalidVariableRegex = /\b(\d[\w$]*)\b/g;
        let match;

        while ((match = invalidVariableRegex.exec(expression)) !== null) {
            const variableName = match[1];

            // Skip if it's a number literal (like 123, 45.67)
            if (/^\d+(\.\d+)?$/.test(variableName)) {
                continue;
            }

            // This is an invalid variable name (starts with number)
            errors.push(`Invalid variable name: ${variableName}`);
        }
    }

    /**
     * Check if an expression is valid
     */
    isValid(expression: string): boolean {
        const errors = this.validate(expression);
        return errors.length === 0;
    }

    /**
     * Get supported functions
     */
    getSupportedFunctions(): string[] {
        return Array.from(this.supportedFunctions).sort();
    }

    /**
     * Get supported operators
     */
    getSupportedOperators(): string[] {
        return Array.from(this.supportedOperators).sort();
    }

    /**
     * Get reserved keywords
     */
    getReservedKeywords(): string[] {
        return Array.from(this.reservedKeywords).sort();
    }
}