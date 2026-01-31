import { execSync } from 'child_process';
import { VERSION_COMPATIBILITY } from '../dist/config/version.js';

interface TestResult {
  version: string;
  success: boolean;
  error?: string;
  duration?: number;
}

async function testLimeSurveyCompatibilitySafe() {
  const versionsToTest = getVersionsToTest();
  const results: TestResult[] = [];
  
  console.log(`🔍 Testing xlsform2lstsv v${VERSION_COMPATIBILITY.xlsform2lstsv} compatibility`);
  console.log(`📋 Testing ${versionsToTest.length} LimeSurvey versions...
`);
  
  for (const version of versionsToTest) {
    console.log(`🧪 Testing LimeSurvey ${version}...`);
    
    const startTime = Date.now();
    
    try {
      // First, teardown any existing containers
      console.log(`   🧹 Cleaning up previous containers...`);
      execSync('cd tests/integration && docker-compose down -v', {
        stdio: 'inherit'
      });
      
      // Start new containers with specific version
      console.log(`   🐳 Starting LimeSurvey ${version}...`);
      execSync(`cd tests/integration && LIMESURVEY_VERSION=${version} docker-compose up -d`, {
        stdio: 'inherit',
        env: { ...process.env, LIMESURVEY_VERSION: version }
      });
      
      // Wait for LimeSurvey to be ready
      console.log(`   ⏳ Waiting for LimeSurvey to start...`);
      execSync('sleep 20', { stdio: 'inherit' });
      
      // Generate fixtures
      console.log(`   📝 Generating test fixtures...`);
      execSync('npm run fixtures:generate', { stdio: 'inherit' });
      
      // Run integration tests
      console.log(`   🧪 Running integration tests...`);
      execSync(`cd tests/integration && LIMESURVEY_VERSION=${version} uv run pytest test_generated_surveys.py`, {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        version,
        success: false,
        error: errorMessage,
        duration
      });
      
      console.log(`❌ LimeSurvey ${version} - INCOMPATIBLE (${duration}s)`);
      console.log(`   Error: ${errorMessage}\n`);
    } finally {
      // Clean up after each test
      try {
        execSync('cd tests/integration && docker-compose down -v', {
          stdio: 'ignore'
        });
      } catch (cleanupError) {
        const cleanupErrorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.log(`   ⚠️  Cleanup warning: ${cleanupErrorMessage}`);
      }
    }
  }
  
  // Generate compatibility report
  generateCompatibilityReport(results);
  
  // Check if all specified versions are compatible
  checkVersionCompatibility(results);
  
  console.log('🎉 Compatibility testing complete!');
}

function getVersionsToTest(): string[] {
  // Get versions from environment variable or use defaults
  const specificVersions = process.env.SPECIFIC_VERSIONS;
  
  if (specificVersions) {
    // Test only the versions specified in environment variable
    return specificVersions.split(',').map(v => v.trim());
  }
  
  // Use the tested versions array (simplified approach)
  if (!VERSION_COMPATIBILITY.limeSurvey.tested || VERSION_COMPATIBILITY.limeSurvey.tested.length === 0) {
    throw new Error(
      'No tested versions configured. Please specify versions in VERSION_COMPATIBILITY.limeSurvey.tested'
    );
  }

  const versions = [...VERSION_COMPATIBILITY.limeSurvey.tested];

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
}

function checkVersionCompatibility(results: TestResult[]) {
  const incompatibleVersions = results.filter(r => !r.success);
  
  if (incompatibleVersions.length > 0) {
    console.log('\n⚠️  INCOMPATIBLE VERSIONS DETECTED:');
    console.log('The following versions failed compatibility tests:');
    incompatibleVersions.forEach(r => {
      console.log(`   ${r.version}: ${r.error}`);
    });
    
    // Exit with error code if any versions failed
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTED VERSIONS ARE COMPATIBLE');
    console.log('All specified LimeSurvey versions work correctly with xlsform2lstsv.');
  }
}

// Run the compatibility test
if (import.meta.url === `file://${process.argv[1]}`) {
  testLimeSurveyCompatibilitySafe().catch(error => {
    console.error('❌ Compatibility test failed:', error);
    process.exit(1);
  });
}

export { testLimeSurveyCompatibilitySafe };