"""
Encryption Engine - Enterprise Grade
Combines multiple encryption methods
"""

from caesar_cipher import CaesarCipher
from vigenere_cipher import VigenereCipher
from utils import EncryptionUtils
import hashlib
import base64
from datetime import datetime
import json
import os

class EncryptionEngine:
    """
    Professional encryption engine with multiple cipher support
    """
    
    def __init__(self):
        """Initialize encryption engine"""
        self.utils = EncryptionUtils()
        self.history = []
        self.load_history()
    
    def load_history(self):
        """Load history from file if exists"""
        try:
            if os.path.exists('encryption_history.json'):
                with open('encryption_history.json', 'r') as f:
                    self.history = json.load(f)
        except:
            self.history = []
    
    def save_history(self):
        """Save history to file"""
        try:
            with open('encryption_history.json', 'w') as f:
                json.dump(self.history, f, indent=2)
        except:
            pass
    
    def encrypt_with_caesar(self, text: str, shift: int = 3) -> dict:
        """
        Encrypt text using Caesar cipher
        
        Returns:
            dict: Complete encryption result with metadata
        """
        try:
            cipher = CaesarCipher(shift)
            encrypted = cipher.encrypt(text)
            decrypted = cipher.decrypt(encrypted)
            
            result = {
                'method': 'Caesar Cipher',
                'original': text,
                'encrypted': encrypted,
                'decrypted': decrypted,
                'shift': shift,
                'timestamp': datetime.now().isoformat(),
                'hash': self._generate_hash(encrypted),
                'status': 'success'
            }
            
            self.history.append(result)
            self.save_history()
            return result
        except Exception as e:
            return {
                'method': 'Caesar Cipher',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def encrypt_with_vigenere(self, text: str, key: str) -> dict:
        """
        Encrypt text using Vigenere cipher
        
        Returns:
            dict: Complete encryption result with metadata
        """
        try:
            cipher = VigenereCipher(key)
            encrypted = cipher.encrypt(text)
            decrypted = cipher.decrypt(encrypted)
            
            result = {
                'method': 'Vigenere Cipher',
                'original': text,
                'encrypted': encrypted,
                'decrypted': decrypted,
                'key': key,
                'timestamp': datetime.now().isoformat(),
                'hash': self._generate_hash(encrypted),
                'status': 'success'
            }
            
            self.history.append(result)
            self.save_history()
            return result
        except Exception as e:
            return {
                'method': 'Vigenere Cipher',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def hybrid_encrypt(self, text: str, shift: int = 3, key: str = 'KEY') -> dict:
        """
        Hybrid encryption using both Caesar and Vigenere
        
        Returns:
            dict: Complete encryption result with metadata
        """
        try:
            # First encrypt with Caesar
            caesar = CaesarCipher(shift)
            caesar_encrypted = caesar.encrypt(text)
            
            # Then encrypt with Vigenere
            vigenere = VigenereCipher(key)
            final_encrypted = vigenere.encrypt(caesar_encrypted)
            
            # Decrypt in reverse order
            vigenere_decrypted = vigenere.decrypt(final_encrypted)
            final_decrypted = caesar.decrypt(vigenere_decrypted)
            
            result = {
                'method': 'Hybrid (Caesar + Vigenere)',
                'original': text,
                'encrypted': final_encrypted,
                'decrypted': final_decrypted,
                'shift': shift,
                'key': key,
                'timestamp': datetime.now().isoformat(),
                'hash': self._generate_hash(final_encrypted),
                'intermediate_encryption': caesar_encrypted,
                'status': 'success'
            }
            
            self.history.append(result)
            self.save_history()
            return result
        except Exception as e:
            return {
                'method': 'Hybrid (Caesar + Vigenere)',
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _generate_hash(self, text: str) -> str:
        """Generate SHA-256 hash of text"""
        return hashlib.sha256(text.encode()).hexdigest()
    
    def export_history(self, filename: str = 'encryption_history.json'):
        """Export encryption history to JSON file"""
        try:
            with open(filename, 'w') as f:
                json.dump(self.history, f, indent=2)
            return {"status": "success", "filename": filename, "count": len(self.history)}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def get_stats(self) -> dict:
        """Get encryption statistics"""
        methods = {}
        total_success = 0
        
        for entry in self.history:
            if entry.get('status') == 'success':
                total_success += 1
                method = entry['method']
                methods[method] = methods.get(method, 0) + 1
        
        return {
            'total_operations': len(self.history),
            'successful_operations': total_success,
            'methods_used': methods,
            'last_operation': self.history[-1]['timestamp'] if self.history else None,
            'success_rate': f"{(total_success/len(self.history)*100):.1f}%" if self.history else "0%"
        }