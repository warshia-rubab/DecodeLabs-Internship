/**
 * Crypto Suite - Encryption Functions
 * All API calls for encryption operations
 */

// ============================================
// CAESAR CIPHER
// ============================================
async function encryptCaesar() {
    const text = document.getElementById('caesarText').value;
    const shift = parseInt(document.getElementById('caesarShift').value);
    const resultContainer = document.getElementById('caesarResult');
    
    if (!text) {
        showToast('Please enter text to encrypt', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/encrypt/caesar', { text, shift });
        const result = response.data;
        
        if (result.status === 'success') {
            displayResult(resultContainer, result);
            showToast('Caesar encryption successful', 'success');
            loadDashboardStats();
            loadHistory();
        } else {
            showToast('Encryption failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Caesar encryption error:', error);
        showToast('Encryption failed', 'error');
    }
}

// ============================================
// VIGENERE CIPHER
// ============================================
async function encryptVigenere() {
    const text = document.getElementById('vigenereText').value;
    const key = document.getElementById('vigenereKey').value;
    const resultContainer = document.getElementById('vigenereResult');
    
    if (!text) {
        showToast('Please enter text to encrypt', 'error');
        return;
    }
    
    if (!key) {
        showToast('Please enter an encryption key', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/encrypt/vigenere', { text, key });
        const result = response.data;
        
        if (result.status === 'success') {
            displayResult(resultContainer, result);
            showToast('Vigenère encryption successful', 'success');
            loadDashboardStats();
            loadHistory();
        } else {
            showToast('Encryption failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Vigenere encryption error:', error);
        showToast('Encryption failed', 'error');
    }
}

// ============================================
// HYBRID ENCRYPTION
// ============================================
async function encryptHybrid() {
    const text = document.getElementById('hybridText').value;
    const shift = parseInt(document.getElementById('hybridShift').value);
    const key = document.getElementById('hybridKey').value;
    const resultContainer = document.getElementById('hybridResult');
    
    if (!text) {
        showToast('Please enter text to encrypt', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/encrypt/hybrid', { text, shift, key });
        const result = response.data;
        
        if (result.status === 'success') {
            displayResult(resultContainer, result);
            showToast('Hybrid encryption successful', 'success');
            loadDashboardStats();
            loadHistory();
        } else {
            showToast('Encryption failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Hybrid encryption error:', error);
        showToast('Encryption failed', 'error');
    }
}

// ============================================
// BRUTE FORCE
// ============================================
async function runBruteForce() {
    const text = document.getElementById('bruteforceText').value;
    const resultContainer = document.getElementById('bruteforceResult');
    
    if (!text) {
        showToast('Please enter ciphertext to crack', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/bruteforce', { ciphertext: text });
        const data = response.data;
        
        if (data.status === 'success') {
            let html = `
                <div style="margin-top: 12px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-secondary);">
                        <i class="fas fa-search"></i> Top 5 Possible Decryptions
                    </h4>
            `;
            
            data.results.forEach((result, index) => {
                const isMatch = result.text === text; // Simple check
                html += `
                    <div class="result-item" style="${isMatch ? 'background: rgba(34,197,94,0.05); border-radius: 8px;' : ''}">
                        <span class="result-label">#${index + 1}</span>
                        <div>
                            <div style="font-weight: 600; ${isMatch ? 'color: var(--success);' : ''}">
                                Shift ${result.shift}: ${result.text}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                Score: ${result.score.toFixed(2)}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            resultContainer.innerHTML = html;
            resultContainer.classList.add('show');
            showToast('Brute force analysis complete', 'success');
        }
    } catch (error) {
        console.error('Brute force error:', error);
        showToast('Brute force failed', 'error');
    }
}

// ============================================
// DISPLAY RESULT
// ============================================
function displayResult(container, result) {
    let html = `
        <div class="result-item">
            <span class="result-label">🔹 Method</span>
            <span class="result-value">${result.method || 'N/A'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">📝 Original</span>
            <span class="result-value">${result.original || 'N/A'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">🔐 Encrypted</span>
            <span class="result-value encrypted">${result.encrypted || 'N/A'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">🔓 Decrypted</span>
            <span class="result-value decrypted">${result.decrypted || 'N/A'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">⏰ Time</span>
            <span class="result-value">${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}</span>
        </div>
    `;
    
    if (result.hash) {
        html += `
            <div class="result-item">
                <span class="result-label">🔑 Hash</span>
                <span class="result-value" style="font-size: 12px;">${result.hash.substring(0, 32)}...</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
    container.classList.add('show');
}

// ============================================
// CLEAR FIELDS
// ============================================
function clearFields(type) {
    const mappings = {
        caesar: {
            text: 'caesarText',
            shift: 'caesarShift',
            result: 'caesarResult',
            shiftDisplay: 'caesarShiftValue'
        },
        vigenere: {
            text: 'vigenereText',
            key: 'vigenereKey',
            result: 'vigenereResult'
        },
        hybrid: {
            text: 'hybridText',
            shift: 'hybridShift',
            key: 'hybridKey',
            result: 'hybridResult'
        }
    };
    
    const fields = mappings[type];
    if (!fields) return;
    
    // Clear text
    if (fields.text) {
        document.getElementById(fields.text).value = '';
    }
    
    // Clear result
    if (fields.result) {
        const container = document.getElementById(fields.result);
        container.innerHTML = '';
        container.classList.remove('show');
    }
    
    // Reset shift to default
    if (fields.shift) {
        document.getElementById(fields.shift).value = 3;
        if (fields.shiftDisplay) {
            document.getElementById(fields.shiftDisplay).textContent = '3';
        }
    }
    
    // Reset key
    if (fields.key) {
        document.getElementById(fields.key).value = 'SECUREKEY';
    }
    
    showToast('Fields cleared', 'info');
}

// ============================================
// SHIFT VALUE DISPLAY
// ============================================
// Update shift value display
document.addEventListener('DOMContentLoaded', function() {
    const shiftSlider = document.getElementById('caesarShift');
    if (shiftSlider) {
        shiftSlider.addEventListener('input', function() {
            document.getElementById('caesarShiftValue').textContent = this.value;
        });
    }
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to encrypt
    if (e.ctrlKey && e.key === 'Enter') {
        const page = AppState.currentPage;
        if (page === 'caesar') encryptCaesar();
        else if (page === 'vigenere') encryptVigenere();
        else if (page === 'hybrid') encryptHybrid();
    }
});