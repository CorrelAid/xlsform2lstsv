#!/usr/bin/env python3
"""
Test script to verify the updated choice validation functionality.
"""
import time
from pathlib import Path
from citric import Client
import requests

def get_limesurvey_client():
    """Get an authenticated LimeSurvey client."""
    limesurvey_url = "http://localhost:8080/index.php/admin/remotecontrol"
    base_url = limesurvey_url.replace("/index.php/admin/remotecontrol", "")
    
    # Wait for LimeSurvey to be ready
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
    
    return Client(limesurvey_url, "admin", "admin")

def test_updated_choice_counting():
    """Test the updated choice counting functionality."""
    client = get_limesurvey_client()
    
    # Import a survey
    tsv_path = Path("tests/integration/output/comprehensiveSurvey.tsv")
    
    with open(tsv_path, 'rb') as f:
        survey_id = client.import_survey(f, file_type="txt", survey_name="Test Choice Counting")
    
    print(f"Imported survey with ID: {survey_id}")
    
    # Test the updated function
    from tests.integration.test_helpers import get_imported_choice_count
    
    imported_choice_count = get_imported_choice_count(client, survey_id)
    print(f"Imported choice count: {imported_choice_count}")
    
    # Compare with expected count from TSV
    from tests.integration.test_helpers import get_expected_choice_count_from_tsv
    
    expected_choice_count = get_expected_choice_count_from_tsv(tsv_path)
    print(f"Expected choice count: {expected_choice_count}")
    
    # Check if they match
    if imported_choice_count == expected_choice_count:
        print("✓ Choice counts match!")
    else:
        print(f"✗ Choice counts don't match: expected {expected_choice_count}, got {imported_choice_count}")
    
    # Clean up
    try:
        client.delete_survey(survey_id)
        print(f"Deleted survey {survey_id}")
    except Exception as e:
        print(f"Warning: Could not delete survey {survey_id}: {e}")

if __name__ == "__main__":
    test_updated_choice_counting()