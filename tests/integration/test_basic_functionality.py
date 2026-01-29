"""
Basic functionality tests for xform2lstsv-generated TSV files.
Tests file generation and basic import capabilities.
"""
import pytest
from pathlib import Path
from citric import Client

from test_helpers import (
    limesurvey_url,
    limesurvey_client,
    generated_files_dir,
    get_tsv_files,
    import_survey_from_tsv,
    verify_survey_import,
    verify_question_exists,
    cleanup_survey
)


def test_generated_files_exist(generated_files_dir: Path):
    """Verify that TSV files were generated from fixtures."""
    tsv_files = get_tsv_files(generated_files_dir)
    assert len(tsv_files) > 0, f"No TSV files found in {generated_files_dir}"
    print(f"\nFound {len(tsv_files)} generated TSV files:")
    for f in tsv_files:
        print(f"  - {f.name}")


def test_basic_survey_import(limesurvey_client: Client, generated_files_dir: Path):
    """Test import of basic_survey.tsv"""
    tsv_path = generated_files_dir / "basic_survey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    survey_id = import_survey_from_tsv(
        limesurvey_client,
        tsv_path,
        "Basic Survey Test"
    )

    try:
        # Verify the survey was imported
        verify_survey_import(limesurvey_client, survey_id, expected_question_count=4)

        # Check questions
        verify_question_exists(limesurvey_client, survey_id, [
            "respondentname",
            "age", 
            "consent"
        ])

        print(f"\n✓ Basic survey imported successfully")
        print(f"  - Questions: 4")

    finally:
        # Cleanup
        cleanup_survey(limesurvey_client, survey_id)


def test_tutorial_survey_import(limesurvey_client: Client, generated_files_dir: Path):
    """Test import of tutorial_survey.tsv generated from XLS file"""
    tsv_path = generated_files_dir / "tutorial_survey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    survey_id = import_survey_from_tsv(
        limesurvey_client,
        tsv_path,
        "Tutorial Survey Test"
    )

    try:
        # Verify the survey was imported
        verify_survey_import(limesurvey_client, survey_id)

        # Check questions - these are from the XLSForm tutorial
        verify_question_exists(limesurvey_client, survey_id, [
            "name",
            "relationshiptohouseh",  # truncated to 20 chars
            "sex"
        ])

        # Get questions to check count
        questions = limesurvey_client.list_questions(survey_id)
        question_names = [q.get('title') if isinstance(q, dict) else q.title for q in questions]
        
        # Validate we have the expected number of questions from the tutorial
        assert len(questions) >= 5, f"Expected at least 5 questions, got {len(questions)}"

        print(f"\n✓ Tutorial survey imported successfully")
        print(f"  - Questions: {len(questions)}")
        print(f"  - Question names: {question_names}")

    finally:
        # Cleanup
        cleanup_survey(limesurvey_client, survey_id)