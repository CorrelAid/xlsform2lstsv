"""
Integration tests for XLSX-based survey fixtures.
Tests TSV generation from real-world XLSX files and validates structure.
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
    extract_languages_from_tsv,
    verify_multilingual_content,
    read_tsv_content,
    cleanup_survey,
)


# ===========================
# testB.xlsx TSV tests
# ===========================


def test_testB_tsv_generated(generated_files_dir: Path):
    """Verify that testB.tsv was generated from testB.xlsx."""
    tsv_path = generated_files_dir / "testB.tsv"
    assert tsv_path.exists(), f"testB.tsv was not generated in {generated_files_dir}"
    print(f"✓ testB.tsv generated successfully")


def test_testB_languages(generated_files_dir: Path):
    """Verify testB.tsv contains both German and English."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    languages = extract_languages_from_tsv(tsv_path)
    assert "de" in languages, "Expected German (de) language"
    assert "en" in languages, "Expected English (en) language"
    print(f"✓ Found languages: {languages}")


def test_testB_no_metadata_types(generated_files_dir: Path):
    """Verify start/end metadata types are not in the output."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    content = read_tsv_content(tsv_path)
    lines = content.strip().split("\n")

    for line in lines:
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        # type/scale column - check no rows have 'start' or 'end' as their type
        row_class = parts[0]
        if row_class == "Q":
            type_scale = parts[1]
            assert type_scale != "start", "start metadata type should not appear"
            assert type_scale != "end", "end metadata type should not appear"

    print("✓ No start/end metadata types in output")


def test_testB_matrix_questions(generated_files_dir: Path):
    """Verify matrix questions (type F) are generated for label/list-nolabel patterns."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    content = read_tsv_content(tsv_path)
    lines = content.strip().split("\n")

    # Find Q rows with type F (Array/Matrix)
    matrix_questions = []
    subquestions = []
    answer_rows = []

    for line in lines:
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        row_class = parts[0]
        row_type = parts[1]
        row_name = parts[2]

        if row_class == "Q" and row_type == "F":
            matrix_questions.append(row_name)
        elif row_class == "SQ":
            subquestions.append(row_name)
        elif row_class == "A":
            answer_rows.append(row_name)

    # testB has 3 matrix question groups: tools, techniques, topics
    assert len(matrix_questions) >= 3, (
        f"Expected at least 3 matrix questions (type F), got {len(matrix_questions)}: {matrix_questions}"
    )

    # Each matrix should have subquestions
    assert len(subquestions) > 0, "Expected subquestions (SQ rows) for matrix questions"

    # Matrix questions should share answer options
    assert len(answer_rows) > 0, "Expected answer rows (A rows) for matrix questions"

    print(f"✓ Matrix questions: {len(matrix_questions)}")
    print(f"  - Subquestions: {len(subquestions)}")
    print(f"  - Answer options: {len(answer_rows)}")


def test_testB_multilingual_content(generated_files_dir: Path):
    """Verify testB.tsv contains expected German and English content."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    content = read_tsv_content(tsv_path)

    # Check for German content
    assert "Deutsch" in content or "Anfänger" in content or "Deine" in content, (
        "Expected German content in testB.tsv"
    )

    # Check for English content
    assert "English" in content or "Beginner" in content or "Your" in content, (
        "Expected English content in testB.tsv"
    )

    print("✓ Multilingual content verified (de + en)")


def test_testB_groups(generated_files_dir: Path):
    """Verify testB.tsv contains expected question groups."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    content = read_tsv_content(tsv_path)
    lines = content.strip().split("\n")

    group_names = set()
    for line in lines:
        parts = line.split("\t")
        if len(parts) >= 3 and parts[0] == "G":
            group_names.add(parts[2])

    # testB.xlsx has 7 begin_group rows
    assert len(group_names) >= 5, (
        f"Expected at least 5 groups, got {len(group_names)}: {group_names}"
    )

    print(f"✓ Found {len(group_names)} groups: {group_names}")


def test_testB_relevance_expressions(generated_files_dir: Path):
    """Verify relevance expressions are transpiled (not raw XLSForm syntax)."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    content = read_tsv_content(tsv_path)

    # Raw XLSForm ${variable} references should NOT appear in the output
    assert "${" not in content, (
        "Raw XLSForm variable references (${...}) should be transpiled"
    )

    print("✓ Relevance expressions transpiled (no raw ${...} references)")


def test_testB_import(limesurvey_client: Client, generated_files_dir: Path):
    """Test import of testB.tsv into LimeSurvey."""
    tsv_path = generated_files_dir / "testB.tsv"
    if not tsv_path.exists():
        pytest.skip("testB.tsv not found")

    survey_id = import_survey_from_tsv(
        limesurvey_client,
        tsv_path,
        "testB XLSX Integration Test"
    )

    try:
        verify_survey_import(limesurvey_client, survey_id)
        print(f"\n✓ testB survey imported successfully (ID: {survey_id})")
    finally:
        cleanup_survey(limesurvey_client, survey_id)
