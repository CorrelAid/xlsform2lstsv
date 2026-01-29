[![CI Status](https://github.com/your-repo/xlsform2lstsv/actions/workflows/ci.yml/badge.svg)](https://github.com/your-repo/xlsform2lstsv/actions)
[![npm version](https://badge.fury.io/js/xlsform2lstsv.svg)](https://badge.fury.io/js/xlsform2lstsv)
[![Code Coverage](https://img.shields.io/codecov/c/github/your-repo/xlsform2lstsv)](https://codecov.io/gh/your-repo/xlsform2lstsv)

# xlsform2lstsv

Convert XLSForm surveys to LimeSurvey TSV format. 

[!WARNING]  

- This package is still WIP and not all features of xlsform have been implemented and verified.
- While importing is tested in an automated fashion (see `scripts/test-compatibility-safe.ts`), this only verifies whether all questions were successfully imported, but not if e.g. validation and relevance expressions were transformed correctly. To be safe, always use the "Survey logic view" in the LimeSurvey GUI.
- If you want question and choice names to be the same in LimeSurvey, make them <=5 chars (this is a LimeSurvey requiremtn)


## Implemented features

- Question Types and Choices (see `src/processors/TypeMapper.ts` for how this library maps XLSForm types to LimeSurvey types)
  - everything but the types specified in `UNIMPLEMENTED_TYPES` in `src/xlsformConverter.ts`
  - record types ❌ (start, end, today, device_id, username, phonenumber, email)

- Settings sheet 
  - -> LS Survey Global Parameters (only name of survey)  ✅
  - -> Survey Language-Specific Parameters (default language is first row, other rows are extracted from label translations)  ✅

- Question Groups  ✅
  - Group level relevance ✅

- Hints (normal) ✅

- `label` and `hint` translations ✅

- XPath -> ExpressionScript/EM 🟡
  - xlsform constraint -> limesurvey validation
    - can only contain self-references (".", no variables) 
    - all xpath operators mentioned [here](https://getodk.github.io/xforms-spec/#xpath-operators)
    - xpath functions: 
      - boolean:
        - `regex()`, 
        - `not()`
      - string:
        - `contains()` 
  - relevant -> relevance

- XLSForms Calculation ❌
- XLSForms Trigger ❌
- Repeats ❌
- LimeSurvey Assessments ❌
- LimeSurvey Quotas ❌
- LimeSurvey Quota language settings ❌
- LimeSurvey Quota members ❌
- XLSForms Appearances ❌
- Additional columns ❌
- guidance_hint ❌

## Installation

```bash
npm install xlsform2lstsv
```

## Quick Start

The XFormParser provides direct XLS/XLSX file support:

```typescript
import { XFormParser } from 'xlsform2lstsv';

// Parse XLS/XLSX file and convert to TSV
const tsv = await XFormParser.convertXLSFileToTSV('path/to/survey.xlsx');

// Or parse XLS/XLSX data directly
const xlsxData = fs.readFileSync('path/to/survey.xlsx');
const tsv = await XFormParser.convertXLSDataToTSV(xlsxData);
```

**Methods:**
- `convertXLSFileToTSV(filePath, config)`: Direct conversion from file
- `convertXLSDataToTSV(data, config)`: Direct conversion from buffer
- `parseXLSFile(filePath)`: Parse to structured arrays
- `parseXLSData(data)`: Parse buffer to structured arrays

### Using Arrays 

A different entry point accepts XLSForm data as JavaScript arrays:

```typescript
import { XLSFormToTSVConverter } from 'xlsform2lstsv';

const converter = new XLSFormToTSVConverter();
const tsv = converter.convert(surveyData, choicesData, settingsData);
```

**Parameters:**
- `surveyData`: Array of survey rows (questions, groups, etc.)
- `choicesData`: Array of choice/option data  
- `settingsData`: Array of survey settings

**Returns:** TSV string suitable for LimeSurvey import

## Development Setup

### Prerequisites

- see `package.json`
- Docker and Docker Compose (for integration testing)
- Python 3.9+ with uv package manager (for integration testing)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-repo/xlsform2lstsv.git
cd xlsform2lstsv

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

**Running Tests**:
```bash
# Run all unit tests
npm test

# Run tests with watch mode 
npm test -- --watch

# Run specific test file
npm test -- src/test/textTypes.test.ts

# Run tests with coverage report
npm test -- --coverage

# Debug specific test
npm test -- --debug src/test/numericTypes.test.ts
```


### Integration Testing

Integration tests verify that generated TSV files can be successfully imported into LimeSurvey.

To test all versions specified in `scripts/src/config/version.js`:

```bash
npm run test-compatibility
```

To test specific versions, set the `SPECIFIC_VERSIONS` environment variable:

```bash
SPECIFIC_VERSIONS="6.16.4,6.17.0" npm run test-compatibility
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



## Limesurvey Resources

- Limesurvey TSV Import Code: https://github.com/LimeSurvey/LimeSurvey/blob/50870a0767a3b132344a195bcaa354be82eecddf/application/helpers/admin/import_helper.php#L3836
- Limesurvey DB Structure: https://github.com/LimeSurvey/LimeSurvey/blob/master/installer/create-database.php
- LimeSurvey Expressions: 
    - https://github.com/LimeSurvey/LimeSurvey/blob/master/assets/packages/expressions/em_javascript.js
    - https://www.limesurvey.org/manual/ExpressionScript_examples
    - https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
    - https://www.limesurvey.org/manual/Expression_Manager
    - https://www.limesurvey.org/manual/ExpressionScript_for_developers
- https://www.limesurvey.org/manual/Expression_Manager#Access_to_Variables
- https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
- https://www.limesurvey.org/blog/tutorials/creating-limesurvey-questionnaires-in-micorsoft-excel
- https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure

