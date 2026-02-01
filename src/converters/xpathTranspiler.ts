/**
 * XPath to LimeSurvey Expression Transpiler
 *
 * This module provides functions to transpile XPath expressions from XLSForm
 * to LimeSurvey Expression Manager syntax using AST-based transformation.
 *
 * The transpiler uses js-xpath library to parse XPath expressions into AST,
 * then recursively transforms the AST nodes to LimeSurvey-compatible syntax.
 */



interface XPathNode {
  id?: string;
  type?: string;
  args?: unknown[];
  left?: unknown;
  right?: unknown;
  steps?: Array<{
    name?: string;
    axis?: string;
  }>;
  value?: {
    _?: string;
  } | string;
  valueDisplay?: string;
  stringDelim?: string;
}

/**
 * Sanitize field names by removing underscores to match LimeSurvey's naming conventions
 */
function sanitizeName(name: string): string {
  return name.replace(/_/g, '');
}

/**
 * Transpiles jsxpath AST nodes to LimeSurvey expression syntax
 *
 * This function takes the Abstract Syntax Tree (AST) nodes produced by the jsxpath library
 * and converts them to LimeSurvey-compatible expression syntax. The jsxpath library
 * returns different node structures depending on the type of XPath expression:
 *
 * - Function calls: Objects with 'id' property (e.g., count(), concat(), regex())
 * - Binary operations: Objects with 'type' property (e.g., <=, >=, =, and, or)
 * - Variable references: Objects with 'steps' arrays containing axis/name info
 * - Literal values: Objects with 'value' property containing the actual value
 *
 * The function recursively processes the AST, handling each node type appropriately
 * and converting XPath syntax to LimeSurvey Expression Manager syntax.
 *
 * @param node - The AST node from jsxpath.parse()
 * @returns The transpiled LimeSurvey expression string
 * @throws Error if an unsupported node structure is encountered
 */
