import { VERSION_COMPATIBILITY } from '../dist/config/version.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

async function checkLimeSurveyVersion() {
  try {
    // Read package.json to get current version
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 xlsform2lstsv version: ${currentVersion}`);
    console.log(`✅ Tested LimeSurvey versions: ${VERSION_COMPATIBILITY.limeSurvey.tested.join(', ')}`);
    console.log(`📝 Notes: ${VERSION_COMPATIBILITY.notes || 'None'}`);
    
    // Check if we need to update the version in version.ts
    if (currentVersion !== VERSION_COMPATIBILITY.xlsform2lstsv) {
      console.error(`❌ Version mismatch detected!`);
      console.error(`   package.json: ${currentVersion}`);
      console.error(`   version.ts: ${VERSION_COMPATIBILITY.xlsform2lstsv}`);
      console.error(`   Run 'npm run sync-version' to update.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Version check failed:', error);
    process.exit(1);
  }
}

checkLimeSurveyVersion();