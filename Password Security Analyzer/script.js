// ============================================
// DECODELABS - PASSWORD SECURITY ANALYZER
// Advanced Cybersecurity Logic with Backend Storage
// ============================================

class PasswordAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.isConnected = false;
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/passwords`);
            if (response.ok) {
                this.isConnected = true;
                console.log('✅ Connected to backend server');
                return true;
            }
        } catch (error) {
            this.isConnected = false;
            console.log('⚠️ Backend not available - using localStorage fallback');
        }
        return false;
    }

    async savePassword(entry) {
        if (!this.isConnected) {
            return this.saveToLocalStorage(entry);
        }

        try {
            const response = await fetch(`${this.baseURL}/passwords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving to backend:', error);
            return this.saveToLocalStorage(entry);
        }
    }

    async getPasswords() {
        if (!this.isConnected) {
            return this.getFromLocalStorage();
        }

        try {
            const response = await fetch(`${this.baseURL}/passwords`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching from backend:', error);
            return this.getFromLocalStorage();
        }
    }

    async deletePassword(id) {
        if (!this.isConnected) {
            return this.deleteFromLocalStorage(id);
        }

        try {
            const response = await fetch(`${this.baseURL}/passwords/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting:', error);
            return this.deleteFromLocalStorage(id);
        }
    }

    async getStats() {
        if (!this.isConnected) {
            return this.getStatsFromLocalStorage();
        }

        try {
            const response = await fetch(`${this.baseURL}/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return this.getStatsFromLocalStorage();
        }
    }

    saveToLocalStorage(entry) {
        const key = 'decodelabs_password_history';
        let history = JSON.parse(localStorage.getItem(key) || '[]');
        history.unshift(entry);
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem(key, JSON.stringify(history));
        return { success: true, entry, fallback: true };
    }

    getFromLocalStorage() {
        const key = 'decodelabs_password_history';
        return { passwords: JSON.parse(localStorage.getItem(key) || '[]') };
    }

    deleteFromLocalStorage(id) {
        const key = 'decodelabs_password_history';
        let history = JSON.parse(localStorage.getItem(key) || '[]');
        history = history.filter(p => p.id !== id);
        localStorage.setItem(key, JSON.stringify(history));
        return { success: true };
    }

    getStatsFromLocalStorage() {
        const data = this.getFromLocalStorage();
        const passwords = data.passwords || [];
        const total = passwords.length;
        const strong = passwords.filter(p => p.rating === 'STRONG').length;
        const good = passwords.filter(p => p.rating === 'GOOD').length;
        const fair = passwords.filter(p => p.rating === 'FAIR').length;
        const weak = passwords.filter(p => p.rating === 'WEAK').length;
        const breached = passwords.filter(p => p.rating === 'BREACHED').length;
        const avgScore = total > 0 
            ? Math.round(passwords.reduce((sum, p) => sum + p.score, 0) / total) 
            : 0;
        return { total, strong, good, fair, weak, breached, avgScore };
    }
}

// ============================================
// ANALYZER LOGIC
// ============================================

class PasswordAnalyzer {
    constructor(password) {
        this.password = password;
        this.commonPasswords = [
            'password', '123456', 'password123', 'admin', 'welcome',
            'letmein', 'iloveyou', '12345678', 'qwerty', 'abc123',
            'monkey', 'dragon', 'master', 'hello', 'freedom',
            'whatever', 'trustno1', 'princess', 'sunshine', 'football'
        ];
    }

    hasLowercase() { return /[a-z]/.test(this.password); }
    hasUppercase() { return /[A-Z]/.test(this.password); }
    hasDigit() { return /\d/.test(this.password); }
    hasSpecial() { return /[!@#$%^&*(),.?":{}|<>_\-+=;:~/]/.test(this.password); }

    calculateEntropy() {
        const length = this.password.length;
        let poolSize = 0;
        if (this.hasLowercase()) poolSize += 26;
        if (this.hasUppercase()) poolSize += 26;
        if (this.hasDigit()) poolSize += 10;
        if (this.hasSpecial()) poolSize += 32;
        
        if (poolSize === 0) return 0;
        return Math.log2(poolSize) * length;
    }

    isCommon() {
        return this.commonPasswords.some(pw => 
            this.password.toLowerCase() === pw.toLowerCase()
        );
    }

    analyze() {
        if (this.isCommon()) {
            return {
                rating: 'BREACHED',
                score: 0,
                entropy: 0,
                feedback: '⚠️ This password has been found in data breaches! Choose a different one.',
                recommendations: ['Choose a completely unique password'],
                length: this.password.length,
                charTypes: 0,
                hasUpper: false,
                hasLower: false,
                hasDigit: false,
                hasSpecial: false
            };
        }

        const hasUpper = this.hasUppercase();
        const hasLower = this.hasLowercase();
        const hasDigit = this.hasDigit();
        const hasSpecial = this.hasSpecial();
        const length = this.password.length;
        const entropy = this.calculateEntropy();
        const charTypes = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

        let score = 0;
        
        if (length >= 16) score += 25;
        else if (length >= 12) score += 20;
        else if (length >= 10) score += 15;
        else if (length >= 8) score += 10;
        else if (length >= 6) score += 5;
        
        score += charTypes * 12;
        
        if (entropy >= 80) score += 20;
        else if (entropy >= 60) score += 15;
        else if (entropy >= 40) score += 10;
        else if (entropy >= 20) score += 5;
        
        score = Math.min(100, Math.max(0, score));

        let rating, feedback;

        if (score >= 80) {
            rating = 'STRONG';
            feedback = '🟢 Excellent! Your password is highly secure.';
        } else if (score >= 60) {
            rating = 'GOOD';
            feedback = '🟡 Good password. Consider making it even stronger.';
        } else if (score >= 40) {
            rating = 'FAIR';
            feedback = '🟠 Fair password. Follow the recommendations to improve it.';
        } else {
            rating = 'WEAK';
            feedback = '🔴 Weak password! Please follow all recommendations.';
        }

        return {
            rating,
            score,
            entropy: Math.round(entropy * 100) / 100,
            feedback,
            length,
            charTypes,
            hasUpper,
            hasLower,
            hasDigit,
            hasSpecial
        };
    }
}

// ============================================
// UI CONTROLLER
// ============================================

class PasswordCheckerUI {
    constructor() {
        this.api = new PasswordAPI();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeParticles();
        this.startClock();
        
        this.loadHistoryFromBackend();
        
        this.scanCount = 0;
        this.strongCount = 0;
        this.sessionStart = Date.now();
        this.isAnalyzed = false;
    }

    initializeElements() {
        this.elements = {
            passwordInput: document.getElementById('passwordInput'),
            toggleBtn: document.getElementById('toggleVisibility'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            generateBtn: document.getElementById('generateBtn'),
            clearBtn: document.getElementById('clearBtn'),
            charCount: document.getElementById('charCount'),
            initialState: document.getElementById('initialState'),
            resultsContent: document.getElementById('resultsContent'),
            ratingValue: document.getElementById('ratingValue'),
            ratingArc: document.getElementById('ratingArc'),
            scoreNumber: document.getElementById('scoreNumber'),
            feedbackText: document.getElementById('feedbackText'),
            entropyValue: document.getElementById('entropyValue'),
            lengthValue: document.getElementById('lengthValue'),
            charTypesValue: document.getElementById('charTypesValue'),
            breachValue: document.getElementById('breachValue'),
            charUpper: document.getElementById('charUpper'),
            charLower: document.getElementById('charLower'),
            charDigit: document.getElementById('charDigit'),
            charSpecial: document.getElementById('charSpecial'),
            feedbackBody: document.getElementById('feedbackBody'),
            totalScans: document.getElementById('totalScans'),
            strongCount: document.getElementById('strongCount'),
            securityLevel: document.getElementById('securityLevel'),
            sessionCount: document.getElementById('sessionCount'),
            // NEW ELEMENTS
            themeToggle: document.getElementById('themeToggle'),
            passLength: document.getElementById('passLength'),
            lengthVal: document.getElementById('lengthVal'),
            optUpper: document.getElementById('optUpper'),
            optLower: document.getElementById('optLower'),
            optDigits: document.getElementById('optDigits'),
            optSpecial: document.getElementById('optSpecial')
        };

        this.charElements = {
            upper: this.elements.charUpper,
            lower: this.elements.charLower,
            digit: this.elements.charDigit,
            special: this.elements.charSpecial
        };
    }

    initializeEventListeners() {
        this.elements.passwordInput.addEventListener('input', () => {
            this.updateCharCount();
            this.isAnalyzed = false;
        });

        this.elements.toggleBtn.addEventListener('click', () => {
            const input = this.elements.passwordInput;
            if (input.type === 'password') {
                input.type = 'text';
                this.elements.toggleBtn.textContent = '🙈';
            } else {
                input.type = 'password';
                this.elements.toggleBtn.textContent = '👁️';
            }
        });

        this.elements.analyzeBtn.addEventListener('click', () => this.analyzePassword('Analyze'));
        this.elements.generateBtn.addEventListener('click', () => this.generatePassword());
        this.elements.clearBtn.addEventListener('click', () => this.clearFields());

        this.elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.analyzePassword('Analyze');
            }
        });

        // NEW: Slider display
        if (this.elements.passLength && this.elements.lengthVal) {
            this.elements.passLength.addEventListener('input', () => {
                this.elements.lengthVal.textContent = this.elements.passLength.value;
            });
        }

        // NEW: Dark Mode Toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('light-mode');
                this.elements.themeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
            });
        }
    }

    initializeParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        const particleCount = 60;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (10 + Math.random() * 20) + 's';
            particle.style.animationDelay = (Math.random() * 20) + 's';
            particle.style.width = (1 + Math.random() * 2) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const time = now.toTimeString().split(' ')[0];
            document.getElementById('clock').textContent = time;
            
            const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
            const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            this.elements.sessionCount.textContent = `${mins}:${secs}`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    updateCharCount() {
        const length = this.elements.passwordInput.value.length;
        this.elements.charCount.textContent = `${length} characters`;
    }

    async loadHistoryFromBackend() {
        try {
            const data = await this.api.getPasswords();
            if (data && data.passwords) {
                this.updateStatsFromData(data.passwords);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    updateStatsFromData(passwords) {
        const stats = {
            total: passwords.length,
            strong: passwords.filter(p => p.rating === 'STRONG').length
        };
        
        this.elements.totalScans.textContent = stats.total;
        this.elements.strongCount.textContent = stats.strong;

        if (stats.total === 0) {
            this.elements.securityLevel.textContent = '🔓';
        } else if (stats.strong > 0) {
            this.elements.securityLevel.textContent = '🔒';
        } else {
            this.elements.securityLevel.textContent = '⚠️';
        }
    }

    async updateStatsFromBackend() {
        try {
            const stats = await this.api.getStats();
            this.elements.totalScans.textContent = stats.total;
            this.elements.strongCount.textContent = stats.strong;
            
            if (stats.total === 0) {
                this.elements.securityLevel.textContent = '🔓';
            } else if (stats.strong > 0) {
                this.elements.securityLevel.textContent = '🔒';
            } else {
                this.elements.securityLevel.textContent = '⚠️';
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    generatePassword() {
        const length = parseInt(this.elements.passLength.value) || 16;
        
        let charSets = '';
        if (this.elements.optUpper.checked) charSets += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (this.elements.optLower.checked) charSets += 'abcdefghijklmnopqrstuvwxyz';
        if (this.elements.optDigits.checked) charSets += '0123456789';
        if (this.elements.optSpecial.checked) charSets += '!@#$%^&*()';
        
        if (charSets === '') charSets = 'abcdefghijklmnopqrstuvwxyz'; // Fallback
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charSets.charAt(Math.floor(Math.random() * charSets.length));
        }
        
        this.elements.passwordInput.value = password;
        this.updateCharCount();
        this.isAnalyzed = false;
        this.analyzePassword('Generate');
    }

    clearFields() {
        this.elements.passwordInput.value = '';
        this.updateCharCount();
        this.elements.resultsContent.style.display = 'none';
        this.elements.initialState.style.display = 'flex';
        this.isAnalyzed = false;

        // Log the clear action
        try {
            fetch('http://localhost:3000/api/passwords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    password: 'CLEARED',
                    rating: 'N/A', 
                    score: 0, 
                    entropy: 0, 
                    length: 0, 
                    charTypes: 0, 
                    timestamp: new Date().toISOString(),
                    action: 'Clear Button Clicked'
                })
            });
        } catch (e) {
            console.error("Error logging clear action:", e);
        }
        
        this.elements.ratingArc.style.strokeDashoffset = '314.159';
        this.elements.ratingArc.style.stroke = '#1a1a3e';
        this.elements.ratingValue.textContent = 'WAITING';
        this.elements.ratingValue.style.color = '#666666';
        this.elements.scoreNumber.textContent = '0';
        this.elements.scoreNumber.style.color = '#ffffff';
        this.elements.feedbackText.textContent = 'Enter a password and click ANALYZE';
        this.elements.feedbackText.style.color = '#888888';
        
        this.elements.entropyValue.textContent = '-- bits';
        this.elements.lengthValue.textContent = '-- chars';
        this.elements.charTypesValue.textContent = '0/4';
        this.elements.breachValue.textContent = '✅ Safe';
        this.elements.breachValue.style.color = '#888888';
        
        Object.values(this.charElements).forEach(el => {
            if (el) {
                el.classList.remove('active');
                const status = el.querySelector('.char-status');
                if (status) status.textContent = '❌';
            }
        });
        
        this.elements.feedbackBody.textContent = 'Awaiting analysis...';
    }

    // ============================================================
    // UPDATED ANALYZE PASSWORD - WITH REAL BREACH & DYNAMIC RECS
    // ============================================================
    async analyzePassword(action = 'Analyze') {
        const password = this.elements.passwordInput.value;
        
        if (!password) {
            this.clearFields();
            return;
        }

        // 1. ANALYZE THE PASSWORD
        const analyzer = new PasswordAnalyzer(password);
        const result = analyzer.analyze();

        // 2. CHECK REAL BREACH STATUS
        let isRealBreached = false;
        try {
            const breachResponse = await fetch(`http://localhost:3000/api/check-breach/${encodeURIComponent(password)}`);
            const breachData = await breachResponse.json();
            isRealBreached = breachData.breached;
        } catch (error) {
            console.warn('Could not reach breach API, skipping.');
        }

        // If actually breached, override rating
        if (isRealBreached) {
            result.rating = 'BREACHED';
            result.score = 0;
            result.feedback = '🚨 CRITICAL: This password has been found in real-world data breaches! Choose a different one.';
        }

        // 3. GENERATE DYNAMIC RECOMMENDATIONS
        const recommendations = [];
        if (password.length < 8) recommendations.push(`Password is only ${password.length} characters long. Add at least 8!`);
        if (!result.hasUpper) recommendations.push('You forgot to add an Uppercase letter (A-Z)!');
        if (!result.hasLower) recommendations.push('You forgot to add a Lowercase letter (a-z)!');
        if (!result.hasDigit) recommendations.push('You forgot to add a Number (0-9)!');
        if (!result.hasSpecial) recommendations.push('You forgot to add a Special character (!@#$%)!');

        // SAVE TO BACKEND
        const entry = {
            password: password,
            rating: result.rating,
            score: result.score,
            entropy: result.entropy,
            length: result.length,
            charTypes: result.charTypes,
            timestamp: new Date().toISOString(),
            action: action
        };
        
        await this.api.savePassword(entry);
        await this.updateStatsFromBackend();

        // UPDATE UI
        this.elements.initialState.style.display = 'none';
        this.elements.resultsContent.style.display = 'flex';
        this.isAnalyzed = true;

        const levelEmojis = {
            'STRONG': '🔒',
            'GOOD': '🔐',
            'FAIR': '🔓',
            'WEAK': '⚠️',
            'BREACHED': '🚨'
        };
        this.elements.securityLevel.textContent = levelEmojis[result.rating] || '🔓';

        const colors = {
            'STRONG': { main: '#00ff88' },
            'GOOD': { main: '#00ccff' },
            'FAIR': { main: '#ffaa00' },
            'WEAK': { main: '#ff4444' },
            'BREACHED': { main: '#ff0000' }
        };

        const color = colors[result.rating] || colors['WEAK'];

        // Update Score Circle
        const circumference = 314.159;
        const offset = circumference - (result.score / 100) * circumference;
        this.elements.ratingArc.style.strokeDashoffset = offset;
        this.elements.ratingArc.style.stroke = color.main;
        
        this.elements.ratingValue.textContent = result.rating;
        this.elements.ratingValue.style.color = color.main;
        
        this.elements.scoreNumber.textContent = result.score;
        this.elements.scoreNumber.style.color = color.main;
        
        // Update Feedback (Uses Dynamic Recommendations)
        if (recommendations.length > 0 && result.rating !== 'BREACHED') {
            this.elements.feedbackText.textContent = `⚠️ ${recommendations[0]}`;
        } else {
            this.elements.feedbackText.textContent = result.feedback;
        }
        this.elements.feedbackText.style.color = color.main;
        
        this.elements.entropyValue.textContent = `${result.entropy} bits`;
        this.elements.lengthValue.textContent = `${result.length} chars`;
        this.elements.charTypesValue.textContent = `${result.charTypes}/4`;
        
        if (result.rating === 'BREACHED') {
            this.elements.breachValue.textContent = '🔴 Breached';
            this.elements.breachValue.style.color = '#ff0000';
        } else {
            this.elements.breachValue.textContent = '✅ Safe';
            this.elements.breachValue.style.color = '#00ff88';
        }

        // Update Indicators
        this.updateCharIndicator('upper', result.hasUpper);
        this.updateCharIndicator('lower', result.hasLower);
        this.updateCharIndicator('digit', result.hasDigit);
        this.updateCharIndicator('special', result.hasSpecial);

        // Update Feedback Body
        this.elements.feedbackBody.textContent = result.feedback;
        this.elements.feedbackBody.style.color = color.main;
    }

    updateCharIndicator(type, isActive) {
        const el = this.charElements[type];
        if (!el) return;

        const status = el.querySelector('.char-status');
        
        if (isActive) {
            el.classList.add('active');
            status.textContent = '✅';
        } else {
            el.classList.remove('active');
            status.textContent = '❌';
        }
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new PasswordCheckerUI();
    console.log('🛡️ DecodeLabs Password Security Analyzer v3.0');
    console.log('🔒 Batch 2026 | Defensive Logic Track');
});