function transpile(node: XPathNode): string {
  if (!node) return '';

  // https://getodk.github.io/xforms-spec/#xpath-functions
  // to https://www.limesurvey.org/manual/ExpressionScript_-_Presentation (see implemented functions)
  if (node.id) {
    switch (node.id) {
      case 'count':
        return `count(${node.args?.map(arg => transpile(arg as XPathNode)).join(', ') || ''})`;
      case 'concat':
        return node.args?.map(arg => transpile(arg as XPathNode)).join(' + ') || '';
      case 'regex':
        return `regexMatch(${node.args?.map(arg => transpile(arg as XPathNode)).join(', ') || ''})`;
      case 'contains':
        // Custom handling for contains
        if (node.args?.length === 2) {
          return `contains(${transpile(node.args[0] as XPathNode)}, ${transpile(node.args[1] as XPathNode)})`;
        }
        break;
      case 'selected':
        // Handle selected(${field}, 'value') -> (field=="value")
        if (node.args?.length === 2) {
          const fieldArg = node.args[0] as XPathNode;
          const valueArg = node.args[1] as XPathNode;
          const fieldName = transpile(fieldArg);
          let value = transpile(valueArg);
          // Remove any existing quotes and use double quotes
          value = value.replace(/^['"]|['"]$/g, "");
          return `(${sanitizeName(fieldName)}=="${value}")`;
        }
        break;
      case 'string':
        // string() function - just return the argument
        if (node.args?.length === 1) {
          return transpile(node.args[0] as XPathNode);
        }
        break;
      case 'number':
        // number() function - just return the argument
        if (node.args?.length === 1) {
          return transpile(node.args[0] as XPathNode);
        }
        break;
      case 'floor':
        if (node.args?.length === 1) {
          return `floor(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'ceiling':
        if (node.args?.length === 1) {
          return `ceil(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'round':
        if (node.args?.length === 1) {
          return `round(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'sum':
        if (node.args?.length === 1) {
          return `sum(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'substring':
        if (node.args && node.args.length >= 2) {
          const stringArg = transpile(node.args[0] as XPathNode);
          const startArg = transpile(node.args[1] as XPathNode);
          const lengthArg = node.args.length > 2 ? transpile(node.args[2] as XPathNode) : '';
          return `substr(${stringArg}, ${startArg}${lengthArg ? ', ' + lengthArg : ''})`;
        }
        break;
      case 'string-length':
        if (node.args?.length === 1) {
          return `strlen(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'starts-with':
        if (node.args?.length === 2) {
          return `startsWith(${transpile(node.args[0] as XPathNode)}, ${transpile(node.args[1] as XPathNode)})`;
        }
        break;
      case 'ends-with':
        if (node.args?.length === 2) {
          return `endsWith(${transpile(node.args[0] as XPathNode)}, ${transpile(node.args[1] as XPathNode)})`;
        }
        break;
      case 'not':
        if (node.args?.length === 1) {
          return `!(${transpile(node.args[0] as XPathNode)})`;
        }
        break;
      case 'if':
        if (node.args?.length === 3) {
          return `(${transpile(node.args[0] as XPathNode)} ? ${transpile(node.args[1] as XPathNode)} : ${transpile(node.args[2] as XPathNode)})`;
        }
        break;
      case 'today':
        return 'today()';
      case 'now':
        return 'now()';
      default:
        throw new Error(`Unsupported function: ${node.id}`);
    }
  }

  // https://getodk.github.io/xforms-spec/#xpath-operators 
  // to https://www.limesurvey.org/manual/ExpressionScript_-_Presentation (see syntax)
  if (node.type) {
    switch (node.type) {
      // Comparison operators
      case '<=':
        return `${transpile(node.left as XPathNode)} <= ${transpile(node.right as XPathNode)}`;
      case '>=':
        return `${transpile(node.left as XPathNode)} >= ${transpile(node.right as XPathNode)}`;
      case '=':
      case '==':
        return `${transpile(node.left as XPathNode)} == ${transpile(node.right as XPathNode)}`;
      case '!=':
        return `${transpile(node.left as XPathNode)} != ${transpile(node.right as XPathNode)}`;
      case '<':
        return `${transpile(node.left as XPathNode)} < ${transpile(node.right as XPathNode)}`;
      case '>':
        return `${transpile(node.left as XPathNode)} > ${transpile(node.right as XPathNode)}`;

      // Arithmetic operators
      case '+':
        return `${transpile(node.left as XPathNode)} + ${transpile(node.right as XPathNode)}`;
      case '-':
        return `${transpile(node.left as XPathNode)} - ${transpile(node.right as XPathNode)}`;
      case '*':
        return `${transpile(node.left as XPathNode)} * ${transpile(node.right as XPathNode)}`;
      case 'div':
        return `${transpile(node.left as XPathNode)} / ${transpile(node.right as XPathNode)}`;
      case 'mod':
        return `${transpile(node.left as XPathNode)} % ${transpile(node.right as XPathNode)}`;

      // Logical operators
      case 'and':
        return `${transpile(node.left as XPathNode)} and ${transpile(node.right as XPathNode)}`;
      case 'or':
        return `${transpile(node.left as XPathNode)} or ${transpile(node.right as XPathNode)}`;

      // Unsupported operators
      case '|':
      case '/':
      case '//':
      case '[]':
      case '..':
      case '@':
      case '::':
      case ',':
        throw new Error(`Unsupported XPath operator: ${node.type}`);

      default:
        throw new Error(`Unsupported operator: ${node.type}`);
    }

  }

  // Handle variable references (jsxpath returns step objects)
  if (node.steps && node.steps.length > 0) {
    const step = node.steps[0];
    if (step.name) {
      return sanitizeName(step.name);
    }
    // Handle self reference (.)
    if (step.axis === 'self') {
      return 'self';
    }
  }

  // Handle literal values
  if (node.value !== undefined) {
    // Handle numeric literals
    if (typeof node.value === 'object' && node.value._ !== undefined) {
      return node.value._;
    }
    // Handle string literals
    if (typeof node.value === 'string') {
      // Check if this is a string literal with quotes (valueDisplay contains the quoted version)
      if (node.valueDisplay) {
        return node.valueDisplay;
      }
      // For plain string values without quotes, return as-is
      return node.value;
    }
  }

  throw new Error(`Unsupported node structure: ${JSON.stringify(node)}`);
}

/**
 * Convert XPath expression to LimeSurvey Expression Manager syntax
 *
 * @param xpathExpr - The XPath expression to convert
 * @returns LimeSurvey Expression Manager syntax, or null if conversion fails
 */
export async function xpathToLimeSurvey(xpathExpr: string): Promise<string> {
  if (!xpathExpr || xpathExpr.trim() === '') {
    return '1'; // Default relevance expression
  }

  // Preprocess XLSForm template syntax to standard XPath
  let processedExpr = xpathExpr;

  // Convert ${field} to field references
  processedExpr = processedExpr.replace(/\$\{(\w+)\}/g, (match: string, fieldName: string) => {
    return sanitizeName(fieldName);
  });

  // Convert selected(${field}, 'value') to selected(field, 'value')
  processedExpr = processedExpr.replace(
    /selected\(\s*\$\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
    (match: string, fieldName: string, value: string) => {
      return `selected(${sanitizeName(fieldName)}, '${value}')`;
    }
  );

  try {
    // Dynamic import of js-xpath
    const JXpathModule = await import('js-xpath');
    const parsed = (JXpathModule as any).default.parse(processedExpr) as XPathNode;
    return transpile(parsed);
  } catch (error: unknown) {
    console.error(`Transpilation error: ${(error as Error).message}`);
    return '1';
  }
}

/**
 * Convert XPath constraint to LimeSurvey validation pattern
 *
 * @param constraint - The XPath constraint expression
 * @returns Validation pattern (regex or EM equation)
 */
export async function convertConstraint(constraint: string): Promise<string> {
  if (!constraint) return '';

  try {
    // Preprocess the expression to handle field references and special cases
    let processedExpr = constraint;

    // Convert ${field} to field references
    processedExpr = processedExpr.replace(/\$\{(\w+)\}/g, (match: string, fieldName: string) => {
      return sanitizeName(fieldName);
    });

    // Convert selected(${field}, 'value') to selected(field, 'value')
    processedExpr = processedExpr.replace(
      /selected\(\s*\$\{(\w+)\}\s*,\s*['"]([^'"]+)['"]\s*\)/g,
      (match: string, fieldName: string, value: string) => {
        return `selected(${sanitizeName(fieldName)}, '${value}')`;
      }
    );

    // Special handling for regexMatch function
    const regexMatchPattern = /regexMatch\(\s*([^)]+)\s*\)/;
    const regexMatchMatch = processedExpr.match(regexMatchPattern);
    
    if (regexMatchMatch) {
      // Parse the regexMatch arguments
      const args = parseRegexMatchArguments(regexMatchMatch[1]);
      if (args.length >= 2) {
        const [firstArg, secondArg] = args;
        
        // Check if the first argument looks like a logical expression (contains operators)
        const logicalOperators = ['>=', '<=', '>', '<', '=', '!=', 'and', 'or'];
        const isLogicalExpression = logicalOperators.some(op => 
          firstArg.includes(op) && 
          // Make sure it's not part of a regex pattern (e.g., [0-9])
          !(firstArg.includes('[') && firstArg.includes(']'))
        );
        
        if (isLogicalExpression) {
          // Extract the logical expression and return it
          return firstArg.replace(/^"|"$/g, ''); // Remove quotes
        } else {
          // Check if this is a valid regexMatch call (pattern first, field second)
          // If the second argument looks like a field reference and first like a pattern, handle it
          const isFieldReference = secondArg === '.' || /^\w+$/.test(secondArg);
          const looksLikePattern = firstArg.includes('^') || firstArg.includes('$') || 
                                  (firstArg.includes('[') && firstArg.includes(']'));
          
          if (isFieldReference && looksLikePattern) {
            // Handle as a real regexMatch function
            // Convert . to self in the field argument
            const processedFieldArg = secondArg.replace(/\./g, 'self');
            // Convert double quotes to single quotes for consistency
            const processedPatternArg = firstArg.replace(/^"|"$/g, "'")
              .replace(/\\'/g, "'"); // Handle escaped quotes
            return `regexMatch(${processedPatternArg}, ${processedFieldArg})`;
          } else {
            // Invalid argument order or unsupported pattern
            return '';
          }
        }
      }
    }

    // Parse and transpile using AST
    const JXpathModule = await import('js-xpath');
    const parsed = (JXpathModule as any).default.parse(processedExpr) as XPathNode;
    const converted = transpile(parsed);

    if (converted && converted !== '1') {
      return converted;
    }
  } catch (error: unknown) {
    console.debug(`AST transpilation failed for constraint: ${constraint}, error: ${(error as Error).message}`);
    // Return empty string if AST transpilation fails
    return '';
  }

  // If all else fails, return empty
  return '';
}

/**
 * Parse arguments from a regexMatch function call
 * Handles quoted strings and field references
 */
function parseRegexMatchArguments(argsString: string): string[] {
  const args: string[] = [];
  let currentArg = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if ((char === '"' || char === "'") && (i === 0 || argsString[i - 1] !== '\\')) {
      if (!inQuotes) {
        // Start of quoted string
        inQuotes = true;
        quoteChar = char;
        currentArg += char;
      } else if (char === quoteChar) {
        // End of quoted string
        inQuotes = false;
        currentArg += char;
      } else {
        currentArg += char;
      }
    } else if (char === '(' && !inQuotes) {
      parenDepth++;
      currentArg += char;
    } else if (char === ')' && !inQuotes) {
      parenDepth--;
      currentArg += char;
    } else if (char === ',' && !inQuotes && parenDepth === 0) {
      // Argument separator
      args.push(currentArg.trim());
      currentArg = '';
    } else {
      currentArg += char;
    }
  }

  // Add the last argument
  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }

  return args;
}

/**
 * Convert XPath relevance expression to LimeSurvey Expression Manager syntax
 *
 * @param xpath - The XPath relevance expression
 * @returns LimeSurvey Expression Manager syntax
 */
export async function convertRelevance(xpathExpr: string): Promise<string> {
  if (!xpathExpr) return '1';

  // Preprocess: normalize operators to lowercase for jsxpath compatibility
  let normalizedXPath = xpathExpr
    .replace(/\bAND\b/gi, 'and')
    .replace(/\bOR\b/gi, 'or');

  const result = await xpathToLimeSurvey(normalizedXPath);

  // Handle edge case: selected() with just {field} (without $)
  if (result && result.includes('selected(')) {
    return result.replace(
      /selected\s*\(\s*\{(\w+)\}\s*,\s*["']([^'"]+)["']\s*\)/g,
      (_match: string, fieldName: string, value: string) => {
        return `(${sanitizeName(fieldName)}="${value}")`;
      }
    );
  }

  return result || '1';
}