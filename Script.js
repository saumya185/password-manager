// Password Manager JavaScript
class PasswordManager {
    constructor() {
        this.passwords = [];
        this.storageKey = 'passwordManager_data';
        this.init();
    }

    init() {
        this.loadPasswords();
        this.bindEvents();
        this.renderPasswords();
        this.updatePasswordCount();
    }

    // Event Binding
    bindEvents() {
        const form = document.getElementById('passwordForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Form Submission Handler
    handleFormSubmit(e) {
        e.preventDefault();
        
        const website = document.getElementById('website').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!website || !username || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        const passwordEntry = {
            id: Date.now().toString(),
            website: website,
            username: username,
            password: this.encryptPassword(password),
            createdAt: new Date().toISOString()
        };

        this.passwords.unshift(passwordEntry);
        this.savePasswords();
        this.renderPasswords();
        this.updatePasswordCount();
        this.clearForm();
        this.showToast('Password saved successfully!');
    }

    // Password Encryption (Basic)
    encryptPassword(password) {
        // Using btoa for basic encoding (not true encryption)
        // In production, use proper encryption libraries
        return btoa(unescape(encodeURIComponent(password)));
    }

    // Password Decryption
    decryptPassword(encryptedPassword) {
        try {
            return decodeURIComponent(escape(atob(encryptedPassword)));
        } catch (error) {
            console.error('Decryption error:', error);
            return 'Error decrypting password';
        }
    }

    // Local Storage Operations
    savePasswords() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.passwords));
        } catch (error) {
            console.error('Error saving passwords:', error);
            this.showToast('Error saving password', 'error');
        }
    }

    loadPasswords() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.passwords = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading passwords:', error);
            this.passwords = [];
        }
    }

    // UI Rendering
    renderPasswords() {
        const passwordList = document.getElementById('passwordList');
        
        if (this.passwords.length === 0) {
            passwordList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔒</div>
                    <p>No passwords saved yet</p>
                    <small>Add your first password using the form above</small>
                </div>
            `;
            return;
        }

        passwordList.innerHTML = this.passwords.map(entry => `
            <div class="password-item" data-id="${entry.id}">
                <div class="password-header">
                    <div class="password-info">
                        <h3>${this.escapeHtml(entry.website)}</h3>
                        <p>${this.escapeHtml(entry.username)}</p>
                    </div>
                    <div class="password-actions">
                        <button class="btn btn-secondary" onclick="passwordManager.copyPassword('${entry.id}')">
                            <span class="btn-icon"></span>
                            Copy&nbsp;&nbsp;
                        </button>
                        <button class="btn btn-danger" onclick="passwordManager.deletePassword('${entry.id}')">
                            <span class="btn-icon"></span>
                            Delete&nbsp;&nbsp;
                        </button>
                    </div>
                </div>
                <div class="password-field">
                    <div class="password-display password-hidden" id="pwd-${entry.id}">
                        ••••••••••••
                    </div>
                    <button class="toggle-password" onclick="passwordManager.togglePassword('${entry.id}')" title="Show/Hide Password">
                        👁️
                    </button>
                </div>
            </div>
        `).join('');

        // Add animation to new items
        const items = passwordList.querySelectorAll('.password-item');
        items.forEach((item, index) => {
            if (index === 0) {
                item.classList.add('new');
                setTimeout(() => item.classList.remove('new'), 300);
            }
        });
    }

    // Password Visibility Toggle
    togglePassword(id) {
        const passwordDisplay = document.getElementById(`pwd-${id}`);
        const entry = this.passwords.find(p => p.id === id);
        
        if (!entry) return;

        if (passwordDisplay.classList.contains('password-hidden')) {
            passwordDisplay.textContent = this.decryptPassword(entry.password);
            passwordDisplay.classList.remove('password-hidden');
        } else {
            passwordDisplay.textContent = '••••••••••••';
            passwordDisplay.classList.add('password-hidden');
        }
    }

    // Copy Password to Clipboard
    async copyPassword(id) {
        const entry = this.passwords.find(p => p.id === id);
        if (!entry) return;

        const password = this.decryptPassword(entry.password);
        
        try {
            await navigator.clipboard.writeText(password);
            this.showToast('Password copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(password);
        }
    }

    // Fallback copy method for older browsers
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showToast('Password copied to clipboard!');
            } else {
                this.showToast('Failed to copy password', 'error');
            }
        } catch (error) {
            this.showToast('Failed to copy password', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // Delete Password
    deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            this.passwords = this.passwords.filter(p => p.id !== id);
            this.savePasswords();
            this.renderPasswords();
            this.updatePasswordCount();
            this.showToast('Password deleted successfully!');
        }
    }

    // Update Password Count
    updatePasswordCount() {
        const countElement = document.getElementById('passwordCount');
        const count = this.passwords.length;
        countElement.textContent = `${count} password${count !== 1 ? 's' : ''} saved`;
    }

    // Clear Form
    clearForm() {
        document.getElementById('passwordForm').reset();
    }

    // Toast Notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // HTML Escape for Security
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize Password Manager
const passwordManager = new PasswordManager();

// Additional utility functions
document.addEventListener('DOMContentLoaded', function() {
    // Focus on first input when page loads
    document.getElementById('website').focus();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save (prevent default save dialog)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const submitBtn = document.querySelector('.btn-primary');
            if (submitBtn) submitBtn.click();
        }
    });
    
    // Auto-save on form input (optional feature)
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Remove any previous error styling
            this.style.borderColor = '';
        });
    });
});

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordManager;
}
