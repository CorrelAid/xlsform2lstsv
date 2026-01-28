"""
Integration tests for xform2lstsv-generated TSV files.
Tests that generated TSV files from fixtures can be successfully imported into LimeSurvey.
"""
import time
import pytest
from pathlib import Path
from typing import Generator

from citric import Client


@pytest.fixture(scope="module")
def limesurvey_url() -> str:
    """LimeSurvey URL (expects docker-compose to be running)."""
    return "http://localhost:8080/index.php/admin/remotecontrol"


@pytest.fixture(scope="module")
def limesurvey_client(limesurvey_url: str) -> Generator[Client, None, None]:
    """Authenticated LimeSurvey client using citric."""
    # Wait for LimeSurvey to be ready
    import requests

    base_url = limesurvey_url.replace("/index.php/admin/remotecontrol", "")
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{base_url}/index.php/admin", timeout=5)
            if response.status_code == 200:
                break
        except requests.exceptions.RequestException:
            pass

        if i == max_retries - 1:
            raise Exception("LimeSurvey did not start in time")
        time.sleep(2)

    # Create citric client
    client = Client(limesurvey_url, "admin", "admin")

    yield client


@pytest.fixture(scope="module")
def generated_files_dir() -> Path:
    """Directory containing generated TSV files."""
    return Path(__file__).parent / "output"


def test_generated_files_exist(generated_files_dir: Path):
    """Verify that TSV files were generated from fixtures."""
    tsv_files = list(generated_files_dir.glob("*.tsv"))
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
    with open(tsv_path, 'rb') as f:
        survey_id = limesurvey_client.import_survey(
            f,
            file_type="txt",  # TSV format
            survey_name="Basic Survey Test"
        )

    assert survey_id > 0, "Survey ID should be positive"

    try:
        # Verify the survey was imported
        properties = limesurvey_client.get_survey_properties(survey_id)
        assert properties is not None
        assert properties.get('sid') == survey_id or properties.get('surveyls_survey_id') == survey_id

        # Check questions
        questions = limesurvey_client.list_questions(survey_id)
        question_names = [q.get('title') if isinstance(q, dict) else q.title for q in questions]

        # Verify expected questions exist (LimeSurvey removes underscores)
        assert "respondentname" in question_names, "Should have respondentname question"
        assert "age" in question_names, "Should have age question"
        assert "consent" in question_names, "Should have consent question"

        # Validate survey structure counts
        assert len(questions) == 4, f"Expected 4 questions, got {len(questions)}"

        print(f"\n✓ Basic survey imported successfully")
        print(f"  - Questions: {len(questions)}")

    finally:
        # Cleanup
        limesurvey_client.delete_survey(survey_id)


def test_complex_survey_import(limesurvey_client: Client, generated_files_dir: Path):
    """Test import of complex_survey.tsv with groups and logic"""
    tsv_path = generated_files_dir / "complex_survey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    with open(tsv_path, 'rb') as f:
        survey_id = limesurvey_client.import_survey(
            f,
            file_type="txt",
            survey_name="Complex Survey Test"
        )

    assert survey_id > 0, "Survey ID should be positive"

    try:
        # Verify survey properties
        properties = limesurvey_client.get_survey_properties(survey_id)
        assert properties is not None

        # Check groups
        groups = limesurvey_client.list_groups(survey_id)
        group_titles = [g.get('group_name') if isinstance(g, dict) else g.group_name for g in groups]

        assert "demographics" in [g.lower() for g in group_titles], "Should have demographics group"
        assert "preferences" in [g.lower() for g in group_titles], "Should have preferences group"

        # Validate group count
        assert len(groups) == 2, f"Expected 2 question groups, got {len(groups)}"

        # Check questions
        questions = limesurvey_client.list_questions(survey_id)
        question_names = [q.get('title') if isinstance(q, dict) else q.title for q in questions]

        # Demographics group questions (LimeSurvey removes underscores)
        assert "fullname" in question_names
        assert "age" in question_names
        assert "gender" in question_names

        # Preferences group questions (LimeSurvey removes underscores)
        assert "favoritecolors" in question_names
        assert "satisfactionlevel" in question_names

        # Get detailed survey statistics
        # Separate parent questions from subquestions
        parent_questions = []
        subquestions = []
        answer_count = 0

        for question in questions:
            parent_qid = question.get('parent_qid') if isinstance(question, dict) else getattr(question, 'parent_qid', 0)
            qid = question.get('qid') if isinstance(question, dict) else question.qid

            # If parent_qid is 0 or None, it's a parent question
            if not parent_qid or parent_qid == 0 or parent_qid == '0':
                parent_questions.append(question)

                # Count answer options for parent questions only
                try:
                    props = limesurvey_client.get_question_properties(qid)

                    # Check if question has answer options
                    if 'answeroptions' in props and props['answeroptions']:
                        # Filter out default/empty answer options
                        valid_answers = {k: v for k, v in props['answeroptions'].items()
                                       if isinstance(v, dict) and v.get('answer')}
                        answer_count += len(valid_answers)
                except:
                    pass
            else:
                subquestions.append(question)

        stats = {
            'groups': len(groups),
            'questions': len(parent_questions),
            'total_questions': len(questions),
            'subquestions': len(subquestions),
            'answers': answer_count
        }

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
        limesurvey_client.delete_survey(survey_id)


