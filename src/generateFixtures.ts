#!/usr/bin/env node
/**
 * Generate TSV files from XLSForm fixtures for integration testing.
 *
 * This script:
 * 1. Reads XLSForm JSON and XLSX fixtures from docker_tests/fixtures/
 * 2. Converts them to LimeSurvey TSV format
 * 3. Saves output to docker_tests/integration/output/
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { SurveyRow, ChoiceRow, SettingsRow, ConversionConfig } from './config/types.js';
import { XLSLoader } from './processors/XLSLoader.js';
import { XLSFormToTSVConverter } from './xlsformConverter.js';

interface XLSFormFixture {
  survey: SurveyRow[];
  choices: ChoiceRow[];
  settings: SettingsRow[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../docker_tests/fixtures');
const OUTPUT_DIR = path.join(__dirname, '../docker_tests/integration/output');

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanOutputDirectory(dir: string): void {
  if (fs.existsSync(dir)) {
    // Remove all .tsv files in the output directory
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.tsv')) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
}

async function generateTSVFromFixture(fixturePath: string, outputPath: string, config: Partial<ConversionConfig> = {}): Promise<void> {
  console.log(`Processing: ${path.basename(fixturePath)}`);

  // Read fixture
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  const fixture: XLSFormFixture = JSON.parse(fixtureContent) as XLSFormFixture;

  // Convert to TSV with configuration that removes underscores but doesn't truncate field names
  // This matches LimeSurvey's behavior (removes underscores but allows longer field names)
  // Answer codes are already limited to 5 chars in the fixtures
  const converter = new XLSFormToTSVConverter(config);
  const tsv = await converter.convert(
    fixture.survey,
    fixture.choices,
    fixture.settings
  );

  // Write output
  fs.writeFileSync(outputPath, tsv, 'utf-8');
  console.log(`  → Generated: ${path.basename(outputPath)}`);

  // Print stats
  const lines = tsv.split('\n').filter(l => l.trim()).length;
  console.log(`  → ${lines} rows (including header)`);
}

async function generateTSVFromXLSX(xlsxPath: string, outputPath: string): Promise<void> {
  console.log(`Processing: ${path.basename(xlsxPath)}`);

  // Read and parse xlsx file
  const fileData = fs.readFileSync(xlsxPath);
  const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(fileData, { skipValidation: true });

  // Convert to TSV
  const converter = new XLSFormToTSVConverter({});
  const tsv = await converter.convert(surveyData, choicesData, settingsData);

  // Write output
  fs.writeFileSync(outputPath, tsv, 'utf-8');
  console.log(`  → Generated: ${path.basename(outputPath)}`);

  // Print stats
  const lines = tsv.split('\n').filter(l => l.trim()).length;
  console.log(`  → ${lines} rows (including header)`);
}

async function main(): Promise<void> {
  console.log('Generating TSV files from XLSForm fixtures...\n');

  // Ensure output directory exists and clean old files
  ensureDirectoryExists(OUTPUT_DIR);
  cleanOutputDirectory(OUTPUT_DIR);
  console.log('Cleaned output directory\n');

  // Find all JSON fixtures
  const jsonFiles = fs.readdirSync(FIXTURES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(FIXTURES_DIR, file));

  // Find all XLSX fixtures
  const xlsxFiles = fs.readdirSync(FIXTURES_DIR)
    .filter(file => file.endsWith('.xlsx'))
    .map(file => path.join(FIXTURES_DIR, file));

  const totalFiles = jsonFiles.length + xlsxFiles.length;
  if (totalFiles === 0) {
    console.error('No fixture files found in', FIXTURES_DIR);
    process.exit(1);
  }

  // Generate TSV for each JSON fixture
  let jsonSuccessCount = 0;
  for (const fixturePath of jsonFiles) {
    const baseName = path.basename(fixturePath, '.json');
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.tsv`);

    try {
      await generateTSVFromFixture(fixturePath, outputPath);
      jsonSuccessCount++;
    } catch (error) {
      console.error(`  ✗ Error processing ${baseName}:`, error);
    }
    console.log('');
  }

  // Generate settings variant: same fixture with all conversion settings disabled
  const settingsFixturePath = path.join(FIXTURES_DIR, 'settings_survey.json');
  if (fs.existsSync(settingsFixturePath)) {
    const variantPath = path.join(OUTPUT_DIR, 'settings_survey_disabled.tsv');
    try {
      await generateTSVFromFixture(settingsFixturePath, variantPath, {
        convertWelcomeNote: false,
        convertEndNote: false,
        convertOtherPattern: false,
        convertMarkdown: false,
      });
      jsonSuccessCount++;
    } catch (error) {
      console.error('  ✗ Error processing settings_survey_disabled:', error);
    }
    console.log('');
  }

  // Generate TSV for each XLSX fixture
  // XLSX files may contain unimplemented types (e.g. range) — failures are logged but not fatal
  let xlsxSuccessCount = 0;
  for (const xlsxPath of xlsxFiles) {
    const baseName = path.basename(xlsxPath, '.xlsx');
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.tsv`);

    try {
      await generateTSVFromXLSX(xlsxPath, outputPath);
      xlsxSuccessCount++;
    } catch (error) {
      console.warn(`  ⚠ Skipped ${baseName}:`, (error as Error).message);
    }
    console.log('');
  }

  const totalSuccess = jsonSuccessCount + xlsxSuccessCount;
  console.log(`\nFinal Summary: ${totalSuccess}/${totalFiles} files generated successfully`);

  // Only fail if JSON fixtures (which should always succeed) had errors
  if (jsonSuccessCount < jsonFiles.length) {
    process.exit(1);
  }
}
void (async () => {
  await main();
})();
