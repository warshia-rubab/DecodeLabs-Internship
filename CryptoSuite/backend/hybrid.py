"""
Hybrid Cipher - Combination of Caesar and Vigenere
"""

class HybridCipher:
    """Hybrid Cipher - Caesar + Vigenere combined"""
    
    def __init__(self, shift=3, key='KEY'):
        self.shift = shift
        self.key = key
    
    def _caesar_encrypt(self, text: str, shift: int) -> str:
        result = []
        for char in text:
            if char.isalpha():
                base = ord('A') if char.isupper() else ord('a')
                result.append(chr((ord(char) - base + shift) % 26 + base))
            else:
                result.append(char)
        return ''.join(result)
    
    def _caesar_decrypt(self, text: str, shift: int) -> str:
        return self._caesar_encrypt(text, -shift)
    
    def _vigenere_encrypt(self, text: str, key: str) -> str:
        key = key.upper()
        key_stream = (key * (len(text) // len(key) + 1))[:len(text)]
        result = []
        for i, char in enumerate(text):
            if char.isalpha():
                base = ord('A') if char.isupper() else ord('a')
                shift = ord(key_stream[i]) - ord('A')
                result.append(chr((ord(char) - base + shift) % 26 + base))
            else:
                result.append(char)
        return ''.join(result)
    
    def _vigenere_decrypt(self, text: str, key: str) -> str:
        key = key.upper()
        key_stream = (key * (len(text) // len(key) + 1))[:len(text)]
        result = []
        for i, char in enumerate(text):
            if char.isalpha():
                base = ord('A') if char.isupper() else ord('a')
                shift = ord(key_stream[i]) - ord('A')
                result.append(chr((ord(char) - base - shift) % 26 + base))
            else:
                result.append(char)
        return ''.join(result)
    
    def encrypt(self, text: str) -> str:
        """Encrypt using Caesar then Vigenere"""
        caesar_encrypted = self._caesar_encrypt(text, self.shift)
        return self._vigenere_encrypt(caesar_encrypted, self.key)
    
    def decrypt(self, text: str) -> str:
        """Decrypt using Vigenere then Caesar"""
        vigenere_decrypted = self._vigenere_decrypt(text, self.key)
        return self._caesar_decrypt(vigenere_decrypted, self.shift)