def test_survey_validation(limesurvey_client: Client, generated_files_dir: Path):
    """Test survey validation by checking question properties and attempting activation"""
    tsv_path = generated_files_dir / "complex_survey.tsv"

    if not tsv_path.exists():
        pytest.skip(f"TSV file not found: {tsv_path}")

    # Import the survey
    with open(tsv_path, 'rb') as f:
        survey_id = limesurvey_client.import_survey(
            f,
            file_type="txt",
            survey_name="Validation Test Survey"
        )

    assert survey_id > 0, "Survey ID should be positive"

    try:
        # Get all questions
        questions = limesurvey_client.list_questions(survey_id)

        validation_issues = []

        # Check each question's validation settings
        for question in questions:
            qid = question.get('qid') if isinstance(question, dict) else question.qid
            title = question.get('title') if isinstance(question, dict) else question.title

            try:
                # Get question properties including validation regex
                # Note: citric's get_question_properties returns all properties, not a subset
                props = limesurvey_client.get_question_properties(qid)

                # Check if validation regex exists and log it
                if props.get('preg'):
                    print(f"\n  Question '{title}' has validation: {props['preg']}")

                # Check relevance conditions
                if props.get('relevance') and props['relevance'] not in ['1', '']:
                    print(f"  Question '{title}' has relevance: {props['relevance']}")

            except Exception as e:
                # Some questions may have API issues with get_question_properties
                print(f"\n  Warning: Could not get properties for question '{title}': {e}")
                # Don't fail the test for property retrieval issues
                continue

        # Try to activate the survey (this will reveal validation errors)
        try:
            result = limesurvey_client.activate_survey(survey_id)
            print(f"\n✓ Survey activated successfully")
            print(f"  Activation result: {result}")

            # Get activation status
            properties = limesurvey_client.get_survey_properties(survey_id, ['active'])
            assert properties.get('active') in ['Y', True, 1], "Survey should be active"

        except Exception as e:
            validation_issues.append(f"Activation failed: {str(e)}")
            print(f"\n✗ Survey activation failed: {e}")

        # Assert no validation issues found
        if validation_issues:
            pytest.fail(f"Validation issues found:\n" + "\n".join(validation_issues))

        print(f"\n✓ All validation checks passed for {len(questions)} questions")

        # Generate a survey logic summary (similar to LimeSurvey's Survey Logic view)
        print("\n\n=== Survey Logic Summary ===")
        for question in questions:
            qid = question.get('qid') if isinstance(question, dict) else question.qid
            title = question.get('title') if isinstance(question, dict) else question.title

            try:
                props = limesurvey_client.get_question_properties(qid)

                has_logic = False

                # Check for relevance
                if props.get('relevance') and props['relevance'] not in ['1', '']:
                    if not has_logic:
                        print(f"\nQuestion: {title} (QID: {qid})")
                        has_logic = True
                    print(f"  Relevance: {props['relevance']}")

                # Check for validation
                if props.get('preg'):
                    if not has_logic:
                        print(f"\nQuestion: {title} (QID: {qid})")
                        has_logic = True
                    print(f"  Validation: {props['preg']}")

                # Check if mandatory
                if props.get('mandatory') == 'Y':
                    if not has_logic:
                        print(f"\nQuestion: {title} (QID: {qid})")
                        has_logic = True
                    print(f"  Mandatory: Yes")

            except Exception as e:
                continue

    finally:
        # Cleanup
        limesurvey_client.delete_survey(survey_id)


def test_all_generated_surveys(limesurvey_client: Client, generated_files_dir: Path):
    """Test that all generated TSV files can be imported without errors"""
    tsv_files = list(generated_files_dir.glob("*.tsv"))

    if not tsv_files:
        pytest.skip("No TSV files found")

    imported_successfully = []
    failed_imports = []

    for tsv_path in tsv_files:
        try:
            with open(tsv_path, 'rb') as f:
                survey_id = limesurvey_client.import_survey(
                    f,
                    file_type="txt",
                    survey_name=f"Test - {tsv_path.stem}"
                )

            assert survey_id > 0

            # Quick verification
            properties = limesurvey_client.get_survey_properties(survey_id)
            assert properties is not None

            # Cleanup
            limesurvey_client.delete_survey(survey_id)

            imported_successfully.append(tsv_path.name)

        except Exception as e:
            failed_imports.append((tsv_path.name, str(e)))

    # Print summary
    print(f"\n\nImport Summary:")
    print(f"  ✓ Successful: {len(imported_successfully)}/{len(tsv_files)}")
    for name in imported_successfully:
        print(f"    - {name}")

    if failed_imports:
        print(f"\n  ✗ Failed: {len(failed_imports)}")
        for name, error in failed_imports:
            print(f"    - {name}: {error}")

    # All imports should succeed
    assert len(failed_imports) == 0, f"{len(failed_imports)} imports failed"
