"""
Vigenere Cipher Implementation - Professional Grade
"""

class VigenereCipher:
    """
    Advanced Vigenere Cipher with key rotation
    """
    
    def __init__(self, key: str):
        """
        Initialize Vigenere cipher with key
        
        Args:
            key (str): Encryption key
        """
        self.key = key.upper()
        self._validate_key()
    
    def _validate_key(self):
        """Validate key contains only alphabetic characters"""
        if not self.key or not self.key.isalpha():
            raise ValueError("Key must contain only alphabetic characters")
    
    def _generate_key_stream(self, text_length: int) -> str:
        """
        Generate repeated key stream for text length
        
        Args:
            text_length (int): Length of text to encrypt
            
        Returns:
            str: Key stream
        """
        key_stream = ''
        key_index = 0
        
        for _ in range(text_length):
            key_stream += self.key[key_index]
            key_index = (key_index + 1) % len(self.key)
        
        return key_stream
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext using Vigenere cipher
        
        Args:
            plaintext (str): Text to encrypt
            
        Returns:
            str: Encrypted text
        """
        ciphertext = []
        key_stream = self._generate_key_stream(len(plaintext))
        
        for char, key_char in zip(plaintext, key_stream):
            if char.isalpha():
                # Preserve case
                base = ord('A') if char.isupper() else ord('a')
                # Vigenere encryption: (P + K) % 26
                shift = ord(key_char) - ord('A')
                shifted = (ord(char.upper()) - ord('A') + shift) % 26
                cipher_char = chr(ord('A') + shifted)
                # Preserve original case
                cipher_char = cipher_char if char.isupper() else cipher_char.lower()
                ciphertext.append(cipher_char)
            else:
                ciphertext.append(char)
        
        return ''.join(ciphertext)
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt ciphertext using Vigenere cipher
        
        Args:
            ciphertext (str): Text to decrypt
            
        Returns:
            str: Decrypted text
        """
        plaintext = []
        key_stream = self._generate_key_stream(len(ciphertext))
        
        for char, key_char in zip(ciphertext, key_stream):
            if char.isalpha():
                # Preserve case
                base = ord('A') if char.isupper() else ord('a')
                # Vigenere decryption: (C - K) % 26
                shift = ord(key_char) - ord('A')
                shifted = (ord(char.upper()) - ord('A') - shift) % 26
                plain_char = chr(ord('A') + shifted)
                # Preserve original case
                plain_char = plain_char if char.isupper() else plain_char.lower()
                plaintext.append(plain_char)
            else:
                plaintext.append(char)
        
        return ''.join(plaintext)