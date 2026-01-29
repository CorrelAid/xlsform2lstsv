"""
Comprehensive tests for xform2lstsv-generated TSV files.
Tests that all generated TSV files can be imported without errors.
"""
import pytest
from pathlib import Path
from citric import Client

from test_helpers import (
    limesurvey_url,
    limesurvey_client,
    generated_files_dir,
    import_all_surveys_from_directory
)


def test_all_generated_surveys(limesurvey_client: Client, generated_files_dir: Path):
    """Test that all generated TSV files can be imported without errors"""
    imported_successfully, failed_imports = import_all_surveys_from_directory(
        limesurvey_client,
        generated_files_dir
    )

    # Print summary
    print(f"\n\nImport Summary:")
    print(f"  ✓ Successful: {len(imported_successfully)}/{len(imported_successfully) + len(failed_imports)}")
    for name in imported_successfully:
        print(f"    - {name}")

    if failed_imports:
        print(f"\n  ✗ Failed: {len(failed_imports)}")
        for name, error in failed_imports:
            print(f"    - {name}: {error}")

    # All imports should succeed
    assert len(failed_imports) == 0, f"{len(failed_imports)} imports failed"