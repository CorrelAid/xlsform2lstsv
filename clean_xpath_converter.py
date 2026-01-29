#!/usr/bin/env python3

import re

def remove_duplicate_methods():
    with open('src/utils/xpathToExpressionScript.ts', 'r') as f:
        content = f.read()
    
    # Methods to remove (these are now in the base class)
    methods_to_remove = [
        r'private convertSelectedFunctions.*?\n    \}',
        r'private convertFieldReferences.*?\n    \}',
        r'private convertComparisonOperators.*?\n    \}',
        r'private convertBooleanOperators.*?\n    \}',
        r'private convertCurrentFieldReferences.*?\n    \}'
    ]
    
    for method_pattern in methods_to_remove:
        # Use re.DOTALL to match across multiple lines
        content = re.sub(method_pattern, '', content, flags=re.DOTALL)
    
    with open('src/utils/xpathToExpressionScript.ts', 'w') as f:
        f.write(content)
    
    print("Duplicate methods removed successfully!")

if __name__ == "__main__":
    remove_duplicate_methods()