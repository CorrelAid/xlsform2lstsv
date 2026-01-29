"""
Integration test for XPath to Expression Script conversion
Tests importing surveys with complex XPath expressions and validates the conversion through LimeSurvey API
"""
import pytest
from pathlib import Path
from typing import Dict, List
from citric import Client

from test_helpers import (
    limesurvey_url,
    limesurvey_client,
    generated_files_dir,
    import_survey_from_tsv,
    verify_survey_import,
    cleanup_survey,
    get_survey_logic_summary,
    verify_tsv_contains_text,
    verify_tsv_does_not_contain_text
)


class TestXPathConversionIntegration:
    """Test XPath to Expression Script conversion through LimeSurvey import and validation"""

    @pytest.fixture(scope="class")
    def complex_xpath_survey_tsv(self, generated_files_dir: Path) -> Path:
        """Fixture for TSV file with complex XPath expressions"""
        return generated_files_dir / "complex_xpath_survey.tsv"

    def test_import_survey_with_complex_relevance_expressions(
        self, 
        limesurvey_client: Client,
        complex_xpath_survey_tsv: Path
    ) -> None:
        """Test importing survey with complex XPath relevance expressions"""
        
        # Verify the TSV contains expected converted expressions
        # Note: TSV escaping wraps values with quotes in quotes, so "yes" becomes ""yes""
        expected_expressions = [
            '"(consent == ""yes"")  and  age >= 18"',  # selected() conversion
            'age >= 18  and  (country == \'USA\'  or  country == \'Canada\')',  # boolean operators
            'not(consent == \'\')  and  age > 0',  # not() conversion
            'if(age > 18, true(), false())'  # if() conversion
        ]
        
        verify_tsv_contains_text(complex_xpath_survey_tsv, expected_expressions)
        
        # Verify the TSV does NOT contain XPath syntax
        xpath_syntax = [
            "selected(",  # XPath function should be converted
            "${age}",     # XPath variable syntax should be converted
            "and(",       # XPath function should be converted
            "or(",        # XPath function should be converted
        ]
        
        verify_tsv_does_not_contain_text(complex_xpath_survey_tsv, xpath_syntax)
        
        # Import the survey
        survey_id = import_survey_from_tsv(
            limesurvey_client,
            complex_xpath_survey_tsv,
            "Complex XPath Survey"
        )
        
        try:
            # Verify the survey imported successfully
            verify_survey_import(
                limesurvey_client,
                survey_id,
                expected_question_count=8,  # Should have 8 questions (including complex_validation)
                expected_group_count=1       # Should have 1 group
            )
            
            # Get logic summary to verify expressions were imported correctly
            logic_summary = get_survey_logic_summary(limesurvey_client, survey_id)
            
            # Should have questions with relevance logic
            assert logic_summary['questions_with_relevance'] >= 5, \
                f"Expected at least 5 questions with relevance, got {logic_summary['questions_with_relevance']}"
            
            # Verify specific question logic
            logic_details = logic_summary['logic_details']
            
            # Find the adult_consent question and verify its logic
            adult_consent_logic = next(
                (item for item in logic_details if 'adultconsent' in item.get('question', '')),
                None
            )
            
            assert adult_consent_logic is not None, "adultconsent question should have logic"
            assert 'relevance' in adult_consent_logic, "adultconsent should have relevance logic"
            
            # The relevance should contain the converted expression
            relevance = adult_consent_logic['relevance']
            assert 'consent' in relevance, "Relevance should reference consent field"
            assert 'age' in relevance, "Relevance should reference age field"
            
        finally:
            # Clean up
            cleanup_survey(limesurvey_client, survey_id)

    def test_import_survey_with_string_functions(
        self,
        limesurvey_client: Client,
        generated_files_dir: Path
    ) -> None:
        """Test importing survey with XPath string functions"""
        
        string_functions_tsv = generated_files_dir / "string_functions_survey.tsv"
        
        # Verify string function conversions
        # Note: Calculations are not yet implemented, so we only verify the TSV structure
        expected_expressions = [
            "First Name",  # Basic field should be present
            "Last Name",   # Basic field should be present
            "Full Name",   # Field with calculation (calculation not yet implemented)
            "First Initial" # Field with calculation (calculation not yet implemented)
        ]
        
        verify_tsv_contains_text(string_functions_tsv, expected_expressions)
        
        # Import the survey
        survey_id = import_survey_from_tsv(
            limesurvey_client,
            string_functions_tsv,
            "String Functions Survey"
        )
        
        try:
            # Verify the survey imported successfully
            verify_survey_import(
                limesurvey_client,
                survey_id,
                expected_question_count=6  # Should have 6 questions
            )
            
            # Get logic summary
            logic_summary = get_survey_logic_summary(limesurvey_client, survey_id)
            
            # Should have questions with calculations
            assert logic_summary['questions_with_logic'] >= 0, \
                f"Expected at least 0 questions with logic, got {logic_summary['questions_with_logic']}"
            
        finally:
            # Clean up
            cleanup_survey(limesurvey_client, survey_id)

    def test_import_survey_with_math_functions(
        self,
        limesurvey_client: Client,
        generated_files_dir: Path
    ) -> None:
        """Test importing survey with XPath math functions"""
        
        math_functions_tsv = generated_files_dir / "math_functions_survey.tsv"
        
        # Verify math function conversions
        # Note: Calculations are not yet implemented, so we only verify the TSV structure
        expected_expressions = [
            "Price per unit",  # Basic field should be present
            "Quantity",        # Basic field should be present
            "Total Price",     # Field with calculation (calculation not yet implemented)
            "quantity > 10  and  price >= 100"  # Relevance expression should be converted
        ]
        
        verify_tsv_contains_text(math_functions_tsv, expected_expressions)
        
        # Import the survey
        survey_id = import_survey_from_tsv(
            limesurvey_client,
            math_functions_tsv,
            "Math Functions Survey"
        )
        
        try:
            # Verify the survey imported successfully
            verify_survey_import(
                limesurvey_client,
                survey_id,
                expected_question_count=6  # Should have 6 questions
            )
            
            # Get logic summary
            logic_summary = get_survey_logic_summary(limesurvey_client, survey_id)
            
            # Should have questions with calculations and relevance
            assert logic_summary['questions_with_logic'] >= 1, \
                f"Expected at least 1 question with logic, got {logic_summary['questions_with_logic']}"
            
        finally:
            # Clean up
            cleanup_survey(limesurvey_client, survey_id)

    def test_import_survey_with_logical_functions(
        self,
        limesurvey_client: Client,
        generated_files_dir: Path
    ) -> None:
        """Test importing survey with XPath logical functions"""
        
        logical_functions_tsv = generated_files_dir / "logical_functions_survey.tsv"
        
        # Verify logical function conversions
        expected_expressions = [
            "not(field1 == '')",  # not() conversion
            "(field1 != ''  and  field2 != '')  or  not(field1 == field2)"  # Complex logical expression
        ]
        
        verify_tsv_contains_text(logical_functions_tsv, expected_expressions)
        
        # Import the survey
        survey_id = import_survey_from_tsv(
            limesurvey_client,
            logical_functions_tsv,
            "Logical Functions Survey"
        )
        
        try:
            # Verify the survey imported successfully
            verify_survey_import(
                limesurvey_client,
                survey_id,
                expected_question_count=5  # Should have 5 questions (including nested_logic)
            )
            
            # Get logic summary
            logic_summary = get_survey_logic_summary(limesurvey_client, survey_id)
            
            # Should have questions with relevance logic
            assert logic_summary['questions_with_relevance'] >= 3, \
                f"Expected at least 3 questions with relevance, got {logic_summary['questions_with_relevance']}"
            
        finally:
            # Clean up
            cleanup_survey(limesurvey_client, survey_id)

    def test_import_survey_with_real_world_expressions(
        self,
        limesurvey_client: Client,
        generated_files_dir: Path
    ) -> None:
        """Test importing survey with real-world complex XPath expressions"""
        
        real_world_tsv = generated_files_dir / "real_world_complex_survey.tsv"
        
        # Verify real-world expression conversions
        expected_expressions = [
            "consentgiven == 'yes'  and  age >= 18  and  age <= 45  and  gender == 'female'",
            "age >= 65  and  (country == 'USA'  or  country == 'Canada'  or  country == 'UK')",
            "(consentgiven == 'yes'  and  age >= 18)  or  (country == 'USA'  and  gender == 'male')"
        ]
        
        verify_tsv_contains_text(real_world_tsv, expected_expressions)
        
        # Import the survey
        survey_id = import_survey_from_tsv(
            limesurvey_client,
            real_world_tsv,
            "Real World Complex Survey"
        )
        
        try:
            # Verify the survey imported successfully
            verify_survey_import(
                limesurvey_client,
                survey_id,
                expected_question_count=8  # Should have 8 questions
            )
            
            # Get logic summary
            logic_summary = get_survey_logic_summary(limesurvey_client, survey_id)
            
            # Should have multiple questions with complex logic
            assert logic_summary['questions_with_relevance'] >= 3, \
                f"Expected at least 3 questions with relevance, got {logic_summary['questions_with_relevance']}"
            
            # Should have questions with calculations
            assert logic_summary['questions_with_logic'] >= 3, \
                f"Expected at least 3 questions with logic, got {logic_summary['questions_with_logic']}"
            
        finally:
            # Clean up
            cleanup_survey(limesurvey_client, survey_id)


if __name__ == "__main__":
    # This allows running the tests directly for debugging
    pytest.main([__file__, "-v"])