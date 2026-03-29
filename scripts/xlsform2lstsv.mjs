#!/usr/bin/env node

/**
 * Simple CLI for converting XLSForm to LimeSurvey TSV format
 * Usage: node scripts/xlsform2lstsv.mjs input.xlsx output.tsv
 */

import { XLSFormParser } from '../dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Check if input and output files are provided
if (process.argv.length !== 4) {
    console.log('Usage: node scripts/xlsform2lstsv.mjs input.xlsx output.tsv');
    console.log('Example: node scripts/xlsform2lstsv.mjs survey.xlsx survey.tsv');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Convert to absolute paths
const absInputFile = resolve(projectRoot, inputFile);
const absOutputFile = resolve(projectRoot, outputFile);

async function convert() {
    try {
        console.log(`📖 Reading XLSForm from: ${absInputFile}`);
        
        // Read the file data first
        const fileData = fs.readFileSync(absInputFile);
        
        // Use the data-based conversion method which works reliably
        const tsv = await XLSFormParser.convertXLSDataToTSV(fileData);
        
        console.log(`💾 Writing TSV to: ${absOutputFile}`);
        fs.writeFileSync(absOutputFile, tsv);
        
        console.log('✅ Conversion successful!');
        console.log(`📄 Output file: ${absOutputFile}`);
        
    } catch (error) {
        console.error('❌ Conversion failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

convert();
