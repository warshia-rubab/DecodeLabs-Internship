"""
Utility Functions for Encryption System
"""

import re
import string
from typing import List, Tuple, Dict

class EncryptionUtils:
    """
    Utility class for encryption operations
    """
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """Remove special characters and normalize text"""
        # Keep only alphanumeric and spaces
        return re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    @staticmethod
    def analyze_text(text: str) -> dict:
        """Analyze text characteristics"""
        return {
            'length': len(text),
            'letters': sum(c.isalpha() for c in text),
            'digits': sum(c.isdigit() for c in text),
            'spaces': sum(c.isspace() for c in text),
            'uppercase': sum(c.isupper() for c in text),
            'lowercase': sum(c.islower() for c in text)
        }
    
    @staticmethod
    def generate_key(length: int = 10) -> str:
        """Generate random encryption key"""
        import random
        return ''.join(random.choices(string.ascii_uppercase, k=length))
    
    @staticmethod
    def frequency_analysis(text: str) -> dict:
        """Perform letter frequency analysis"""
        # Remove non-alphabetic and convert to uppercase
        text = ''.join(c for c in text.upper() if c.isalpha())
        freq = {}
        
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        
        # Sort by frequency
        return dict(sorted(freq.items(), key=lambda x: x[1], reverse=True))
    
    @staticmethod
    def validate_shift(shift: int) -> int:
        """Validate and normalize shift value"""
        if not isinstance(shift, int):
            raise ValueError("Shift must be an integer")
        return shift % 26
    
    @staticmethod
    def contains_alpha(text: str) -> bool:
        """Check if text contains alphabetic characters"""
        return any(c.isalpha() for c in text)