"""
Survey structure tests for xform2lstsv-generated TSV files.
Tests groups, questions, subquestions, and answer structure validation.
"""
import pytest
from pathlib import Path
from citric import Client

from test_helpers import (
    limesurvey_url,
    limesurvey_client,
    generated_files_dir,
    import_survey_from_tsv,
    verify_survey_import,
    verify_question_exists,
    verify_group_exists,
    get_survey_structure_stats,
    cleanup_survey
)


def test_complex_survey_import(limesurvey_client: Client, generated_files_dir: Path):
    """Test import of complex_survey.tsv with groups and logic"""
    tsv_path = generated_files_dir / "complex_survey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    survey_id = import_survey_from_tsv(
        limesurvey_client,
        tsv_path,
        "Complex Survey Test"
    )

    try:
        # Verify survey properties
        verify_survey_import(limesurvey_client, survey_id)

        # Check groups
        verify_group_exists(limesurvey_client, survey_id, ["demographics", "preferences"])

        # Check questions
        verify_question_exists(limesurvey_client, survey_id, [
            "fullname",
            "age",
            "gender",
            "favoritecolors",
            "satisfactionlevel"
        ])

        # Get detailed survey statistics
        stats = get_survey_structure_stats(limesurvey_client, survey_id)

        # Validate counts based on survey structure
        assert stats['groups'] == 2, f"Expected 2 question groups, got {stats['groups']}"
        assert stats['questions'] == 7, f"Expected 7 parent questions, got {stats['questions']}"
        assert stats['subquestions'] == 4, f"Expected 4 subquestions, got {stats['subquestions']}"
        assert stats['answers'] == 5, f"Expected 5 answer options (3 gender + 2 satisfaction), got {stats['answers']}"

        print(f"\n✓ Complex survey imported successfully")
        print(f"  - Question groups: {stats['groups']}")
        print(f"  - Questions: {stats['questions']}")
        print(f"  - Subquestions: {stats['subquestions']}")
        print(f"  - Answers: {stats['answers']}")

        # Verify relevance/conditions (if supported by citric)
        # Note: This may need to be checked differently depending on citric's API

    finally:
        # Cleanup
        cleanup_survey(limesurvey_client, survey_id)