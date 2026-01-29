#!/usr/bin/env python3
"""
Debug script to check the multilanguage survey specifically.
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

def debug_multilanguage():
    """Debug the multilanguage survey."""
    client = get_limesurvey_client()
    
    # Import the multilanguage survey
    tsv_path = Path("tests/integration/output/multilanguage_survey.tsv")
    
    with open(tsv_path, 'rb') as f:
        survey_id = client.import_survey(f, file_type="txt", survey_name="Debug Multilanguage")
    
    print(f"Imported survey with ID: {survey_id}")
    
    # Get expected choice count
    from tests.integration.test_helpers import get_expected_choice_count_from_tsv
    expected_choice_count = get_expected_choice_count_from_tsv(tsv_path)
    print(f"Expected choice count: {expected_choice_count}")
    
    # Get imported choice count with detailed debugging
    questions = client.list_questions(survey_id)
    total_choices = 0
    
    for question in questions:
        qid = question.get('qid') if isinstance(question, dict) else question.qid
        title = question.get('title') if isinstance(question, dict) else question.title
        parent_qid = question.get('parent_qid') if isinstance(question, dict) else getattr(question, 'parent_qid', 0)
        
        # Only count choices for parent questions (not subquestions)
        if parent_qid and parent_qid != 0 and parent_qid != '0':
            continue
            
        try:
            props = client.get_question_properties(qid)
            
            # Count subquestions as choices for multiple-choice questions
            subquestions = [q for q in questions 
                          if (q.get('parent_qid') if isinstance(q, dict) else getattr(q, 'parent_qid', 0)) == qid]
            
            if subquestions:
                total_choices += len(subquestions)
                print(f"Question '{title}': {len(subquestions)} subquestions")
            else:
                # For questions without subquestions, check both available_answers and answeroptions
                counted_choices = False
                
                # First try available_answers field
                if 'available_answers' in props and props['available_answers']:
                    available_answers = props['available_answers']
                    
                    # Skip "No available answers" message
                    if available_answers == "No available answers":
                        pass  # Try answeroptions as fallback
                    else:
                        if isinstance(available_answers, str) and available_answers.strip():
                            answer_codes = available_answers.strip().split()
                            valid_codes = [code for code in answer_codes if code and code != '0']
                            if valid_codes:
                                total_choices += len(valid_codes)
                                print(f"Question '{title}': {len(valid_codes)} choices from available_answers")
                                counted_choices = True
                        elif isinstance(available_answers, dict):
                            valid_codes = [code for code in available_answers.keys() if code and code != '0']
                            if valid_codes:
                                total_choices += len(valid_codes)
                                print(f"Question '{title}': {len(valid_codes)} choices from available_answers dict")
                                counted_choices = True
                
                # If available_answers didn't work, try answeroptions as fallback
                if not counted_choices and 'answeroptions' in props and props['answeroptions']:
                    answeroptions = props['answeroptions']
                    
                    if answeroptions == "No available answers":
                        continue
                        
                    if isinstance(answeroptions, dict):
                        valid_answers = {k: v for k, v in answeroptions.items()
                                       if isinstance(v, dict) and v.get('answer')}
                        if valid_answers:
                            total_choices += len(valid_answers)
                            print(f"Question '{title}': {len(valid_answers)} choices from answeroptions")
        
        except Exception as e:
            print(f"Error counting choices for question '{title}': {e}")
            continue
    
    print(f"\nTotal choices counted: {total_choices}")
    print(f"Expected: {expected_choice_count}")
    print(f"Difference: {expected_choice_count - total_choices}")
    
    # Clean up
    try:
        client.delete_survey(survey_id)
        print(f"Deleted survey {survey_id}")
    except Exception as e:
        print(f"Warning: Could not delete survey {survey_id}: {e}")

if __name__ == "__main__":
    debug_multilanguage()