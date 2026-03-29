# XLSForm to LimeSurvey TSV CLI

This folder contains simple CLI tools for converting XLSForm files to LimeSurvey TSV format.

## Available CLI Tools

### 1. Node.js Script (`xlsform2lstsv.mjs`)

A modern ES Module script that uses the xlsform2lstsv package.

**Usage:**
```bash
node scripts/xlsform2lstsv.mjs input.xlsx output.tsv
```

**Example:**
```bash
node scripts/xlsform2lstsv.mjs survey.xlsx survey.tsv
```

### 2. Bash Wrapper (`xlsform2lstsv`)

A simple bash script that wraps the Node.js script for convenience.

**Usage:**
```bash
./scripts/xlsform2lstsv input.xlsx output.tsv
```

**Example:**
```bash
./scripts/xlsform2lstsv survey.xlsx survey.tsv
```

## Requirements

- Node.js 20+ (as required by the main package)
- The package must be built (`npm run build`)

## Features

- Converts XLSForm (.xlsx, .xls) files to LimeSurvey TSV format
- Handles all implemented XLSForm types (see main README for details)
- Supports multilingual surveys
- Validates input and provides helpful error messages
- Shows warnings for field name truncations and other transformations

## Error Handling

The CLI will:
- Show warnings for field names that exceed LimeSurvey limits (20 chars for questions, 5 chars for answers)
- Show warnings for duplicate answer codes that need to be resolved
- Fail with a clear error message for unimplemented XLSForm types
- Fail with a clear error message if the input file cannot be read

## Example Output

```
📖 Reading XLSForm from: /path/to/survey.xlsx
💾 Writing TSV to: /path/to/survey.tsv
✅ Conversion successful!
📄 Output file: /path/to/survey.tsv
```

## Notes

- The TSV output can be directly imported into LimeSurvey using the TSV import feature
- For large surveys, the conversion may take a few seconds
- The CLI uses the same conversion logic as the main library, so all features and limitations apply
