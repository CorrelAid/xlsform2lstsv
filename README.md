# xform2lstsv

Convert XLSForm surveys to LimeSurvey TSV format. 

- This package is still WIP and not all features of xform have been verified. 
- Currently only compatibility starting at Limesurvey `6.16.4` verified 

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

## Integration Testing

Integration tests verify that generated TSV files can be successfully imported into LimeSurvey.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [uv](https://docs.astral.sh/uv/) Python package manager

### Quick Start

```bash
# 1. Start LimeSurvey (first time only)
npm run test:integration:setup

# 2. Generate TSV files from fixtures and run tests
npm run test:integration:full

# 3. Stop LimeSurvey when done
npm run test:integration:teardown
```

### Available Commands

- `npm run fixtures:generate` - Generate TSV files from JSON fixtures in `tests/fixtures/`
- `npm run test:integration` - Run integration tests on generated files
- `npm run test:integration:full` - Generate fixtures + run tests
- `npm run test:all` - Run unit tests + integration tests

### Adding Test Fixtures

1. Create a JSON file in `tests/fixtures/` with your XLSForm data:
   ```json
   {
     "survey": [{"type": "text", "name": "q1", "label": "Question 1"}],
     "choices": [],
     "settings": [{"form_title": "My Survey", "form_id": "my_survey"}]
   }
   ```

2. Run `npm run test:integration:full` to generate and test

### Manual Testing

Access LimeSurvey UI while Docker is running:
- URL: http://localhost:8080/admin
- Username: `admin`
- Password: `admin`

### Troubleshooting

**No TSV files generated?** Check your JSON fixtures are valid and run `npm run build` first.

**LimeSurvey connection errors?** Ensure Docker is running and wait 15-30 seconds after `npm run test:integration:setup`.

**Import fails?** Verify TSV format and ensure question types are supported by LimeSurvey.

## Development

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build
npm run build

# Run integration tests (requires Docker)
npm run test:integration:setup  # Start LimeSurvey
npm run test:integration:full   # Generate fixtures and test
npm run test:integration:teardown  # Stop LimeSurvey
```

## Verifying new versions of lime survey

1. Has the LimeSurvey import code changed? 
  - If no, no changes necessary.

## Limesurvey Resources

- Limesurvey TSV Import Code: https://github.com/LimeSurvey/LimeSurvey/blob/50870a0767a3b132344a195bcaa354be82eecddf/application/helpers/admin/import_helper.php#L3836
- Limesurvey DB Structure: https://github.com/LimeSurvey/LimeSurvey/blob/master/installer/create-database.php
- https://www.limesurvey.org/manual/Expression_Manager#Access_to_Variables
- https://www.limesurvey.org/manual/ExpressionScript_-_Presentation
- https://www.limesurvey.org/blog/tutorials/creating-limesurvey-questionnaires-in-micorsoft-excel
- https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure

