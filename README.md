[![CI Status](https://github.com/CorrelAid/xlsform2lstsv/actions/workflows/ci.yml/badge.svg)](https://github.com/CorrelAid/xlsform2lstsv/actions)
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

- Hints (normal) ✅

- `label` and `hint` translations ✅

- XPath -> ExpressionScript/EM 🟡
  - see src/converters/xpathTranspiler.ts for how operators and functions are mapped
  - its a complex task to ensure the transpiler covers everything and we currently cannot guarantee error free/complete transpiling 

- constraint_message ❌
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

This project uses **automated semantic versioning releases** via GitHub Actions with npm provenance support.

### Release Process

The release process is fully automated and follows these steps:

1. **Version Bumping**: Use npm version commands to bump the version:
   ```bash
   # Choose the appropriate version bump type:
   npm run version:major  # For breaking changes (e.g., 1.2.1 → 2.0.0)
   npm run version:minor  # For new features (e.g., 1.2.1 → 1.3.0)
   npm run version:patch  # For bug fixes (e.g., 1.2.1 → 1.2.2)
   ```
   
   This will:
   - Update `package.json` version
   - Update `package-lock.json` version
   - Create a git commit with message "chore: bump to X.Y.Z"
   - Create an annotated git tag `vX.Y.Z`

2. **Trigger Release**: Push the tag to trigger the GitHub Actions release workflow:
   ```bash
   git push origin vX.Y.Z
   # OR to push all tags, which also pushes the version bump commit
   git push --tags
   # OR to push the current branch and its associated tags (like after npm version)
   git push --follow-tags
   ```

3. **Automated CI/CD Pipeline**: The GitHub Actions workflow (`.github/workflows/ci.yml`) will:
   - ✅ Run all unit tests with coverage
   - ✅ Execute linting checks
   - ✅ Build the TypeScript project
   - ✅ Verify version consistency across files
   - ✅ Generate npm provenance attestations
   - ✅ Publish to npm registry with `--provenance=always`
   - ✅ Verify successful publication

### Release Requirements

- **GitHub Secrets**: `NPM_TOKEN` must be configured in repository secrets
- **Tag Format**: Tags must follow `v*` pattern (e.g., `v1.2.1`)
- **Branch**: Releases are triggered from any branch when tags are pushed
- **npm Access**: Package is published with `--access public`

### Manual Release (Alternative)

If you need to manually trigger a release for an existing tag:
```bash
# Force push an existing tag to trigger release
git tag -d vX.Y.Z           # Delete local tag
git push origin :refs/tags/vX.Y.Z  # Delete remote tag
git tag -a vX.Y.Z -m "chore(release): X.Y.Z"  # Recreate tag
git push origin vX.Y.Z      # Push to trigger release
```

### Post-Release

After successful release:
- ✅ Package is available on [npm](https://www.npmjs.com/package/xlsform2lstsv)
- ✅ GitHub release is automatically created
- ✅ Version badge updates automatically
- ✅ Release notes link is provided in workflow logs

### Troubleshooting

**Workflow fails with "repository not found"**:
- Check that all GitHub Actions in the workflow use correct names/versions
- Example fix: `actions/attest-build@v2` → `actions/attest@v1`

**Tag exists but release doesn't trigger**:
- Force push the tag to trigger a new workflow run
- Ensure tag follows `v*` pattern exactly

**Version mismatch errors**:
- Run `npm run sync-version` to synchronize version across all files
- Check `package.json`, `package-lock.json`, and `src/config/version.ts`

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

