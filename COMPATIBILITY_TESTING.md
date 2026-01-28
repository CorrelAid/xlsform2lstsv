# LimeSurvey Compatibility Testing Guide

## Overview

This guide explains how to test xform2lstsv compatibility with multiple LimeSurvey versions to determine which versions are supported.

## Compatibility Testing System

The system automatically:
1. Tests xform2lstsv with multiple LimeSurvey versions
2. Generates a detailed compatibility report
3. Updates the version compatibility matrix
4. Identifies minimum and maximum supported versions

## Running Compatibility Tests

### Basic Usage

```bash
npm run test-compatibility
```

This will:
- Test all LimeSurvey versions from 6.16.0 to the current max version
- Generate a compatibility report
- Update the version compatibility matrix

### Custom Version Range

To test a specific range of versions, modify the `getVersionsToTest()` function in `scripts/test-compatibility-fast.ts`:

```typescript
function getVersionsToTest(): string[] {
  const startVersion = '6.16.0';  // Change this
  const endVersion = '6.17.2';    // Change this
  // ...
}
```

### Testing Specific Versions

To test specific versions only, modify the function to return a custom array:

```typescript
function getVersionsToTest(): string[] {
  return ['6.16.4', '6.17.0', '6.17.2']; // Custom versions
}
```

## How It Works

### Test Process

1. **Cleanup**: Removes any existing Docker containers
2. **Setup**: Starts LimeSurvey with the specific version
3. **Wait**: Allows LimeSurvey to initialize (20 seconds)
4. **Generate Fixtures**: Creates test TSV files
5. **Run Tests**: Executes integration tests
6. **Cleanup**: Removes containers after testing
7. **Repeat**: For each version in the test range

### Version Generation

The system automatically generates versions to test:
- Starts from 6.16.0 (configurable)
- Goes up to the current max version in `version.ts`
- Includes all minor versions in between
- Also includes any manually specified tested versions

### Example Version Range

```
6.16.0, 6.16.1, 6.16.2, ..., 6.17.0, 6.17.1, 6.17.2
```

## Compatibility Report

After testing, a `COMPATIBILITY_REPORT.md` file is generated with:

- **Summary**: Total versions tested, compatible count, incompatible count
- **Compatible Versions**: List of working versions with test durations
- **Incompatible Versions**: List of failed versions with error messages
- **Recommendations**: Minimum/maximum supported versions
- **Test Details**: Total duration and average test time

### Example Report

```markdown
# Compatibility Test Report

## Summary
- **xform2lstsv Version**: 1.2.3
- **Test Date**: 2024-01-01T12:00:00.000Z
- **Total Versions Tested**: 5
- **Compatible**: 4
- **Incompatible**: 1

## Compatible Versions
- 6.16.4 (45s)
- 6.17.0 (42s)
- 6.17.1 (43s)
- 6.17.2 (44s)

## Incompatible Versions
- 6.16.0: Connection refused to LimeSurvey API

## Recommendations
- **Minimum Supported Version**: 6.16.4
- **Maximum Supported Version**: 6.17.2
- **Recommended Version**: 6.17.2
```

## Version Compatibility Matrix

The system automatically updates `src/config/version.ts` with:

```typescript
export const VERSION_COMPATIBILITY: VersionCompatibility = {
  xform2lstsv: "1.2.3",
  limeSurvey: {
    min: "6.16.4",      // Updated automatically
    max: "6.17.2",      // Updated automatically
    tested: ["6.16.4", "6.17.0", "6.17.1", "6.17.2"]  // Updated automatically
  },
  notes: "Full support for LimeSurvey 6.16.4+ features"
};
```

## Manual Testing

### Test Single Version

```bash
# Test with specific version
LIMESURVEY_VERSION=6.16.4 npm run test:integration:full
```

### Test Multiple Versions Manually

```bash
# Test several versions in sequence
for version in 6.16.4 6.17.0 6.17.2; do
  echo "Testing LimeSurvey $version"
  LIMESURVEY_VERSION=$version npm run test:integration:full
done
```

## Troubleshooting

### Docker Issues

