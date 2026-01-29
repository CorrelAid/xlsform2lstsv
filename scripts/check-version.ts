import { VERSION_COMPATIBILITY } from '../src/config/version';
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
      console.log(`⚠️  Version mismatch detected!`);
      console.log(`   package.json: ${currentVersion}`);
      console.log(`   version.ts: ${VERSION_COMPATIBILITY.xlsform2lstsv}`);
      console.log(`   Run 'npm run sync-version' to update.`);
    }
    
  } catch (error) {
    console.error('❌ Version check failed:', error);
    process.exit(1);
  }
}

checkLimeSurveyVersion();