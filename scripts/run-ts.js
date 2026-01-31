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
const outputPath = resolve(__dirname, `${scriptName}.js`);

try {
  // Compile the TypeScript file
  console.log(`🔧 Compiling ${scriptName}.ts...`);
  execSync(`npx tsc --esModuleInterop --moduleResolution node --module ES2020 --target ES2020 --outDir ${__dirname} ${scriptPath}`, {
    stdio: 'inherit'
  });
  
  // Run the compiled JavaScript file
  console.log(`⚡ Running ${scriptName}.js...`);
  execSync(`node ${outputPath}`, {
    stdio: 'inherit'
  });
  
  // Clean up the compiled file
  // execSync(`rm ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error running script:', error.message);
  process.exit(1);
}