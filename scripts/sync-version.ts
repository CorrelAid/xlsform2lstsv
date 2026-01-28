import { readFileSync, writeFileSync } from 'fs';

function syncVersion() {
  try {
    // Read package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const currentVersion = packageJson.version;
    
    // Read version.ts
    let versionTs = readFileSync('src/config/version.ts', 'utf-8');
    
    // Update version in version.ts
    const updatedVersionTs = versionTs.replace(
      /xform2lstsv: "[^"]+"/,
      `xform2lstsv: "${currentVersion}"`
    );
    
    writeFileSync('src/config/version.ts', updatedVersionTs, 'utf-8');
    
    console.log(`✅ Version synced: ${currentVersion}`);
    console.log(`   Updated src/config/version.ts`);
    
  } catch (error) {
    console.error('❌ Version sync failed:', error);
    process.exit(1);
  }
}

syncVersion();