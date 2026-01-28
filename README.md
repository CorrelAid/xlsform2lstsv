[![CI Status](https://github.com/your-repo/xform2lstsv/actions/workflows/ci.yml/badge.svg)](https://github.com/your-repo/xform2lstsv/actions)
[![npm version](https://badge.fury.io/js/xform2lstsv.svg)](https://badge.fury.io/js/xform2lstsv)
[![Code Coverage](https://img.shields.io/codecov/c/github/your-repo/xform2lstsv)](https://codecov.io/gh/your-repo/xform2lstsv)

# xform2lstsv

Convert XLSForm surveys to LimeSurvey TSV format. 

- This package is still WIP and not all features of xform have been verified. 


## Installation

```bash
npm install xform2lstsv
```

## Quick Start

```typescript
import { XLSFormToTSVConverter } from 'xform2lstsv';

const converter = new XLSFormToTSVConverter();
const tsv = converter.convert(surveyData, choicesData, settingsData);
```


## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+ or yarn 1.22+
- Docker and Docker Compose (for integration testing)
- Python 3.9+ with uv package manager (for integration testing)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-repo/xform2lstsv.git
cd xform2lstsv

# Install Node.js dependencies
npm install

# Install Git hooks (automatic on npm install)
npx husky install

# Build the project
npm run build
```

### Development Tools

- **TypeScript**: Primary language
- **Vitest**: Unit testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks management
- **Commitlint**: Commit message validation

## Development Workflow

### Unit Testing

This project uses **Vitest** for unit testing with comprehensive coverage of all core functionality:

- **Test Location**: `src/test/` directory
- **Test Files**: Organized by functionality (text types, numeric types, date/time types, etc.)
- **Coverage**: All major components and edge cases covered
- **Approach**: Test-Driven Development (TDD) recommended

**Key Test Categories**:
- `textTypes.test.ts` - Text question type conversions
- `numericTypes.test.ts` - Numeric question type handling
- `dateTimeTypes.test.ts` - Date and time question processing
- `selectTypes.test.ts` - Multiple choice and select question logic
- `groupsAndStructure.test.ts` - Survey structure and grouping
- `specialTypes.test.ts` - Special question types and edge cases
- `relevanceConverter.test.ts` - Relevance logic and expression conversion

**Running Tests**:
```bash
# Run all unit tests
npm test

# Run tests with watch mode (recommended for development)
npm test -- --watch

# Run specific test file
npm test -- src/test/textTypes.test.ts

# Run tests with coverage report
npm test -- --coverage

# Debug specific test
npm test -- --debug src/test/numericTypes.test.ts
```

**Test Structure Example**:
```typescript
import { describe, expect, it } from 'vitest';
import { XLSFormToTSVConverter } from '../index';

describe('Text Question Type Conversion', () => {
  const converter = new XLSFormToTSVConverter();
  
  it('should convert basic text question', () => {
    const survey = [{ type: 'text', name: 'q1', label: 'Question 1' }];
    const result = converter.convert(survey, [], []);
    
    expect(result).toContain('q1\tT\tQuestion 1');
  });
  
  it('should handle empty labels gracefully', () => {
    const survey = [{ type: 'text', name: 'q2', label: '' }];
    const result = converter.convert(survey, [], []);
    
    expect(result).toContain('q2\tT\t');
  });
});
```


### Integration Testing

Integration tests verify that generated TSV files can be successfully imported into LimeSurvey.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [uv](https://docs.astral.sh/uv/) Python package manager

#### Quick Start

```bash
# 1. Start LimeSurvey (first time only)
npm run test:integration:setup

# 2. Generate TSV files from fixtures and run tests
npm run test:integration:full

# 3. Stop LimeSurvey when done
npm run test:integration:teardown
```

#### Available Commands

- `npm run fixtures:generate` - Generate TSV files from JSON fixtures in `tests/fixtures/`
- `npm run test:integration` - Run integration tests on generated files
- `npm run test:integration:full` - Generate fixtures + run tests
- `npm run test:all` - Run unit tests + integration tests



### Testing Workflow

```bash
# Run unit tests
npm test

# Run unit tests with watch mode
npm test -- --watch

# Run specific test file
npm test -- src/test/textTypes.test.ts

# Run integration tests
npm run test:integration:setup    # Start LimeSurvey Docker
npm run test:integration:full    # Generate + test fixtures
npm run test:integration:teardown # Stop LimeSurvey

# Run all tests (unit + integration)
npm run test:all
```

### Code Quality

```bash
# Check commit message format
npm run lint:commits

# Check TypeScript types (via build)
npm run build

# Run tests with coverage
npm run test:coverage

# Clean build artifacts
npm run clean
```


### Pull Request Process

1. **Before creating PR**:
   - Ensure all tests pass: `npm run test:all`
   - Run full validation: `npm run validate`
   - Update documentation if needed

2. **Create PR**:
   - Target `main` branch
   - Use descriptive title following Conventional Commits
   - Include screenshots for UI changes
   - Reference related issues

3. **CI Checks**:
   - All tests must pass
   - Code coverage maintained
   - No linting errors
   - Commit messages valid

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`

**Scopes**: Component or area affected (e.g., `converter`, `types`, `integration`)

**Examples**:
```bash
# Good commit messages
git commit -m "feat(converter): add LimeSurvey 6.17.0 support"
git commit -m "fix(types): handle empty choice lists gracefully"
git commit -m "docs: update compatibility testing guide"
git commit -m "test(integration): add edge case for group validation"
```

## Compatibility Testing

Test compatibility with multiple LimeSurvey versions without modifying configuration:

```bash
# Test all supported versions (from config range)
npm run test-compatibility

# Test specific versions
SPECIFIC_VERSIONS="6.16.0,6.17.0,6.18.0" npm run test-compatibility

# Test single version
SPECIFIC_VERSIONS="6.17.3" npm run test-compatibility

# See compatibility report
cat COMPATIBILITY_REPORT.md
```

**Key Features**:
- ✅ **Non-destructive**: Does not modify version configuration
- ✅ **Automatic failure**: Exits with error code if any version fails
- ✅ **Detailed reporting**: Generates comprehensive compatibility report
- ✅ **CI Integration**: Runs automatically in GitHub Actions workflow

**How it works**:
1. Tests specified LimeSurvey versions against current xform2lstsv
2. Generates TSV files and runs integration tests for each version
3. Creates detailed compatibility report
4. Fails if any specified version is incompatible

See [COMPATIBILITY_TESTING.md](COMPATIBILITY_TESTING.md) for detailed instructions.

## Limesurvey Resources

- Limesurvey TSV Import Code: https://github.com/LimeSurvey/LimeSurvey/blob/50870a0767a3b132344a195bcaa354be82eecddf/application/helpers/admin/import_helper.php#L3836
- Limesurvey DB Structure: https://github.com/LimeSurvey/LimeSurvey/blob/master/installer/create-database.php
- https://www.limesurvey.org/manual/Expression_Manager#Access_to_Variables
- https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
- https://www.limesurvey.org/blog/tutorials/creating-limesurvey-questionnaires-in-micorsoft-excel
- https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure

