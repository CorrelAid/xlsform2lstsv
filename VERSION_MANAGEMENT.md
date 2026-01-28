# Version Management Guide

## Overview

This document explains how version management works in xform2lstsv, including:
- Semantic versioning
- LimeSurvey compatibility tracking
- Dynamic Docker image versions
- Release process

## Semantic Versioning

We follow `MAJOR.MINOR.PATCH` versioning:

```
MAJOR.MINOR.PATCH
  │    │      │
  │    │      └─ Bug fixes and minor improvements
  │    └─ New backward-compatible features
  └─ Breaking changes
```

### When to Bump Each Version

**PATCH (x.y.Z)** - Bug fixes and minor improvements:
- Bug fixes
- Performance improvements
- Documentation updates
- Minor refactoring

**MINOR (x.Y.z)** - New backward-compatible features:
- New question types
- New conversion options
- Enhanced error handling
- New configuration options

**MAJOR (X.y.z)** - Breaking changes:
- Changes to TSV output format
- API changes
- Removed features
- Major refactoring

## Version Files

### 1. package.json

The main version source:
```json
{
  "version": "1.2.3"
}
```

### 2. src/config/version.ts

Tracks version compatibility:
```typescript
export const VERSION_COMPATIBILITY: VersionCompatibility = {
  xform2lstsv: "1.2.3",
  limeSurvey: {
    min: "6.16.4",
    max: "6.17.2",
    tested: ["6.16.4", "6.17.0", "6.17.2"]
  },
  notes: "Full support for LimeSurvey 6.16.4+ features"
};
```

## LimeSurvey Compatibility

### Version Ranges

- **min**: Minimum supported LimeSurvey version
- **max**: Maximum supported LimeSurvey version  
- **tested**: Versions we've actually tested with

### Updating Compatibility

When testing with a new LimeSurvey version:

1. Test with the new version:
   ```bash
   LIMESURVEY_VERSION=6.17.3 npm run test:integration:full
   ```

2. Update the compatibility matrix:
   ```typescript
   limeSurvey: {
     min: "6.16.4",
     max: "6.17.3",  // Updated
     tested: ["6.16.4", "6.17.0", "6.17.2", "6.17.3"]  // Added
   }
   ```

## Dynamic Docker Versions

The integration tests use dynamic LimeSurvey versions:

### docker-compose.yml

```yaml
services:
  limesurvey:
    image: adamzammit/limesurvey:${LIMESURVEY_VERSION:-6.16.4}
```

### Environment Variables

- `LIMESURVEY_VERSION`: Sets the specific version to test
- Default: `6.16.4` (fallback if not specified)

### Usage Examples

```bash
# Test with default version
npm run test:integration:full

# Test with specific version
LIMESURVEY_VERSION=6.17.2 npm run test:integration:full

# Test multiple versions
for version in 6.16.4 6.17.0 6.17.2; do
  echo "Testing with LimeSurvey $version"
  LIMESURVEY_VERSION=$version npm run test:integration:full
done
```

## Version Management Commands

### Check Current Version

```bash
npm run check-version
```

This shows:
- Current xform2lstsv version
- LimeSurvey compatibility range
- Tested versions
- Version consistency status

### Sync Versions

```bash
npm run sync-version
```

Updates `src/config/version.ts` to match `package.json`.

### Update All Version Files

```bash
npm run update-version
```

Updates all version references across the project.

### Bump Version

```bash
# Major version bump (breaking changes)
npm run version:major

# Minor version bump (new features)
npm run version:minor

# Patch version bump (bug fixes)
npm run version:patch
```

## Release Process

### Standard Release (Recommended)

```bash
# 1. Update CHANGELOG.md
# 2. Run release command
npm run release

# 3. Push changes with tags
git push --follow-tags
```

### Manual Release

```bash
# 1. Bump version
npm version patch -m "chore: release v%s"

# 2. Update version files
npm run update-version

# 3. Build
npm run build

# 4. Commit
git add .
git commit -m "chore: prepare release v1.2.3"

# 5. Tag
git tag v1.2.3

# 6. Push
git push origin main --tags

# 7. Publish
npm publish
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/ci.yml` handles:

1. **Testing**: Runs all tests on push/PR
2. **Linting**: Enforces commit message format
3. **Version Checking**: Verifies version consistency
4. **Release**: Publishes to npm on tag push

### Workflow Jobs

- **test**: Unit tests and linting
- **integration-test**: Docker-based integration tests
- **release**: npm publishing (on tags)
- **version-check**: Version consistency verification

## Version Verification

### Automatic Checks

The CI pipeline automatically:
- Verifies version consistency between files
- Checks commit message format
- Runs all tests

### Manual Verification

```bash
# Check version consistency
npm run check-version

# Test commit message format
echo "feat: add new feature" | npx commitlint

# Run all tests
npm run test:all
```

## Best Practices

### 1. Keep Versions in Sync

Always run `npm run sync-version` after changing `package.json`.

### 2. Test Multiple LimeSurvey Versions

Before major releases, test with all supported versions:

```bash
for version in 6.16.4 6.17.0 6.17.2; do
  LIMESURVEY_VERSION=$version npm run test:integration:full
done
```

### 3. Update Compatibility Matrix

When you test a new LimeSurvey version, update the matrix.

### 4. Use Semantic Commits

Follow the commit message format for better changelog generation.

### 5. Small, Frequent Releases

Prefer small, frequent releases over large, infrequent ones.

## Troubleshooting

### Version Mismatch

```
⚠️  Version mismatch detected!
   package.json: 1.2.4
   version.ts: 1.2.3
   Run 'npm run sync-version' to update.
```

**Solution**: Run `npm run sync-version`

### Commit Message Rejected

```
❌  found 1 problems, 0 warnings
ⓘ  input: feat: Add new feature
✖  subject may not be empty [subject-empty]
```

**Solution**: Use proper commit message format

### Integration Test Failures

```
# Try cleaning up and retrying
npm run test:integration:teardown
npm run test:integration:setup
npm run test:integration:full
```

## Version History

Check `CHANGELOG.md` for detailed version history and changes.

## Updating This Guide

When making changes to the version management system:

1. Update this document
2. Update `RELEASING.md`
3. Update any scripts or configuration
4. Test the new workflow
5. Document the changes in CHANGELOG.md