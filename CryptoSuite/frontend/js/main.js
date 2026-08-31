/**
 * Crypto Suite - Main Application
 * Professional Frontend Logic
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    currentPage: 'dashboard',
    theme: 'light',
    stats: {},
    history: [],
    socket: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    themeToggle: document.getElementById('themeToggle'),
    pageTitle: document.getElementById('pageTitle'),
    refreshBtn: document.getElementById('refreshBtn'),
    exportBtn: document.getElementById('exportBtn'),
    toastContainer: document.getElementById('toastContainer'),
    recentActivity: document.getElementById('recentActivity'),
    historyTable: document.getElementById('historyTable'),
    statsContainer: document.getElementById('statsContainer'),
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CryptoSuite v2.0.0');
    
    initSocket();
    loadDashboardStats();
    loadHistory();
    loadStatistics();
    setupEventListeners();
    
    const savedTheme = localStorage.getItem('decodelabs-theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        DOM.themeToggle.checked = true;
        AppState.theme = 'dark';
    }
});

// ============================================
// SOCKET.IO - REAL-TIME UPDATES
// ============================================
function initSocket() {
    AppState.socket = io('http://localhost:5000');
    
    AppState.socket.on('connect', function() {
        console.log('✅ Connected to server');
        showToast('Connected to server', 'success');
    });
    
    AppState.socket.on('new_encryption', function(data) {
        console.log('📊 New encryption:', data);
        loadDashboardStats();
        loadHistory();
        loadStatistics();
        showToast(`New ${data.method} encryption recorded`, 'info');
    });
    
    AppState.socket.on('disconnect', function() {
        console.warn('⚠️ Disconnected from server');
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    DOM.sidebarToggle.addEventListener('click', function() {
        DOM.sidebar.classList.toggle('open');
    });
    
    DOM.themeToggle.addEventListener('change', function() {
        toggleTheme();
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });
    
    DOM.refreshBtn.addEventListener('click', function() {
        refreshAllData();
    });
    
    DOM.exportBtn.addEventListener('click', function() {
        exportData();
    });
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        if (p.id === `page-${page}`) {
            p.classList.add('active');
        }
    });
    
    const titles = {
        dashboard: 'Dashboard',
        caesar: 'Caesar Cipher',
        vigenere: 'Vigenère Cipher',
        hybrid: 'Hybrid Encryption',
        bruteforce: 'Brute Force Attack',
        history: 'Encryption History',
        statistics: 'Statistical Analysis'
    };
    DOM.pageTitle.textContent = titles[page] || 'Dashboard';
    
    AppState.currentPage = page;
    
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.remove('open');
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================
function toggleTheme() {
    const isDark = DOM.themeToggle.checked;
    document.body.classList.toggle('dark-theme', isDark);
    AppState.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('decodelabs-theme', AppState.theme);
    
    // Update all charts when theme changes
    if (methodsChart) {
        updateMethodsChart(AppState.stats.methods_used || {});
    }
    if (timelineChart) {
        loadHistory();
    }
    if (histogramChart) {
        updateHistogramChart(AppState.stats.methods_used || {});
    }
}

// ============================================
// DASHBOARD - LOAD STATS (UPDATED)
// ============================================
async function loadDashboardStats() {
    try {
        const response = await axios.get('/api/stats');
        if (response.data.status === 'success') {
            const stats = response.data.stats;
            AppState.stats = stats;
            
            // Update Dashboard Stats
            updateDashboardStats(stats);
            
            // Update Recent Activity (10 items)
            updateRecentActivity();
            
            // Update Histogram
            updateHistogramChart(stats.methods_used);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// ============================================
// DASHBOARD - UPDATE STATS
// ============================================
function updateDashboardStats(stats) {
    const methods = stats.methods_used || {};
    
    // 1. Most Used Method
    const mostUsed = document.getElementById('mostUsedMethod');
    if (mostUsed) {
        const entries = Object.entries(methods);
        if (entries.length > 0) {
            const sorted = entries.sort((a, b) => b[1] - a[1]);
            mostUsed.textContent = sorted[0][0];
        } else {
            mostUsed.textContent = 'None';
        }
    }
    
    // 2. Total Available Methods
    const totalMethods = document.getElementById('totalMethods');
    if (totalMethods) {
        const count = Object.keys(methods).length;
        totalMethods.textContent = count > 0 ? count : '0';
    }
    
    // 3. Today's Operations - will be updated by updateRecentActivity
    // 4. System Health
    const systemHealth = document.getElementById('systemHealth');
    if (systemHealth) {
        const total = stats.total_operations || 0;
        const successful = stats.successful_operations || 0;
        const health = total > 0 ? Math.round((successful / total) * 100) : 100;
        systemHealth.textContent = health + '%';
        systemHealth.style.color = health >= 90 ? '#22C55E' : health >= 70 ? '#EAB308' : '#EF4444';
    }
    
    // 5. Last Operation Time
    const lastOpTime = document.getElementById('lastOpTime');
    if (lastOpTime && stats.last_operation) {
        lastOpTime.textContent = new Date(stats.last_operation).toLocaleString();
    }
    
    // 6. Quick Stats
    updateQuickStats(stats);
}

// ============================================
// DASHBOARD - QUICK STATS (ENHANCED)
// ============================================
function updateQuickStats(stats) {
    const container = document.getElementById('quickStats');
    if (!container) return;
    
    const total = stats.total_operations || 0;
    const successful = stats.successful_operations || 0;
    const failed = stats.failed_operations || 0;
    const avgDuration = stats.avg_duration_ms || '0';
    
    // Get method data
    const methods = stats.methods_used || {};
    const methodNames = Object.keys(methods);
    const totalMethods = methodNames.length;
    
    // Calculate percentages
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;
    
    // Find most used method
    let mostUsedMethod = 'None';
    let mostUsedCount = 0;
    if (methodNames.length > 0) {
        const sorted = [...methodNames].sort((a, b) => methods[b] - methods[a]);
        mostUsedMethod = sorted[0];
        mostUsedCount = methods[mostUsedMethod];
    }
    
    // Build method mini bars
    let miniBarsHtml = '';
    const maxCount = Math.max(...Object.values(methods), 1);
    const colors = ['#0D9488', '#2563EB', '#7C3AED', '#DC2626', '#EAB308'];
    
    if (methodNames.length > 0) {
        methodNames.slice(0, 4).forEach((method, index) => {
            const count = methods[method];
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const width = Math.max((count / maxCount) * 100, 10);
            miniBarsHtml += `
                <div class="method-mini-bar">
                    <span class="mmb-label">${method}</span>
                    <div class="mmb-track">
                        <div class="mmb-fill" style="width: ${width}%; background: ${colors[index % colors.length]};"></div>
                    </div>
                    <span class="mmb-value">${count} (${percentage}%)</span>
                </div>
            `;
        });
    } else {
        miniBarsHtml = '<span style="color: var(--text-secondary); font-size: 13px;">No data available</span>';
    }
    
    container.innerHTML = `
        <!-- Top 3x2 Grid -->
        <div class="quick-stats-grid">
            <div class="quick-stat-item">
                <div class="qs-value success">${successRate}%</div>
                <div class="qs-label">Success Rate</div>
            </div>
            <div class="quick-stat-item">
                <div class="qs-value ${failRate > 10 ? 'warning' : 'success'}">${failed}</div>
                <div class="qs-label">Failed Ops</div>
            </div>
            <div class="quick-stat-item">
                <div class="qs-value primary">${totalMethods}</div>
                <div class="qs-label">Methods Used</div>
            </div>
            <div class="quick-stat-item">
                <div class="qs-value">${avgDuration}ms</div>
                <div class="qs-label">Avg. Duration</div>
            </div>
            <div class="quick-stat-item">
                <div class="qs-value">${total}</div>
                <div class="qs-label">Total Ops</div>
            </div>
            <div class="quick-stat-item">
                <div class="qs-value ${mostUsedCount > 0 ? 'primary' : ''}">${mostUsedMethod}</div>
                <div class="qs-label">Most Used</div>
            </div>
        </div>
        
        <!-- Bottom Row - Method Distribution Mini Bars -->
        <div class="quick-stats-bottom">
            <div class="quick-stat-wide">
                <span class="qsw-label"><i class="fas fa-chart-simple" style="color: var(--primary); margin-right: 6px;"></i> Methods Distribution</span>
                <span class="qsw-value">${methodNames.length} active</span>
            </div>
            <div class="quick-stat-wide" style="flex-direction: column; align-items: stretch; padding: 12px 16px;">
                ${miniBarsHtml}
            </div>
        </div>
    `;
}

// ============================================
// RECENT ACTIVITY - SHOW LATEST 10
// ============================================
async function updateRecentActivity() {
    try {
        const response = await axios.get('/api/history?limit=10');
        if (response.data.status === 'success') {
            const logs = response.data.data;
            const container = DOM.recentActivity;
            
            // Update today's count using all logs
            try {
                const allLogsResponse = await axios.get('/api/history?limit=100');
                if (allLogsResponse.data.status === 'success') {
                    const allLogs = allLogsResponse.data.data;
                    const today = new Date().toDateString();
                    const todayLogs = allLogs.filter(log => 
                        new Date(log.timestamp).toDateString() === today
                    );
                    const recentCount = document.getElementById('recentCount');
                    if (recentCount) {
                        recentCount.textContent = todayLogs.length || allLogs.length;
                    }
                }
            } catch (e) {
                const recentCount = document.getElementById('recentCount');
                if (recentCount) {
                    recentCount.textContent = logs.length;
                }
            }
            
            if (logs.length === 0) {
                container.innerHTML = '<p class="text-muted">No recent activity</p>';
                return;
            }
            
            container.innerHTML = logs.map(log => `
                <div class="activity-item" style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500; color: var(--text-primary); font-size: 13px;">${log.method}</span>
                        <span style="font-size: 11px; color: var(--text-secondary);">
                            ${new Date(log.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 1px;">
                        <span class="status-badge-sm ${log.status}">${log.status}</span>
                        <span style="margin-left: 8px;">${log.duration_ms ? log.duration_ms + 'ms' : ''}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// ============================================
// HISTOGRAM CHART - SMALL (Inside Quick Stats)
// ============================================
let histogramChart = null;

function updateHistogramChart(methods) {
    const ctx = document.getElementById('histogramChart');
    if (!ctx) {
        console.log('Histogram canvas not found');
        return;
    }
    
    if (histogramChart) {
        histogramChart.destroy();
    }
    
    const allMethods = ['Caesar Cipher', 'Vigenere Cipher', 'Hybrid Cipher'];
    const methodColors = {
        'Caesar Cipher': '#0D9488',
        'Vigenere Cipher': '#2563EB',
        'Hybrid Cipher': '#7C3AED'
    };
    
    const finalLabels = [];
    const finalData = [];
    const finalColors = [];
    
    allMethods.forEach(method => {
        finalLabels.push(method);
        finalData.push(methods[method] || 0);
        finalColors.push(methodColors[method] || '#94A3B8');
    });
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#94A3B8' : '#64748B';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: finalLabels,
            datasets: [{
                label: 'Operations',
                data: finalData,
                backgroundColor: finalColors,
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 1.5,
                borderRadius: 4,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} operations`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        display: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 9 },
                        maxRotation: 0
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 8 },
                        stepSize: 1,
                        beginAtZero: true
                    }
                }
            }
        }
    });
    
    console.log('Histogram updated:', finalData);
}

// ============================================
// CHART - METHODS DISTRIBUTION (Crypto Methods)
// ============================================
let methodsChart = null;

function updateMethodsChart(methods) {
    const ctx = document.getElementById('methodsChart');
    if (!ctx) return;
    
    // Get method names and values
    const labels = Object.keys(methods);
    const data = Object.values(methods);
    
    // Color scheme for encryption methods
    const colorMap = {
        'Caesar Cipher': '#0D9488',
        'Vigenere Cipher': '#2563EB',
        'Hybrid Cipher': '#7C3AED',
        'Hybrid (Caesar + Vigenere)': '#7C3AED'
    };
    
    const colors = labels.map(label => colorMap[label] || '#8B5CF6');
    
    if (methodsChart) {
        methodsChart.destroy();
    }
    
    if (labels.length === 0) {
        const labelContainer = document.getElementById('chartLabels');
        if (labelContainer) labelContainer.innerHTML = '';
        return;
    }
    
    const isDark = document.body.classList.contains('dark-theme');
    const total = data.reduce((a, b) => a + b, 0);
    
    methodsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: isDark ? '#1E293B' : '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} operations (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Update custom labels below chart
    updateChartLabels(labels, data, colors, total);
}

// ============================================
// CHART LABELS - BELOW THE CHART
// ============================================
function updateChartLabels(labels, data, colors, total) {
    const container = document.getElementById('chartLabels');
    if (!container) return;
    
    if (labels.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    labels.forEach((label, index) => {
        const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : 0;
        html += `
            <div class="chart-label-item">
                <span class="color-dot" style="background: ${colors[index % colors.length]};"></span>
                <span class="label-text">${label}</span>
                <span class="label-value">${data[index]} (${percentage}%)</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// TIMELINE CHART - OPERATIONS OVER TIME
// ============================================
let timelineChart = null;

function updateTimelineChart(historyData) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    if (!historyData || historyData.length === 0) {
        const canvas = ctx;
        const parent = canvas.parentElement;
        if (parent) {
            parent.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px 0;">No operations recorded yet</p>';
        }
        return;
    }
    
    const timeMap = {};
    const sortedData = [...historyData].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    sortedData.forEach(log => {
        const time = new Date(log.timestamp);
        const key = time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (!timeMap[key]) {
            timeMap[key] = 0;
        }
        timeMap[key] += 1;
    });
    
    const timeLabels = Object.keys(timeMap);
    const timeData = timeLabels.map(key => timeMap[key]);
    
    let displayLabels = timeLabels;
    let displayData = timeData;
    
    if (timeLabels.length > 20) {
        displayLabels = timeLabels.filter((_, i) => i % 2 === 0);
        displayData = timeData.filter((_, i) => i % 2 === 0);
    }
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#94A3B8' : '#64748B';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    const canvas = ctx;
    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(13, 148, 136, 0.5)');
    gradient.addColorStop(1, 'rgba(13, 148, 136, 0.02)');
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                label: 'Operations',
                data: displayData,
                borderColor: '#0D9488',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#0D9488',
                pointBorderColor: isDark ? '#1E293B' : '#FFFFFF',
                pointBorderWidth: 1,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} operation${context.parsed.y !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor, display: false },
                    ticks: { color: textColor, font: { size: 9 }, maxTicksLimit: 10, maxRotation: 45 }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { size: 9 }, stepSize: 1, beginAtZero: true }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// ============================================
// HISTORY
// ============================================
async function loadHistory() {
    try {
        const response = await axios.get('/api/history?limit=50');
        if (response.data.status === 'success') {
            const logs = response.data.data;
            const container = DOM.historyTable;
            
            if (logs.length === 0) {
                container.innerHTML = '<p class="text-muted">No encryption history found</p>';
                return;
            }
            
            let html = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Method</th>
                            <th>Original</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            logs.forEach((log, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${log.method}</strong></td>
                        <td>${log.original_text}</td>
                        <td><span class="status-badge-sm ${log.status}">${log.status}</span></td>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                <div style="margin-top: 12px; color: var(--text-secondary); font-size: 13px;">
                    Showing ${logs.length} records
                </div>
            `;
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Failed to load history', 'error');
    }
}

// ============================================
// STATISTICS
// ============================================
async function loadStatistics() {
    try {
        const response = await axios.get('/api/stats');
        if (response.data.status === 'success') {
            const stats = response.data.stats;
            
            const container = DOM.statsContainer;
            let html = `
                <div class="stats-grid" style="margin-bottom: 0;">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #0D9488;">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.total_operations || 0}</h3>
                            <p>Total Operations</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #22C55E;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.successful_operations || 0}</h3>
                            <p>Successful</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #EF4444;">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.failed_operations || 0}</h3>
                            <p>Failed</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #EAB308;">
                            <i class="fas fa-percent"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.success_rate || '0%'}</h3>
                            <p>Success Rate</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #7C3AED;">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.avg_duration_ms || '0'}ms</h3>
                            <p>Avg. Duration</p>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = html;
            
            const breakdownContainer = document.getElementById('methodBreakdown');
            const methods = stats.methods_used || {};
            
            if (Object.keys(methods).length === 0) {
                breakdownContainer.innerHTML = '<p class="text-muted">No methods used yet</p>';
            } else {
                let breakdownHtml = `<ul class="method-breakdown-list">`;
                for (const [method, count] of Object.entries(methods)) {
                    const percentage = stats.total_operations > 0 
                        ? ((count / stats.total_operations) * 100).toFixed(1) 
                        : 0;
                    breakdownHtml += `
                        <li>
                            <span class="method-name">${method}</span>
                            <span class="method-stats">
                                ${count} operations <span class="method-percentage">(${percentage}%)</span>
                            </span>
                        </li>
                    `;
                }
                breakdownHtml += `</ul>`;
                breakdownContainer.innerHTML = breakdownHtml;
            }
            
            updateMethodsChart(methods);
            
            const historyResponse = await axios.get('/api/history?limit=100');
            if (historyResponse.data.status === 'success') {
                updateTimelineChart(historyResponse.data.data);
            }
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// ============================================
// REFRESH ALL DATA
// ============================================
async function refreshAllData() {
    showToast('Refreshing data...', 'info');
    await loadDashboardStats();
    await loadHistory();
    await loadStatistics();
    showToast('Data refreshed successfully', 'success');
}

// ============================================
// EXPORT DATA
// ============================================
async function exportData() {
    try {
        const response = await axios.get('/api/export');
        if (response.data.status === 'success') {
            showToast(`Exported ${response.data.count} records to ${response.data.filename}`, 'success');
        } else {
            showToast('Export failed', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
    }
}

// ============================================
// CLEAR HISTORY
// ============================================
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone!')) {
        return;
    }
    
    try {
        const response = await axios.post('/api/clear_logs');
        if (response.data.status === 'success') {
            showToast('All logs cleared successfully', 'success');
            refreshAllData();
        }
    } catch (error) {
        console.error('Clear history error:', error);
        showToast('Failed to clear logs', 'error');
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.encryptCaesar = encryptCaesar;
window.encryptVigenere = encryptVigenere;
window.encryptHybrid = encryptHybrid;
window.runBruteForce = runBruteForce;
window.clearFields = clearFields;
window.loadHistory = loadHistory;
window.clearHistory = clearHistory;
window.loadDashboardStats = loadDashboardStats;
window.loadStatistics = loadStatistics;

console.log('✅ CryptoSuite loaded successfully');