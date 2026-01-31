#!/usr/bin/env node
/**
 * Generate TSV files from XLSForm fixtures for integration testing.
 *
 * This script:
 * 1. Reads XLSForm JSON fixtures from tests/fixtures/
 * 2. Converts them to LimeSurvey TSV format
 * 3. Saves output to tests/integration/output/
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { SurveyRow, ChoiceRow, SettingsRow } from './config/types';
import { XLSFormToTSVConverter } from './xlsformConverter';

interface XLSFormFixture {
  survey: SurveyRow[];
  choices: ChoiceRow[];
  settings: SettingsRow[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../tests/fixtures');
const OUTPUT_DIR = path.join(__dirname, '../tests/integration/output');

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

function generateTSVFromFixture(fixturePath: string, outputPath: string): void {
  console.log(`Processing: ${path.basename(fixturePath)}`);

  // Read fixture
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  const fixture: XLSFormFixture = JSON.parse(fixtureContent) as XLSFormFixture;

  // Convert to TSV with configuration that removes underscores but doesn't truncate field names
  // This matches LimeSurvey's behavior (removes underscores but allows longer field names)
  // Answer codes are already limited to 5 chars in the fixtures
  const converter = new XLSFormToTSVConverter({});
  const tsv = converter.convert(
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

function main(): void {
  console.log('Generating TSV files from XLSForm fixtures...\n');

  // Ensure output directory exists and clean old files
  ensureDirectoryExists(OUTPUT_DIR);
  cleanOutputDirectory(OUTPUT_DIR);
  console.log('Cleaned output directory\n');

  // Find all JSON fixtures
  const fixtureFiles = fs.readdirSync(FIXTURES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(FIXTURES_DIR, file));

  if (fixtureFiles.length === 0) {
    console.error('No fixture files found in', FIXTURES_DIR);
    process.exit(1);
  }

  // Generate TSV for each fixture
  let successCount = 0;
  for (const fixturePath of fixtureFiles) {
    const baseName = path.basename(fixturePath, '.json');
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.tsv`);

    try {
      generateTSVFromFixture(fixturePath, outputPath);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Error processing ${baseName}:`, error);
    }
    console.log('');
  }

  console.log(`\nFinal Summary: ${successCount}/${fixtureFiles.length} files generated successfully`);
  
  // Verify we have all expected fixtures
  const expectedFixtures = ['basic_survey', 'complex_survey', 'complex_xpath_survey', 'validation_relevance_survey'];
  const generatedFixtures = fixtureFiles.map(f => path.basename(f, '.json'));
  
  expectedFixtures.forEach(expected => {
    if (!generatedFixtures.includes(expected)) {
      console.warn(`⚠ Expected fixture ${expected} was not found`);
    }
  });

  if (successCount < fixtureFiles.length) {
    process.exit(1);
  }
}
main();
