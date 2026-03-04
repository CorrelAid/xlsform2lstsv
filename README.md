[![npm version](https://img.shields.io/npm/v/xlsform2lstsv)](https://www.npmjs.com/package/xlsform2lstsv)


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
  - Nested groups: LimeSurvey does not support nested groups. Parent-only groups (groups that contain only child groups and no direct questions) are automatically flattened — their label is converted to a note question (type X) in the first child group.

- Hints (normal) ✅

- `label` and `hint` translations ✅

- XPath -> ExpressionScript/EM 🟡
  - see src/converters/xpathTranspiler.ts for how operators and functions are mapped
  - its a complex task to ensure the transpiler covers everything and we currently cannot guarantee error free/complete transpiling 

- constraint_message ❌
- XLSForms Calculation ✅ (`calculate` type → LimeSurvey Equation question `*`; `${var}` references in labels/hints converted to EM `{var}` syntax)
- XLSForms Trigger ❌
- Repeats ❌
- LimeSurvey Assessments ❌
- LimeSurvey Quotas ❌
- LimeSurvey Quota language settings ❌
- LimeSurvey Quota members ❌
- XLSForms Appearances 🟡
  - `multiline` on text questions → LimeSurvey type `T` (Long free text) ✅
  - `likert` on select_one → kept as `L` (no LimeSurvey visual equivalent) ✅
  - `label`/`list-nolabel` → LimeSurvey matrix question type `F` ✅
  - `field-list` on groups → silently ignored (format=A already shows everything on one page) ✅
  - Other appearances (e.g. `minimal`, `compact`, `horizontal`) trigger a warning and are ignored
- Additional columns ❌
- guidance_hint ❌

## Transformation defaults and limitations

XLSForm and LimeSurvey differ in how they model surveys. Some information is lost or transformed during conversion, and some defaults are applied:

- **Survey format**: The output defaults to "All in one" mode (`format=A`), displaying all groups and questions on a single page.
- **Nested groups**: LimeSurvey does not support nested groups. Parent-only groups (containing only child groups, no direct questions) are flattened — their label becomes a note question (type X) in the first child group.
- **Field name truncation**: LimeSurvey limits question codes to 20 characters and answer codes to 5 characters. Longer names are truncated (underscores removed first, then cut to length).
- **Record/metadata types**: XLSForm `start`, `end`, `today`, `deviceid` etc. are silently skipped — LimeSurvey handles these internally.
- **Appearances**: Most XLSForm `appearance` values have no LimeSurvey equivalent and are ignored (a warning is logged). Supported appearances: `multiline` on text questions maps to type `T` (Long free text); `likert` on select_one is accepted silently (stays type `L`); `label`/`list-nolabel` is converted to LimeSurvey's matrix question type (`F`); `field-list` on groups is a no-op since format=A already shows everything on one page.
- **Multilingual row ordering**: Rows are grouped by language within each group (all base-language rows first, then translations) to work around a LimeSurvey TSV importer bug that resets question ordering counters on translation rows.

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
git clone https://github.com/CorrelAid/xlsform2lstsv.git
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


### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

## Releasing

Pushing a `v*` tag to GitHub triggers automatic npm publishing via GitHub Actions.

### Steps

1. **Bump the version**:
   ```bash
   npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
   npm version minor   # 0.1.0 → 0.2.0 (new features)
   npm version major   # 0.1.0 → 1.0.0 (breaking changes)
   ```
   This updates `package.json` and `package-lock.json`, creates a commit, and creates a `vX.Y.Z` tag.

2. **Push the commit and tag**:
   ```bash
   git push && git push origin vX.Y.Z
   ```

3. **GitHub Actions** will build and publish the package to npm.

### Requirements

- `NPM_TOKEN` secret must be configured in the GitHub repository settings
- Tags must follow the `v*` pattern (e.g., `v0.2.0`)

## Limesurvey Resources

- Limesurvey TSV Import Code: https://github.com/LimeSurvey/LimeSurvey/blob/50870a0767a3b132344a195bcaa354be82eecddf/application/helpers/admin/import_helper.php#L3836
- Limesurvey DB Structure: https://github.com/LimeSurvey/LimeSurvey/blob/master/installer/create-database.php
- LimeSurvey Expressions: 
    - https://github.com/LimeSurvey/LimeSurvey/blob/0715c161c40d741da68fc670dd89d71026b37c07/application/helpers/expressions/em_core_helper.php
    - https://www.limesurvey.org/manual/ExpressionScript_examples
    - https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
    - https://www.limesurvey.org/manual/Expression_Manager
    - https://www.limesurvey.org/manual/ExpressionScript_for_developers
- https://www.limesurvey.org/manual/Expression_Manager#Access_to_Variables
- https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
- https://www.limesurvey.org/blog/tutorials/creating-limesurvey-questionnaires-in-micorsoft-excel
- https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure

