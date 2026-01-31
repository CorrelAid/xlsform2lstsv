#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the script name from command line arguments
const scriptName = process.argv[2];

if (!scriptName) {
  console.error('❌ Usage: node run-ts.js <script-name-without-extension>');
  process.exit(1);
}

const scriptPath = resolve(__dirname, `${scriptName}.ts`);

try {
  // Run the TypeScript file using ts-node with explicit ES module configuration
  console.log(`⚡ Running ${scriptName}.ts with ts-node...`);
  execSync(`npx ts-node --esm --experimental-specifier-resolution=node --project tsconfig.json ${scriptPath}`, {
    stdio: 'inherit'
  });
  
} catch (error) {
  console.error('❌ Error running script:', error.message);
  process.exit(1);
}