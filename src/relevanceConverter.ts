/**
 * Converts XLSForm XPath expressions to LimeSurvey Expression Manager syntax
 */
export class RelevanceConverter {
	private sanitizeName(name: string): string {
		// Remove underscores to match LimeSurvey's naming conventions
		return name.replace(/_/g, '');
	}

	convert(expr: string): string {
		if (!expr) return '1';

		let result = expr;

		// selected(${field}, 'value') → (field=="value")
		// Handle this BEFORE removing ${} patterns
		result = result.replace(
			/selected\s*\(\s*\$\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
			(_match, fieldName, value) => {
				return `(${this.sanitizeName(fieldName)}="${value}")`;
			}
		);

		// ${field} → field (NO curly braces in LimeSurvey relevance expressions)
		// Sanitize field names (remove underscores)
		result = result.replace(/\${(\w+)}/g, (_match, fieldName) => {
			return this.sanitizeName(fieldName);
		});

		// Handle selected() with just {field} (without $) - shouldn't happen but be safe
		result = result.replace(
			/selected\s*\(\s*\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
			(_match, fieldName, value) => {
				return `(${this.sanitizeName(fieldName)}="${value}")`;
			}
		);

		// Normalize operators (order matters!)
		// Keep spaces around operators for readability
		result = result.replace(/\s*!=\s*/g, ' != ');
		result = result.replace(/\s*<=\s*/g, ' <= ');
		result = result.replace(/\s*>=\s*/g, ' >= ');
		// Then handle < and > (but not when part of <=, >=)
		result = result.replace(/([^<>=])\s*<\s*([^=])/g, '$1 < $2');
		result = result.replace(/([^<>=])\s*>\s*([^=])/g, '$1 > $2');
		// Finally convert single = to == (but not if already part of ==, !=, <=, >=)
		result = result.replace(/([^=!<>])\s*=\s*([^=])/g, '$1 == $2');

		// Boolean operators
		result = result.replace(/\band\b/gi, ' and ');
		result = result.replace(/\bor\b/gi, ' or ');

		// . (current field) → self
		result = result.replace(/\.\s/g, 'self ');
		result = result.replace(/\.\)/g, 'self)');
		result = result.replace(/^\.\s*/, 'self ');

		return result.trim();
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
		// Pattern: . >= min and . <= max
		const rangePattern = /^\.\s*>=\s*(\d+)\s+and\s+\.\s*<=\s*(\d+)$/i;
		const rangeMatch = expr.match(rangePattern);
		if (rangeMatch) {
			const min = parseInt(rangeMatch[1]);
			const max = parseInt(rangeMatch[2]);

			// Generate regex for numeric range
			// For simple ranges, we'll create a pattern that matches the digit count
			const minDigits = min.toString().length;
			const maxDigits = max.toString().length;

			if (minDigits === maxDigits) {
				// Same number of digits - use simple pattern
				return `/^\\d{${minDigits}}$/`;
			} else {
				// Different digit counts - match any number with appropriate length
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
		// This handles patterns like .+@.+\..+ which are clearly regex patterns
		if ((expr.startsWith('^') || expr.startsWith('.') || expr.startsWith('[')) &&
			(expr.endsWith('$') || expr.includes('*') || expr.includes('+') || expr.includes('?'))) {
			return expr;
		}

		// For other constraints, return empty (not supported as regex)
		// These would need to be handled differently in LimeSurvey
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