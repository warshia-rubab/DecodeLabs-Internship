// server.js
// Password Checker - Backend Server

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Path to store passwords
const DATA_FILE = path.join(__dirname, 'passwords.json');
// Path to store logs
const LOG_FILE = path.join(__dirname, 'server_logs.txt');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ passwords: [] }, null, 2));
}

// ============================================
// LOGGING HELPER FUNCTION
// ============================================
function writeLog(message) {
    const time = new Date().toLocaleString();
    const logLine = `[${time}] ${message}`;
    
    // Print to CMD
    console.log(logLine);
    
    // Append to file
    fs.appendFile(LOG_FILE, logLine + '\n', (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
}

// Read passwords from file
function readPasswords() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        writeLog(`Error reading passwords file: ${error.message}`);
        return { passwords: [] };
    }
}

// Write passwords to file
function writePasswords(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================
// API ROUTES
// ============================================

// GET - Get all password history
app.get('/api/passwords', (req, res) => {
    writeLog("GET request received for /api/passwords");
    const data = readPasswords();
    res.json(data);
});

// GET - Get statistics
app.get('/api/stats', (req, res) => {
    writeLog("GET request received for /api/stats");
    const data = readPasswords();
    const total = data.passwords.length;
    const strong = data.passwords.filter(p => p.rating === 'STRONG').length;
    const good = data.passwords.filter(p => p.rating === 'GOOD').length;
    const fair = data.passwords.filter(p => p.rating === 'FAIR').length;
    const weak = data.passwords.filter(p => p.rating === 'WEAK').length;
    const breached = data.passwords.filter(p => p.rating === 'BREACHED').length;
    
    const avgScore = total > 0 
        ? Math.round(data.passwords.reduce((sum, p) => sum + p.score, 0) / total) 
        : 0;
    
    res.json({ 
        total, 
        strong, 
        good, 
        fair,
        weak, 
        breached,
        avgScore
    });
});
// Check if password has been breached (Has I Been Pwned API)
app.get('/api/check-breach/:password', async (req, res) => {
    const password = req.params.password;

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    try {
        // 1. Create SHA-1 hash
        const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = sha1.substring(0, 5);
        const suffix = sha1.substring(5);

        // 2. Fetch the hash range from HIBP
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();

        // 3. Check if our suffix exists in the returned list
        const lines = text.split('\n');
        const isBreached = lines.some(line => line.startsWith(suffix));
        
        res.json({ breached: isBreached, hash: sha1 });
    } catch (error) {
        console.error("Error checking breach:", error);
        res.status(500).json({ error: 'Failed to check breach status' });
    }
});
// POST - Save a new password
app.post('/api/passwords', (req, res) => {
    const { password, rating, score, entropy, length, charTypes, timestamp, action } = req.body;
    
    writeLog(`POST request received for /api/passwords (Action: ${action || 'Analyze'})`);
    
    if (!password) {
        writeLog("Error: Password is required");
        return res.status(400).json({ error: 'Password is required' });
    }
    
    const data = readPasswords();
    
    const entry = {
        id: Date.now(),
        password: password,
        rating: rating || 'UNKNOWN',
        score: score || 0,
        entropy: entropy || 0,
        length: length || 0,
        charTypes: charTypes || 0,
        timestamp: timestamp || new Date().toISOString(),
        action: action || 'Analyze'
    };

    writeLog(`📝 New Entry Saved: ${JSON.stringify(entry)}`);
    
    data.passwords.unshift(entry);
    if (data.passwords.length > 100) {
        data.passwords = data.passwords.slice(0, 100);
    }
    
    writePasswords(data);
    res.json({ success: true, entry: entry });
});

// DELETE - Delete a specific password entry
app.delete('/api/passwords/:id', (req, res) => {
    const id = parseInt(req.params.id);
    writeLog(`DELETE request received for /api/passwords/${id}`);
    
    const data = readPasswords();
    data.passwords = data.passwords.filter(p => p.id !== id);
    writePasswords(data);
    res.json({ success: true });
});

// DELETE - Clear all password history
app.delete('/api/passwords', (req, res) => {
    writeLog("DELETE request received to clear all passwords");
    writePasswords({ passwords: [] });
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(55));
    console.log('🛡️ PASSWORD CHECKER - BACKEND SERVER');
    console.log('='.repeat(55));
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📁 Passwords stored in: ${DATA_FILE}`);
    console.log(`📁 Logs saved to: ${LOG_FILE}`);
    console.log('='.repeat(55));
    console.log('\n📋 API Endpoints:');
    console.log('  GET  /api/passwords  - View all passwords');
    console.log('  POST /api/passwords  - Save a password');
    console.log('  GET  /api/stats      - View statistics');
    console.log('  DELETE /api/passwords/:id - Delete a password');
    console.log('='.repeat(55));
    
    writeLog("Server started successfully");
});