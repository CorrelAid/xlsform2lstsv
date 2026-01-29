#!/usr/bin/env python3
"""
Debug script to check if answer code length is causing import issues.
"""
from pathlib import Path
from tests.integration.test_helpers import parse_tsv_choices

def analyze_answer_code_lengths():
    """Analyze answer code lengths in TSV files."""
    
    tsv_files = [
        "tests/integration/output/comprehensiveSurvey.tsv",
        "tests/integration/output/multilanguage_survey.tsv",
        "tests/integration/output/complex_survey.tsv"
    ]
    
    for tsv_path in tsv_files:
        if not Path(tsv_path).exists():
            continue
            
        print(f"\n=== {Path(tsv_path).name} ===")
        
        # Parse the TSV file
        choices_by_question = parse_tsv_choices(tsv_path)
        
        # Read the full content to extract answer codes
        with open(tsv_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all answer option lines (A class)
        answer_codes = []
        for line in content.split('\n'):
            if line.startswith('A\t'):
                parts = line.split('\t')
                if len(parts) >= 3:
                    code = parts[2].strip()
                    answer_codes.append(code)
                    
                    # Check length
                    if len(code) > 5:
                        print(f"  ⚠️  Long code ({len(code)} chars): '{code}'")
        
        print(f"Total answer codes: {len(answer_codes)}")
        
        # Show distribution of code lengths
        length_counts = {}
        for code in answer_codes:
            length = len(code)
            length_counts[length] = length_counts.get(length, 0) + 1
        
        print(f"Code length distribution: {dict(sorted(length_counts.items()))}")
        
        # Check if any codes exceed 5 characters
        long_codes = [code for code in answer_codes if len(code) > 5]
        if long_codes:
            print(f"Long codes (>5 chars): {long_codes}")
        else:
            print("All codes are ≤5 characters")

if __name__ == "__main__":
    analyze_answer_code_lengths()