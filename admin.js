let authToken = localStorage.getItem('adminAuth');

function init() {
    if (authToken) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadStats();
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
}

function login(event) {
    console.log('Login function called');
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Username:', username);
    console.log('Password length:', password.length);
    
    if (!username || !password) {
        document.getElementById('loginError').textContent = 'Please enter both username and password';
        document.getElementById('loginError').style.display = 'block';
        return;
    }
    
    authToken = 'Basic ' + btoa(username + ':' + password);
    console.log('Auth token created:', authToken.substring(0, 20) + '...');
    
    // Hide any previous error
    document.getElementById('loginError').style.display = 'none';
    
    console.log('Sending request to /admin/stats');
    fetch('/admin/stats', {
        method: 'GET',
        headers: {
            'Authorization': authToken
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (response.ok) {
            console.log('Login successful!');
            localStorage.setItem('adminAuth', authToken);
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadStats();
        } else {
            console.log('Login failed with status:', response.status);
            throw new Error('Invalid credentials');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = 'Invalid username or password';
        document.getElementById('loginError').style.display = 'block';
    });
}

function loadStats() {
    fetch('/admin/stats', {
        headers: {
            'Authorization': authToken
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        return response.json();
    })
    .then(data => {
        updateStats(data);
        updateLogs(data.recentLogs);
    })
    .catch(error => {
        console.error('Error loading stats:', error);
        if (error.message === 'Unauthorized') {
            localStorage.removeItem('adminAuth');
            location.reload();
        }
    });
}

function updateStats(data) {
    document.getElementById('totalMessages').textContent = data.totalMessages;
    document.getElementById('totalSessions').textContent = data.totalSessions;
    document.getElementById('uptime').textContent = formatUptime(data.uptime);
    document.getElementById('memoryUsage').textContent = 
        Math.round(data.memoryUsage.heapUsed / 1024 / 1024) + 'MB';
}

function updateLogs(logs) {
    const logsContainer = document.getElementById('logs');
    
    if (!logs || logs.length === 0) {
        logsContainer.innerHTML = '<div class="loading">No chat logs available</div>';
        return;
    }

    logsContainer.innerHTML = logs.reverse().map(log => `
        <div class="log-entry">
            <div class="log-meta">
                <span>Session: ${log.sessionId.substring(0, 8)}...</span>
                <span>${new Date(log.timestamp).toLocaleString()}</span>
                <span>Response: ${log.responseTime}ms</span>
            </div>
            <div class="user-message">
                <strong>User:</strong> ${escapeHtml(log.userMessage)}
            </div>
            <div class="ai-response">
                <strong>AI:</strong> ${escapeHtml(log.aiResponse)}
            </div>
        </div>
    `).join('');
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh every 30 seconds
setInterval(() => {
    if (authToken && document.getElementById('dashboard').style.display !== 'none') {
        loadStats();
    }
}, 30000);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
