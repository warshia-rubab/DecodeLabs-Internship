"""
Caesar Cipher Implementation - Professional Grade
"""

class CaesarCipher:
    """
    Advanced Caesar Cipher with enterprise features
    """
    
    def __init__(self, shift=3):
        """
        Initialize Caesar cipher with shift value
        
        Args:
            shift (int): Shift value for encryption/decryption
        """
        self.shift = shift
        self._validate_shift()
    
    def _validate_shift(self):
        """Validate shift value is within range"""
        if not isinstance(self.shift, int):
            raise ValueError("Shift must be an integer")
        self.shift = self.shift % 26  # Normalize shift
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext using Caesar cipher
        
        Args:
            plaintext (str): Text to encrypt
            
        Returns:
            str: Encrypted text
        """
        ciphertext = []
        
        for char in plaintext:
            if char.isalpha():
                # Preserve case
                base = ord('A') if char.isupper() else ord('a')
                # Shift and wrap around using modulo
                shifted = (ord(char) - base + self.shift) % 26
                ciphertext.append(chr(base + shifted))
            else:
                # Preserve non-alphabetic characters
                ciphertext.append(char)
        
        return ''.join(ciphertext)
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt ciphertext using Caesar cipher
        
        Args:
            ciphertext (str): Text to decrypt
            
        Returns:
            str: Decrypted text
        """
        # Decryption is encryption with negative shift
        decrypter = CaesarCipher(-self.shift)
        return decrypter.encrypt(ciphertext)
    
    def brute_force(self, ciphertext: str) -> list:
        """
        Perform brute force attack on ciphertext
        
        Args:
            ciphertext (str): Encrypted text
            
        Returns:
            list: All possible decryptions with their scores
        """
        results = []
        
        for shift in range(26):
            decrypter = CaesarCipher(shift)
            decrypted = decrypter.decrypt(ciphertext)
            # Score using English letter frequency
            score = self._frequency_score(decrypted)
            results.append({
                'shift': shift,
                'text': decrypted,
                'score': score
            })
        
        # Sort by score (higher is better)
        results.sort(key=lambda x: x['score'], reverse=True)
        return results
    
    def _frequency_score(self, text: str) -> float:
        """
        Score text based on English letter frequency
        
        Args:
            text (str): Text to score
            
        Returns:
            float: Frequency score
        """
        # English letter frequency (most common to least)
        freq = 'ETAOINSHRDLCUMWFGYPBVKJXQZ'
        score = 0
        
        for char in text.upper():
            if char in freq:
                score += 26 - freq.index(char)
        
        return score