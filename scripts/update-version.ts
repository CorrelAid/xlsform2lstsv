import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface PackageJson {
  version: string;
  [key: string]: any;
}

function updateVersionFiles() {
  try {
    // Read package.json
    const packageJson: PackageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 Current version: ${currentVersion}`);
    
    // Update version.ts
    let versionTs = readFileSync('src/config/version.ts', 'utf-8');
    const updatedVersionTs = versionTs.replace(
      /xform2lstsv: "[^"]+"/,
      `xform2lstsv: "${currentVersion}"`
    );
    
    writeFileSync('src/config/version.ts', updatedVersionTs, 'utf-8');
    console.log(`✅ Updated src/config/version.ts to ${currentVersion}`);
    
    // Also update the README if it contains version info
    try {
      let readme = readFileSync('README.md', 'utf-8');
      const readmeUpdated = readme.replace(
        /xform2lstsv v?[0-9]+\.[0-9]+\.[0-9]+/g,
        `xform2lstsv v${currentVersion}`
      );
      
      if (readme !== readmeUpdated) {
        writeFileSync('README.md', readmeUpdated, 'utf-8');
        console.log(`✅ Updated README.md to ${currentVersion}`);
      }
    } catch (error) {
      console.log(`ℹ️  No version found in README.md or couldn't update`);
    }
    
    console.log(`🎉 All version files updated to ${currentVersion}`);
    
  } catch (error) {
    console.error('❌ Version update failed:', error);
    process.exit(1);
  }
}

updateVersionFiles();