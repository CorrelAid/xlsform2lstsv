import { describe, test, expect } from 'vitest';
import xpath from 'js-xpath';


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
function transpile(node) {
  if (!node) return '';

  // Handle function calls (jsxpath returns objects with 'id' property)
  if (node.id) {
    switch (node.id) {
      case 'count':
        return `count(${node.args.map(arg => transpile(arg)).join(', ')})`;
      case 'concat':
        return node.args.map(arg => transpile(arg)).join(' + ');
      case 'regex':
        return `regex(${node.args.map(arg => transpile(arg)).join(', ')})`;
      case 'contains':
        return `contains(${node.args.map(arg => transpile(arg)).join(', ')})`;
      default:
        throw new Error(`Unsupported function: ${node.id}`);
    }
  }
  
  // Handle binary operations (jsxpath returns objects with 'type' property)
  if (node.type) {
    switch (node.type) {
      case '<=':
        return `${transpile(node.left)} <= ${transpile(node.right)}`;
      case '>=':
        return `${transpile(node.left)} >= ${transpile(node.right)}`;
      case '=':
      case '==':
        return `${transpile(node.left)} == ${transpile(node.right)}`;
      case '!=':
        return `${transpile(node.left)} != ${transpile(node.right)}`;
      case '<':
        return `${transpile(node.left)} < ${transpile(node.right)}`;
      case '>':
        return `${transpile(node.left)} > ${transpile(node.right)}`;
      case 'and':
        return `${transpile(node.left)} and ${transpile(node.right)}`;
      case 'or':
        return `${transpile(node.left)} or ${transpile(node.right)}`;
      default:
        throw new Error(`Unsupported operator: ${node.type}`);
    }
  }
  
  // Handle variable references (jsxpath returns step objects)
  if (node.steps && node.steps.length > 0) {
    const step = node.steps[0];
    if (step.name) {
      return step.name;
    }
    // Handle self reference (.)
    if (step.axis === 'self') {
      return 'self';
    }
  }
  
  // Handle literal values
  if (node.value !== undefined) {
    // Handle numeric literals
    if (node.value._ !== undefined) {
      return node.value._;
    }
    // Handle string literals
    if (typeof node.value === 'string') {
      // Check if the string needs quotes based on the original expression
      // For now, return as-is since jsxpath already handles the string formatting
      return node.value;
    }
  }
  
  throw new Error(`Unsupported node structure: ${JSON.stringify(node)}`);
}

function xpathToLimeSurvey(xpathExpr) {
  try {
    const parsed = xpath.parse(xpathExpr);
    return transpile(parsed);
  } catch (error) {
    console.error(`Transpilation error: ${error.message}`);
    return null;
  }
}


describe('AST parsing', () => {
  test('should parse simple xpath expressions', () => {
    const xpathExpr = "concat(b, c)";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('b + c');
  });

  test('should parse count function', () => {
    const xpathExpr = "count(a)";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('count(a)');
  });

  test('should parse comparison expressions', () => {
    const xpathExpr = ". <= 150";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('self <= 150');
  });

  test('should parse greater than or equal comparison', () => {
    const xpathExpr = ". >= 18";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('self >= 18');
  });

  test('should parse equality comparison', () => {
    const xpathExpr = "a = 'yes'";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe("a == yes");
  });

  test('should parse complex boolean expressions', () => {
    const xpathExpr = ". > 20 and . < 200";
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('self > 20 and self < 200');
  });

  test('should parse regex function', () => {
    const xpathExpr = 'regex(., "\\p{L}+")';
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('regex(self, \\p{L}+)');
  });

  test('should parse contains function', () => {
    const xpathExpr = 'contains(., "prohibited")';
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('contains(self, prohibited)');
  });
});
