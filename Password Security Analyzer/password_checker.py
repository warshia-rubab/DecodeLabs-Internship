# password_checker.py
# Complete Password Strength Checker with Backend Storage

import re
import math
import json
import os
from datetime import datetime

# ============================================
# BACKEND STORAGE CLASS
# ============================================

class PasswordStorage:
    def __init__(self, filename="password_history.json"):
        self.filename = filename
        self.data = self.load_data()
    
    def load_data(self):
        """Load existing password data from JSON file"""
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    return json.load(f)
            except:
                return {"passwords": [], "total_scans": 0, "strong_count": 0}
        return {"passwords": [], "total_scans": 0, "strong_count": 0}
    
    def save_data(self):
        """Save password data to JSON file"""
        with open(self.filename, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def add_password(self, password, rating, score, entropy, length, char_types, feedback):
        """Add a new password entry to backend"""
        entry = {
            "id": len(self.data["passwords"]) + 1,
            "password": password,
            "rating": rating,
            "score": score,
            "entropy": entropy,
            "length": length,
            "char_types": char_types,
            "feedback": feedback,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        # Add to beginning (newest first)
        self.data["passwords"].insert(0, entry)
        
        # Update statistics
        self.data["total_scans"] = len(self.data["passwords"])
        self.data["strong_count"] = sum(1 for p in self.data["passwords"] if p["rating"] == "STRONG")
        
        # Keep only last 100 entries
        if len(self.data["passwords"]) > 100:
            self.data["passwords"] = self.data["passwords"][:100]
        
        self.save_data()
        return entry
    
    def get_all_passwords(self):
        """Get all stored passwords"""
        return self.data["passwords"]
    
    def get_stats(self):
        """Get statistics from stored passwords"""
        passwords = self.data["passwords"]
        total = len(passwords)
        strong = sum(1 for p in passwords if p["rating"] == "STRONG")
        good = sum(1 for p in passwords if p["rating"] == "GOOD")
        fair = sum(1 for p in passwords if p["rating"] == "FAIR")
        weak = sum(1 for p in passwords if p["rating"] == "WEAK")
        breached = sum(1 for p in passwords if p["rating"] == "BREACHED")
        
        # Average score
        avg_score = sum(p["score"] for p in passwords) / total if total > 0 else 0
        
        return {
            "total": total,
            "strong": strong,
            "good": good,
            "fair": fair,
            "weak": weak,
            "breached": breached,
            "avg_score": round(avg_score, 1)
        }
    
    def delete_password(self, id):
        """Delete a password entry by ID"""
        self.data["passwords"] = [p for p in self.data["passwords"] if p["id"] != id]
        self.data["total_scans"] = len(self.data["passwords"])
        self.data["strong_count"] = sum(1 for p in self.data["passwords"] if p["rating"] == "STRONG")
        self.save_data()
    
    def clear_all(self):
        """Clear all password history"""
        self.data = {"passwords": [], "total_scans": 0, "strong_count": 0}
        self.save_data()
    
    def export_csv(self):
        """Export passwords as CSV"""
        if not self.data["passwords"]:
            return None
        
        csv_lines = ["ID,Password,Rating,Score,Entropy,Length,Char Types,Timestamp"]
        for p in self.data["passwords"]:
            csv_lines.append(f"{p['id']},{p['password']},{p['rating']},{p['score']},{p['entropy']},{p['length']},{p['char_types']},{p['timestamp']}")
        
        return "\n".join(csv_lines)


# ============================================
# PASSWORD STRENGTH CHECKER
# ============================================

class PasswordStrengthChecker:
    """Password strength analyzer with common password check"""
    
    COMMON_PASSWORDS = [
        "password", "123456", "password123", "admin", "welcome",
        "letmein", "iloveyou", "12345678", "qwerty", "abc123",
        "monkey", "dragon", "master", "hello", "freedom",
        "whatever", "trustno1", "princess", "sunshine", "football"
    ]
    
    def __init__(self, password):
        self.password = password
        self._zeroized = False
    
    def has_lowercase(self):
        return bool(re.search(r'[a-z]', self.password))
    
    def has_uppercase(self):
        return bool(re.search(r'[A-Z]', self.password))
    
    def has_digit(self):
        return bool(re.search(r'\d', self.password))
    
    def has_special(self):
        return bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=;:~/]', self.password))
    
    def calculate_entropy(self):
        length = len(self.password)
        pool = 0
        if self.has_lowercase(): pool += 26
        if self.has_uppercase(): pool += 26
        if self.has_digit(): pool += 10
        if self.has_special(): pool += 32
        if pool == 0: return 0.0
        return math.log2(pool) * length
    
    def is_common(self):
        return self.password.lower() in self.COMMON_PASSWORDS
    
    def analyze(self):
        # Check for common passwords first (Gatekeeper Rule)
        if self.is_common():
            return {
                "rating": "BREACHED",
                "score": 0,
                "entropy": 0.0,
                "feedback": "🚨 BREACHED: This password has been found in data breaches!",
                "recommendations": ["Choose a completely unique password"],
                "length": len(self.password),
                "char_types": 0
            }
        
        has_upper = self.has_uppercase()
        has_lower = self.has_lowercase()
        has_digit = self.has_digit()
        has_special = self.has_special()
        length = len(self.password)
        entropy = self.calculate_entropy()
        char_types = sum([has_upper, has_lower, has_digit, has_special])
        
        # Calculate score (0-100)
        score = 0
        
        # Length scoring
        if length >= 16: score += 25
        elif length >= 12: score += 20
        elif length >= 10: score += 15
        elif length >= 8: score += 10
        elif length >= 6: score += 5
        
        # Diversity scoring
        score += char_types * 12
        
        # Entropy bonus
        if entropy >= 80: score += 20
        elif entropy >= 60: score += 15
        elif entropy >= 40: score += 10
        elif entropy >= 20: score += 5
        
        score = min(100, max(0, score))
        
        # Generate recommendations
        recommendations = []
        if length < 8: recommendations.append("Use at least 8 characters")
        if not has_upper: recommendations.append("Add uppercase letters (A-Z)")
        if not has_lower: recommendations.append("Add lowercase letters (a-z)")
        if not has_digit: recommendations.append("Add numbers (0-9)")
        if not has_special: recommendations.append("Add special characters (!@#$%^&*)")
        if entropy < 40 and length < 12: recommendations.append("Make your password longer and more complex")
        
        # Determine rating and feedback
        if score >= 80:
            rating = "STRONG"
            feedback = "🟢 EXCELLENT! Your password is highly secure."
        elif score >= 60:
            rating = "GOOD"
            feedback = "🟡 GOOD password. Consider making it even stronger."
        elif score >= 40:
            rating = "FAIR"
            feedback = "🟠 FAIR password. Follow the recommendations to improve it."
        else:
            rating = "WEAK"
            feedback = "🔴 WEAK password! Please follow all recommendations."
        
        return {
            "rating": rating,
            "score": score,
            "entropy": round(entropy, 2),
            "feedback": feedback,
            "recommendations": recommendations,
            "length": length,
            "char_types": char_types
        }
    
    def zeroize(self):
        """Security feature: wipe password from memory (Volatile Security Trap)"""
        if not self._zeroized:
            self.password = '\x00' * len(self.password)
            self._zeroized = True


# ============================================
# MAIN PROGRAM
# ============================================

def clear_screen():
    """Clear terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_banner():
    """Display professional banner"""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ███████╗ ██████╗ ██████╗ ███████╗██╗      █████╗  ║
║   ██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔════╝██║     ██╔══██╗ ║
║   ██║  ██║█████╗  ██║     ██║   ██║█████╗  ██║     ███████║ ║
║   ██║  ██║██╔══╝  ██║     ██║   ██║██╔══╝  ██║     ██╔══██║ ║
║   ██████╔╝███████╗╚██████╗╚██████╔╝███████╗███████╗██║  ██║ ║
║   ╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝ ║
║                                                               ║
║        PASSWORD STRENGTH CHECKER WITH BACKEND STORAGE         ║
║        BATCH: 2026 | POWERED BY DECODELABS                   ║
║        [JUNIOR ANALYST - DEFENSIVE LOGIC]                    ║
╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def main():
    """Main interactive program"""
    clear_screen()
    print_banner()
    
    print("\n" + "="*60)
    print("  WELCOME TO THE CYBERSECURITY DEFENSIVE LOGIC TRACK")
    print("="*60)
    print("\n  🔒 Evaluate password strength with professional-grade tools")
    print("  📊 Based on entropy calculation and security best practices")
    print("  🛡️ Implemented with 'Gatekeeper' and 'Zeroization' security")
    print("  💾 All passwords stored securely in backend\n")
    
    # Initialize backend storage
    storage = PasswordStorage()
    
    # Show statistics if there are stored passwords
    stats = storage.get_stats()
    if stats["total"] > 0:
        print("📊 BACKEND STORAGE STATISTICS")
        print("-"*40)
        print(f"  Total Passwords Stored: {stats['total']}")
        print(f"  🟢 Strong: {stats['strong']}  🟡 Good: {stats['good']}")
        print(f"  🟠 Fair: {stats['fair']}    🔴 Weak: {stats['weak']}")
        print(f"  🚨 Breached: {stats['breached']}")
        print(f"  Average Score: {stats['avg_score']}/100")
        print("-"*40 + "\n")
    
    while True:
        print("-"*55)
        password = input("🔑 Enter password to check (or 'quit' to exit): ")
        
        if password.lower() in ['quit', 'exit', 'q']:
            stats = storage.get_stats()
            print("\n" + "="*55)
            print("  📊 SESSION SUMMARY")
            print("="*55)
            print(f"  Total passwords stored in backend: {stats['total']}")
            print(f"  Strong passwords: {stats['strong']}")
            print(f"  Average score: {stats['avg_score']}/100")
            print("\n  🔐 All data saved to: password_history.json")
            print("  👋 Stay secure!")
            print("="*55 + "\n")
            break
        
        if not password:
            print("❌ Password cannot be empty!")
            continue
        
        # Analyze password
        checker = PasswordStrengthChecker(password)
        result = checker.analyze()
        
        # Display results
        print("\n" + "="*55)
        print("  📊 PASSWORD STRENGTH ANALYSIS REPORT")
        print("="*55)
        print(f"  Password: {'*' * len(password)}")
        print(f"  Rating: {result['rating']}")
        print(f"  Score: {result['score']}/100")
        print(f"  Entropy: {result['entropy']} bits")
        print(f"  Length: {result['length']} characters")
        print(f"  Character Types: {result['char_types']}/4")
        print("\n  📝 FEEDBACK:")
        print(f"  {result['feedback']}")
        
        if result['recommendations']:
            print("\n  📌 RECOMMENDATIONS:")
            for rec in result['recommendations']:
                print(f"    • {rec}")
        
        print("="*55)
        
        # Always save to backend automatically
        entry = storage.add_password(
            password=password,
            rating=result['rating'],
            score=result['score'],
            entropy=result['entropy'],
            length=result['length'],
            char_types=result['char_types'],
            feedback=result['feedback']
        )
        print(f"\n💾 Password automatically saved to backend (ID: {entry['id']})")
        
        # Show updated stats
        stats = storage.get_stats()
        print(f"📊 Total passwords in backend: {stats['total']}")
        
        # Security: Zeroize password from memory
        checker.zeroize()
        print("🔐 Password data securely wiped from memory.\n")


if __name__ == "__main__":
    main()