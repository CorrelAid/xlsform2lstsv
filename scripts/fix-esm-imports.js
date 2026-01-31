#!/usr/bin/env node

/**
 * Post-build script to fix ES module imports by adding .js extensions
 * This is needed because Node.js ES modules require file extensions in import statements
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace all import/export statements without extensions
  // Pattern: from './some/path' or from '../some/path'
  // Also handles: export { ... } from './some/path'
  content = content.replace(/((?:from|export.*from)\s+['"])(\.\.?\/[^'"]+)(['"])/g, (match, prefix, importPath, suffix) => {
    // Don't add .js if it already has a file extension (like .json, .ts, etc.)
    // But do add .js if it's just a path like './some/path'
    const hasExtension = importPath.match(/\.[a-z]+$/i) && !importPath.endsWith('/');
    if (hasExtension) {
      return match;
    }
    return `${prefix}${importPath}.js${suffix}`;
  });
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map')) {
      console.log(`Processing: ${filePath}`);
      fixImportsInFile(filePath);
    }
  }
}

console.log('Fixing ES module imports...');
processDirectory(DIST_DIR);
console.log('✓ ES module imports fixed');