```bash
# Clean up Docker containers
npm run test:integration:teardown

# Check Docker status
docker ps -a

# Remove all containers
docker rm -f $(docker ps -aq)
```

### Test Failures

```bash
# Check specific version compatibility
LIMESURVEY_VERSION=6.16.4 npm run test:integration:full

# Check logs
docker logs limesurvey
```

### Timeouts

```bash
# Increase wait time in the script
# Change: execSync('sleep 20')
# To: execSync('sleep 30')
```

## Best Practices

### 1. Test Before Releases

Always run compatibility tests before major releases:

```bash
npm run test-compatibility
```

### 2. Test New LimeSurvey Versions

When a new LimeSurvey version is released:

```bash
# Test the new version
LIMESURVEY_VERSION=6.17.3 npm run test:integration:full

# If compatible, run full compatibility test
npm run test-compatibility
```

### 3. Update Documentation

After compatibility testing, update:
- `README.md` with new version support
- `CHANGELOG.md` with compatibility changes
- `VERSION_MANAGEMENT.md` with new test results

### 4. CI/CD Integration

Consider adding compatibility testing to your CI pipeline for major releases.

## Version Support Policy

### Supported Versions

- **Minimum**: Oldest version that passes all tests
- **Maximum**: Newest version that passes all tests
- **Recommended**: Latest stable version that passes all tests

### Version Deprecation

When dropping support for old versions:

1. Update the compatibility matrix
2. Update documentation
3. Consider adding deprecation warnings
4. Test thoroughly with remaining supported versions

## Performance Optimization

### Parallel Testing (Advanced)

For faster testing, you could implement parallel testing:

```bash
# Test multiple versions in parallel (requires script modification)
# This is more complex but can save significant time
```

### Caching Docker Images

```bash
# Pull images in advance to save time
docker pull adamzammit/limesurvey:6.16.4
docker pull adamzammit/limesurvey:6.17.0
```

## Example Workflow

### Before Major Release

```bash
# 1. Update code
# 2. Run unit tests
npm test

# 3. Run compatibility tests
npm run test-compatibility

# 4. Review compatibility report
cat COMPATIBILITY_REPORT.md

# 5. Update documentation
# 6. Release
npm run release
```

### When LimeSurvey Releases New Version

```bash
# 1. Test new version
LIMESURVEY_VERSION=6.17.3 npm run test:integration:full

# 2. If compatible, update version range
# Edit scripts/test-compatibility-fast.ts

# 3. Run full compatibility test
npm run test-compatibility

# 4. Update documentation
# 5. Release new version if needed
```

## Technical Details

### Docker Image Format

The system uses images from `adamzammit/limesurvey`:

```
adamzammit/limesurvey:6.16.4
adamzammit/limesurvey:6.17.0
```

### Test Duration

Each version test takes approximately 60-90 seconds:
- 20s: Docker startup and LimeSurvey initialization
- 10s: Fixture generation
- 30s: Integration test execution

### Resource Requirements

- **Docker**: Required for LimeSurvey containers
- **Memory**: ~2GB per container
- **Disk**: ~1GB for Docker images
- **Time**: ~1 minute per version tested

## Limitations

### Docker Dependency

The compatibility testing requires Docker to be installed and running.

### Time Consuming

Testing many versions can take significant time. Consider:
- Testing only major/minor versions
- Using a subset of critical tests
- Running tests overnight

### Image Availability

Not all LimeSurvey versions may have Docker images available.

## Future Enhancements

### 1. Parallel Testing

Implement parallel version testing to reduce total test time.

### 2. Selective Testing

Add options to test only specific version ranges or types.

### 3. CI Integration

Add compatibility testing to GitHub Actions for automated verification.

### 4. Performance Profiling

Add detailed performance metrics for each version.

### 5. Regression Detection

Automatically detect regressions between versions.

## Conclusion

The compatibility testing system provides a robust way to:
- Verify xform2lstsv works with multiple LimeSurvey versions
- Automatically update compatibility documentation
- Ensure users know which versions are supported
- Maintain high quality across version upgrades

Use this system regularly to catch compatibility issues early and provide the best experience for users.