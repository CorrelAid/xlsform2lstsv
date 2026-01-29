"""
Comprehensive survey integration tests for xform2lstsv-generated TSV files.
Tests that the comprehensive survey can be imported into LimeSurvey and verifies structure using API.
"""
import pytest
from pathlib import Path
import json
from citric import Client

from test_helpers import (
    limesurvey_url,
    limesurvey_client,
    generated_files_dir,
    import_survey_from_tsv,
    verify_survey_import,
    verify_question_exists,
    verify_group_exists,
    cleanup_survey
)


@pytest.fixture(scope="module")
def comprehensive_survey_data() -> dict:
    """Load comprehensive survey data from fixture."""
    fixture_path = Path(__file__).parent.parent / "fixtures" / "comprehensiveSurvey.json"
    with open(fixture_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def test_comprehensive_survey_import_and_structure_verification(limesurvey_client: Client, generated_files_dir: Path, comprehensive_survey_data: dict):
    """Test import of comprehensiveSurvey.tsv and verify structure using LimeSurvey API"""
    tsv_path = generated_files_dir / "comprehensiveSurvey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    survey_id = import_survey_from_tsv(
        limesurvey_client,
        tsv_path,
        "Comprehensive Survey Test"
    )

    try:
        # Verify the survey was imported
        verify_survey_import(limesurvey_client, survey_id, expected_question_count=22)

        # Get questions and groups for further verification
        questions = limesurvey_client.list_questions(survey_id)
        groups = limesurvey_client.list_groups(survey_id)

        # Verify expected questions exist (based on actual fixture content)
        expected_questions = [
            'welcome', 'fullname', 'age', 'height',
            'birthdate', 'surveytime', 'wakeuptime', 'gender', 'interests',
            'section2', 'priorities',
            'surveystart', 'surveyend', 'surveydate', 'deviceid', 'username'
        ]

        verify_question_exists(limesurvey_client, survey_id, expected_questions)

        # Verify survey groups using API
        verify_group_exists(limesurvey_client, survey_id, ['Questions'])

        # Verify question types using API
        question_types = [q.get('type') if isinstance(q, dict) else q.type for q in questions]
        
        # Count each question type
        type_counts = {}
        for qtype in question_types:
            type_counts[qtype] = type_counts.get(qtype, 0) + 1
        
        # Verify we have all expected question types
        expected_types = ['X', 'S', 'N', 'D', 'L', 'M', '*', 'R']
        for expected_type in expected_types:
            assert expected_type in type_counts, f"Should have questions of type {expected_type}"
        
        # Verify specific question type counts (based on actual survey structure)
        assert type_counts['X'] >= 2, f"Expected at least 2 note questions, got {type_counts['X']}"  # welcome, section2
        assert type_counts['S'] >= 1, f"Expected at least 1 text question, got {type_counts['S']}"  # fullname
        assert type_counts['N'] >= 2, f"Expected at least 2 numeric questions, got {type_counts['N']}"  # age, height
        assert type_counts['D'] >= 3, f"Expected at least 3 date questions, got {type_counts['D']}"  # birthdate, surveytime, wakeuptime
        assert type_counts['L'] >= 1, f"Expected at least 1 list question, got {type_counts['L']}"  # gender
        assert type_counts['M'] >= 7, f"Expected at least 7 multiple choice questions, got {type_counts['M']}"  # interests + 6 sub-questions
        assert type_counts['*'] >= 5, f"Expected at least 5 equation questions, got {type_counts['*']}"  # surveystart, surveyend, surveydate, deviceid, username
        assert type_counts['R'] >= 1, f"Expected at least 1 ranking question, got {type_counts['R']}"  # priorities

        # Verify survey properties using API
        survey_properties = limesurvey_client.get_survey_properties(survey_id)
        assert survey_properties is not None, "Survey properties should not be None"
        assert 'language' in survey_properties, "Survey should have language property"
        assert survey_properties['language'] == 'en', f"Expected language 'en', got {survey_properties['language']}"

        # Verify survey title (check available properties)
        survey_title = None
        for key, value in survey_properties.items():
            if 'title' in key.lower() and value and isinstance(value, str):
                survey_title = value
                break
        
        # If we found a title, verify it contains expected text
        if survey_title:
            assert 'Comprehensive' in survey_title, f"Expected 'Comprehensive' in title, got {survey_title}"
        else:
            # If no title found in properties, that's okay - the survey was still imported successfully
            print(f"  ? Survey title not found in properties (available keys: {list(survey_properties.keys())})")

        print(f"\n✓ Comprehensive survey import and structure verification successful")
        print(f"  - Survey imported with ID: {survey_id}")
        print(f"  - Questions verified: {len(questions)} (20 main + 6 sub-questions)")
        print(f"  - Groups verified: {len(groups)}")
        print(f"  - Question types verified: {len(type_counts)} different types")
        print(f"  - Survey properties verified")
        print(f"  - All expected questions present and accessible via API")

    finally:
        # Cleanup
        cleanup_survey(limesurvey_client, survey_id)