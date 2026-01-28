# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive version management system with semantic versioning
- Commit message linting with commitlint
- Husky git hooks for pre-commit testing and commit message validation
- Dynamic LimeSurvey version support in Docker integration tests
- Version compatibility tracking system
- Automated release process with standard-version

### Changed

- Updated Docker compose to use dynamic LimeSurvey version via environment variable
- Enhanced package.json with version management scripts
- Added comprehensive release documentation

### Fixed

- Version consistency between package.json and version tracking files

## [1.0.0] - 2024-01-01

### Added

- Initial release of xform2lstsv
- XLSForm to LimeSurvey TSV conversion
- Support for basic question types (text, numeric, select)
- Group and survey structure handling
- Integration testing with LimeSurvey Docker setup
- Comprehensive test suite

### Known Limitations

- Repeats not fully supported
- Limited to LimeSurvey 6.16.4+ compatibility
- Some advanced XLSForm features may not convert perfectly

[unreleased]: https://github.com/your-repo/xform2lstsv/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-repo/xform2lstsv/releases/tag/v1.0.0