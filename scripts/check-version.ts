import { VERSION_COMPATIBILITY } from '../src/config/version';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

async function checkLimeSurveyVersion() {
  try {
    // Read package.json to get current version
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 xform2lstsv version: ${currentVersion}`);
    console.log(`🔧 LimeSurvey compatibility: ${VERSION_COMPATIBILITY.limeSurvey.min} - ${VERSION_COMPATIBILITY.limeSurvey.max}`);
    console.log(`✅ Tested versions: ${VERSION_COMPATIBILITY.limeSurvey.tested.join(', ')}`);
    console.log(`📝 Notes: ${VERSION_COMPATIBILITY.notes || 'None'}`);
    
    // Check if we need to update the version in version.ts
    if (currentVersion !== VERSION_COMPATIBILITY.xform2lstsv) {
      console.log(`⚠️  Version mismatch detected!`);
      console.log(`   package.json: ${currentVersion}`);
      console.log(`   version.ts: ${VERSION_COMPATIBILITY.xform2lstsv}`);
      console.log(`   Run 'npm run sync-version' to update.`);
    }
    
  } catch (error) {
    console.error('❌ Version check failed:', error);
    process.exit(1);
  }
}

checkLimeSurveyVersion();