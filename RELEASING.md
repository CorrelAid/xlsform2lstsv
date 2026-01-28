# Release Process for xform2lstsv

## Version Management

This project follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- **MAJOR**: Breaking changes to TSV format or API
- **MINOR**: New backward-compatible features  
- **PATCH**: Bug fixes and minor improvements

## Release Checklist

### 1. Prepare for Release

```bash
# Check current version and compatibility
npm run check-version

# Update CHANGELOG.md with new changes
# Use standard-version format

# Verify all tests pass
npm run test:all
```

### 2. Bump Version

Choose the appropriate version bump:

```bash
# For breaking changes
npm run version:major

# For new features  
npm run version:minor

# For bug fixes
npm run version:patch
```

### 3. Update Version Files

```bash
# Sync version across all files
npm run sync-version

# Verify version is correct
npm run check-version
```

### 4. Update LimeSurvey Compatibility

Edit `src/config/version.ts` to update:
- `limeSurvey.min` - Minimum supported version
- `limeSurvey.max` - Maximum supported version  
- `limeSurvey.tested` - Add newly tested versions
- `notes` - Any important compatibility notes

### 5. Test with Different LimeSurvey Versions

```bash
# Test with different LimeSurvey versions
LIMESURVEY_VERSION=6.16.4 npm run test:integration:full
LIMESURVEY_VERSION=6.17.0 npm run test:integration:full
```

### 6. Create Release

```bash
# Using standard-version (recommended)
npm run release

# This will:
# - Bump version in package.json
# - Update CHANGELOG.md
# - Create git tag
# - Commit changes

# Push changes and tags
git push --follow-tags
```

### 7. Publish to npm

```bash
# Build the package
npm run build

# Publish to npm
npm publish
```

## Manual Release (Alternative)

If you prefer manual control:

```bash
# 1. Update CHANGELOG.md manually
# 2. Bump version
npm version patch -m "chore: release v%s"

# 3. Build
npm run build

# 4. Commit changes
git add .
git commit -m "chore: prepare release v1.2.3"

# 5. Tag release
git tag v1.2.3

# 6. Push
git push origin main --tags

# 7. Publish
npm publish
```

## Integration Testing with Different Versions

The Docker setup supports dynamic LimeSurvey versions:

```bash
# Test with specific version
LIMESURVEY_VERSION=6.17.2 npm run test:integration:full

# Test with default version
npm run test:integration:full
```

## Version Compatibility Matrix

Maintain the compatibility matrix in `src/config/version.ts`:

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

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/modifying tests
- `chore`: Build process changes
- `revert`: Reverting a commit

### Examples

```bash
# Good commit message
feat(tsv): add support for LimeSurvey 6.17.0 date formats

- Add new date format handling
- Update TypeMapper for new date types
- Add tests for date format conversion

BREAKING CHANGE: Removes support for deprecated date formats
```

```bash
# Simple commit
fix(converter): handle empty choice lists gracefully
```

## CI/CD Pipeline

The release process integrates with GitHub Actions:

1. **Automatic Testing**: All tests run on every commit
2. **Commit Linting**: Enforces semantic commit messages
3. **Version Checking**: Verifies version consistency
4. **Release Automation**: Handles npm publishing

## Troubleshooting

### Version Mismatch

If you see version mismatch warnings:

```bash
npm run sync-version
```

### Commit Message Rejection

If commitlint rejects your message:

```bash
# Check the rules
cat commitlint.config.js

# Test your message
echo "feat: add new feature" | npx commitlint
```

### Integration Test Failures

```bash
# Clean up and retry
npm run test:integration:teardown
npm run test:integration:setup
npm run test:integration:full
```

## Best Practices

1. **Small, frequent releases** are better than large, infrequent ones
2. **Test with multiple LimeSurvey versions** before major releases
3. **Update documentation** with every release
4. **Use semantic commit messages** for better changelog generation
5. **Run full test suite** before releasing