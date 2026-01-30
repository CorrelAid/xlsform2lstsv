import { describe, test, expect } from 'vitest';
import { xpathToLimeSurvey } from '../../converters/xpathTranspiler';


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
    expect(limeSurveyExpr).toBe("a == 'yes'");
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
    expect(limeSurveyExpr).toBe('regexMatch(self, "\\p{L}+")');
  });

  test('should parse contains function', () => {
    const xpathExpr = 'contains(., "prohibited")';
    const limeSurveyExpr = xpathToLimeSurvey(xpathExpr);

    console.log(limeSurveyExpr);
    expect(limeSurveyExpr).toBe('contains(self, "prohibited")');
  });
});