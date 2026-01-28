import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { VERSION_COMPATIBILITY } from '../src/config/version';

interface TestResult {
  version: string;
  success: boolean;
  error?: string;
  duration?: number;
}

async function testLimeSurveyCompatibility() {
  const versionsToTest = getVersionsToTest();
  const results: TestResult[] = [];
  
  console.log(`🔍 Testing xform2lstsv v${VERSION_COMPATIBILITY.xform2lstsv} compatibility`);
  console.log(`📋 Testing ${versionsToTest.length} LimeSurvey versions...\n`);
  
  for (const version of versionsToTest) {
    console.log(`🧪 Testing LimeSurvey ${version}...`);
    
    const startTime = Date.now();
    
    try {
      // Set the LimeSurvey version
      execSync(`export LIMESURVEY_VERSION=${version} && npm run test:integration:full`, {
        stdio: 'inherit',
        env: { ...process.env, LIMESURVEY_VERSION: version }
      });
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      results.push({
        version,
        success: true,
        duration
      });
      
      console.log(`✅ LimeSurvey ${version} - COMPATIBLE (${duration}s)\n`);
      
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      results.push({
        version,
        success: false,
        error: error.message,
        duration
      });
      
      console.log(`❌ LimeSurvey ${version} - INCOMPATIBLE (${duration}s)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  // Generate compatibility report
  generateCompatibilityReport(results);
  
  // Update version compatibility matrix
  updateVersionCompatibility(results);
  
  console.log('🎉 Compatibility testing complete!');
}

function getVersionsToTest(): string[] {
  // Start from 6.16.0 and go up to the current max version
  const startVersion = '6.16.0';
  const endVersion = VERSION_COMPATIBILITY.limeSurvey.max;
  
  const versions: string[] = [];
  
  // Parse start and end versions
  const [startMajor, startMinor] = startVersion.split('.').map(Number);
  const [endMajor, endMinor] = endVersion.split('.').map(Number);
  
  // Generate version range
  for (let major = startMajor; major <= endMajor; major++) {
    const startMin = major === startMajor ? startMinor : 0;
    const endMin = major === endMajor ? endMinor : 10;
    
    for (let minor = startMin; minor <= endMin; minor++) {
      versions.push(`${major}.${minor.toString().padStart(2, '0')}.0`);
    }
  }
  
  // Also include any specifically tested versions
  VERSION_COMPATIBILITY.limeSurvey.tested.forEach(v => {
    if (!versions.includes(v)) {
      versions.push(v);
    }
  });
  
  return versions.sort(compareVersions);
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  
  return 0;
}

function generateCompatibilityReport(results: TestResult[]) {
  const compatible = results.filter(r => r.success);
  const incompatible = results.filter(r => !r.success);
  
  console.log('📊 COMPATIBILITY REPORT');
  console.log('======================');
  console.log(`Total versions tested: ${results.length}`);
  console.log(`Compatible: ${compatible.length}`);
  console.log(`Incompatible: ${incompatible.length}\n`);
  
  console.log('✅ COMPATIBLE VERSIONS:');
  compatible.forEach(r => {
    console.log(`   ${r.version} (${r.duration}s)`);
  });
  
  if (incompatible.length > 0) {
    console.log('\n❌ INCOMPATIBLE VERSIONS:');
    incompatible.forEach(r => {
      console.log(`   ${r.version} - ${r.error}`);
    });
  }
  
  // Write report to file
  const report = `
# Compatibility Test Report

## Summary
- **xform2lstsv Version**: ${VERSION_COMPATIBILITY.xform2lstsv}
- **Test Date**: ${new Date().toISOString()}
- **Total Versions Tested**: ${results.length}
- **Compatible**: ${compatible.length}
- **Incompatible**: ${incompatible.length}

## Compatible Versions
${compatible.map(r => `- ${r.version} (${r.duration}s)`).join('\n')}

## Incompatible Versions
${incompatible.map(r => `- ${r.version}: ${r.error}`).join('\n')}

## Recommendations
- **Minimum Supported Version**: ${compatible.length > 0 ? compatible[0].version : 'None'}
- **Maximum Supported Version**: ${compatible.length > 0 ? compatible[compatible.length - 1].version : 'None'}
`;
  
  writeFileSync('COMPATIBILITY_REPORT.md', report);
  console.log(`\n📝 Report saved to COMPATIBILITY_REPORT.md`);
}

function updateVersionCompatibility(results: TestResult[]) {
  const compatibleVersions = results.filter(r => r.success).map(r => r.version);
  
  if (compatibleVersions.length === 0) {
    console.log('⚠️  No compatible versions found!');
    return;
  }
  
  // Read current version.ts
  let versionTs = readFileSync('src/config/version.ts', 'utf-8');
  
  // Update min and max versions
  const minVersion = compatibleVersions.sort(compareVersions)[0];
  const maxVersion = compatibleVersions.sort(compareVersions).reverse()[0];
  
  // Update the version compatibility
  const updatedVersionTs = versionTs
    .replace(/min: "[^"]+"/, `min: "${minVersion}"`)
    .replace(/max: "[^"]+"/, `max: "${maxVersion}"`)
    .replace(/tested: \[[^\]]+\]/, `tested: ["${compatibleVersions.join('", "')}"]`);
  
  writeFileSync('src/config/version.ts', updatedVersionTs);
  
  console.log(`\n🔧 Updated version compatibility:`);
  console.log(`   Minimum supported: ${minVersion}`);
  console.log(`   Maximum supported: ${maxVersion}`);
  console.log(`   Tested versions: ${compatibleVersions.length} versions`);
}

// Run the compatibility test
testLimeSurveyCompatibility().catch(console.error);