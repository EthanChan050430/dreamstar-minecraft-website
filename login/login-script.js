// 登录页面JavaScript功能

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
    initializeContactModal();
});

// 初始化登录页面
function initializeLoginPage() {
    setupFormValidation();
    setupInputEffects();
    setupFormSubmission();
    setupSocialLogin();
    setupRegisterAndForgotPassword();
    addInteractiveEffects();
}

// 初始化联系我们模态框
function initializeContactModal() {
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeModal = document.getElementById('close-modal');
    
    // 检查元素是否存在
    if (contactBtn && contactModal && closeModal) {
        // 打开模态框
        contactBtn.addEventListener('click', function() {
            contactModal.style.display = 'block';
            setTimeout(() => {
                contactModal.classList.add('show');
            }, 10);
        });
        
        // 关闭模态框
        closeModal.addEventListener('click', function() {
            contactModal.classList.remove('show');
            setTimeout(() => {
                contactModal.style.display = 'none';
            }, 300);
        });
        
        // 点击模态框外部关闭
        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.classList.remove('show');
                setTimeout(() => {
                    contactModal.style.display = 'none';
                }, 300);
            }
        });
    }
}

// 设置表单验证
function setupFormValidation() {
    const inputs = document.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        // 实时验证
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

// 验证单个字段
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // 移除之前的错误状态
    field.classList.remove('error');
    removeErrorMessage(field);
    
    // 验证用户名
    if (fieldName === 'username') {
        if (value.length === 0) {
            isValid = false;
            errorMessage = '请输入用户名';
        } else if (value.length < 3) {
            isValid = false;
            errorMessage = '用户名至少3个字符';
        } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
            isValid = false;
            errorMessage = '用户名只能包含字母、数字、下划线和中文';
        }
    }
    
    // 验证密码
    if (fieldName === 'password') {
        if (value.length === 0) {
            isValid = false;
            errorMessage = '请输入密码';
        } else if (value.length < 6) {
            isValid = false;
            errorMessage = '密码至少6个字符';
        }
    }
    
    // 显示错误
    if (!isValid) {
        field.classList.add('error');
        showErrorMessage(field, errorMessage);
    }
    
    return isValid;
}

// 显示错误消息
function showErrorMessage(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ff6b6b;
        font-size: 12px;
        margin-top: 5px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    `;
    
    field.parentNode.appendChild(errorDiv);
    
    // 动画显示
    setTimeout(() => {
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateY(0)';
    }, 10);
}

// 移除错误消息
function removeErrorMessage(field) {
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.opacity = '0';
        errorMessage.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            errorMessage.remove();
        }, 300);
    }
}

// 设置输入框效果
function setupInputEffects() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // 聚焦效果
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
            addInputRipple(this);
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
    });
}

// 添加输入框涟漪效果
function addInputRipple(input) {
    const ripple = document.createElement('div');
    ripple.className = 'input-ripple';
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 20px;
        width: 0;
        height: 0;
        background: rgba(78, 205, 196, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: inputRipple 0.6s ease-out;
        pointer-events: none;
    `;
    
    input.parentNode.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 设置表单提交
function setupFormSubmission() {
    const form = document.getElementById('loginForm');
    const submitBtn = form.querySelector('.login-btn-primary');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 验证所有字段
        const inputs = form.querySelectorAll('input[required]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                allValid = false;
            }
        });
          if (allValid) {
            // 显示加载状态
            showLoginLoading(submitBtn);
            
            // 调用真实的登录API
            performLogin();
        } else {
            // 震动效果
            form.classList.add('shake');
            setTimeout(() => {
                form.classList.remove('shake');
            }, 600);
        }
    });
}

// 显示登录加载状态
function showLoginLoading(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <div class="loading-spinner"></div>
        <span>登录中...</span>
    `;
    
    // 添加加载样式
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // 恢复按钮状态的函数
    window.resetLoginButton = function() {
        button.disabled = false;
        button.innerHTML = originalText;
        style.remove();
    };
}

// 模拟登录
// 执行真实的登录请求
async function performLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // 包含session cookie
        });
        
        const result = await response.json();
          if (result.success) {
            showLoginSuccess();
            setTimeout(() => {
                // 跳转到主页
                window.location.href = '/';
            }, 1500);
        } else {
            showLoginError(result.message || '登录失败');
            resetLoginButton();
        }
    } catch (error) {
        console.error('登录请求失败:', error);
        showLoginError('网络连接失败，请检查服务器是否启动');
        resetLoginButton();
    }
}

// 显示登录成功
function showLoginSuccess() {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <div class="success-icon">✓</div>
        <span>登录成功！正在跳转...</span>
    `;
    successMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(76, 175, 80, 0.95);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        opacity: 0;
        scale: 0.8;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        successMessage.style.opacity = '1';
        successMessage.style.scale = '1';
    }, 10);
}

// 显示登录错误
function showLoginError(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message-popup';
    errorMessage.innerHTML = `
        <div class="error-icon">✕</div>
        <span>${message}</span>
    `;
    errorMessage.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(244, 67, 54, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(errorMessage);
    
    setTimeout(() => {
        errorMessage.style.opacity = '1';
        errorMessage.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // 3秒后自动消失
    setTimeout(() => {
        errorMessage.style.opacity = '0';
        errorMessage.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            errorMessage.remove();
        }, 300);
    }, 3000);
}

// 设置社交登录
function setupSocialLogin() {
    const qqBtn = document.querySelector('.qq-btn');
    const wechatBtn = document.querySelector('.wechat-btn');
    
    qqBtn.addEventListener('click', function() {
        showComingSoon('QQ登录');
    });
    
    wechatBtn.addEventListener('click', function() {
        showComingSoon('微信登录');
    });
}

// 显示即将推出提示
function showComingSoon(feature) {
    const message = document.createElement('div');
    message.textContent = `${feature}功能即将推出！`;
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 193, 7, 0.95);
        color: #333;
        padding: 15px 25px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        z-index: 10000;
        opacity: 0;
        scale: 0.8;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.scale = '1';
    }, 10);
    
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.scale = '0.8';
        setTimeout(() => {
            message.remove();
        }, 300);
    }, 2000);
}

// 设置注册和忘记密码功能
function setupRegisterAndForgotPassword() {
    const registerBtn = document.querySelector('.register-btn');
    const forgotPasswordBtn = document.querySelector('.forgot-password');
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterModal();
        });
    }
    
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
}

// 显示注册模态框
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>用户注册</h3>
                <span class="auth-modal-close">&times;</span>
            </div>
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="regUsername">用户名</label>
                    <input type="text" id="regUsername" name="username" required>
                </div>
                <div class="form-group">
                    <label for="regEmail">邮箱</label>
                    <input type="email" id="regEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="regPassword">密码</label>
                    <input type="password" id="regPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label for="regConfirmPassword">确认密码</label>
                    <input type="password" id="regConfirmPassword" name="confirmPassword" required>
                </div>
                <button type="submit" class="auth-btn">注册</button>
            </form>
            <div id="registerMessage"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加样式
    addAuthModalStyles();
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 绑定事件
    setupRegisterModalEvents(modal);
}

// 显示忘记密码模态框
function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>忘记密码</h3>
                <span class="auth-modal-close">&times;</span>
            </div>
            <form id="forgotPasswordForm" class="auth-form">
                <div class="form-group">
                    <label for="forgotEmail">请输入您的邮箱地址</label>
                    <input type="email" id="forgotEmail" name="email" required placeholder="example@email.com">
                </div>
                <button type="submit" class="auth-btn">发送重置链接</button>
            </form>
            <div id="forgotPasswordMessage"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加样式
    addAuthModalStyles();
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 绑定事件
    setupForgotPasswordModalEvents(modal);
}

// 设置注册模态框事件
function setupRegisterModalEvents(modal) {
    const closeBtn = modal.querySelector('.auth-modal-close');
    const form = modal.querySelector('#registerForm');
    
    // 关闭按钮
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // 表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegister(form, modal);
    });
}

// 设置忘记密码模态框事件
function setupForgotPasswordModalEvents(modal) {
    const closeBtn = modal.querySelector('.auth-modal-close');
    const form = modal.querySelector('#forgotPasswordForm');
    
    // 关闭按钮
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // 表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleForgotPassword(form, modal);
    });
}

// 处理注册
async function handleRegister(form, modal) {
    const formData = new FormData(form);
    const username = formData.get('username').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password').trim();
    const confirmPassword = formData.get('confirmPassword').trim();
    const messageDiv = modal.querySelector('#registerMessage');
    
    // 验证密码一致性
    if (password !== confirmPassword) {
        showAuthMessage(messageDiv, '两次输入的密码不一致', 'error');
        return;
    }
    
    // 显示加载状态
    const submitBtn = form.querySelector('.auth-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '注册中...';
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAuthMessage(messageDiv, result.message, 'success');
            setTimeout(() => {
                closeModal(modal);
            }, 2000);
        } else {
            showAuthMessage(messageDiv, result.message, 'error');
        }
    } catch (error) {
        console.error('注册请求失败:', error);
        showAuthMessage(messageDiv, '网络连接失败，请检查服务器是否启动', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 处理忘记密码
async function handleForgotPassword(form, modal) {
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const messageDiv = modal.querySelector('#forgotPasswordMessage');
    
    // 显示加载状态
    const submitBtn = form.querySelector('.auth-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';
    
    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAuthMessage(messageDiv, result.message, 'success');
            if (result.reset_url) {
                // 显示重置链接（在实际应用中应该发送到邮箱）
                showAuthMessage(messageDiv, `重置链接: ${result.reset_url}`, 'info');
            }
        } else {
            showAuthMessage(messageDiv, result.message, 'error');
        }
    } catch (error) {
        console.error('忘记密码请求失败:', error);
        showAuthMessage(messageDiv, '网络连接失败，请检查服务器是否启动', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 显示认证消息
function showAuthMessage(messageDiv, message, type) {
    messageDiv.innerHTML = `<div class="auth-message ${type}">${message}</div>`;
}

// 关闭模态框
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

// 添加认证模态框样式
function addAuthModalStyles() {
    if (document.getElementById('authModalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'authModalStyles';
    style.textContent = `
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .auth-modal.show {
            opacity: 1;
        }
        
        .auth-modal-content {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            color: white;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .auth-modal.show .auth-modal-content {
            transform: scale(1);
        }
        
        .auth-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .auth-modal-header h3 {
            margin: 0;
            font-size: 1.5rem;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .auth-modal-close {
            cursor: pointer;
            font-size: 24px;
            color: rgba(255, 255, 255, 0.7);
            transition: color 0.3s ease;
        }
        
        .auth-modal-close:hover {
            color: #ff6b6b;
        }
        
        .auth-form .form-group {
            margin-bottom: 20px;
        }
        
        .auth-form label {
            display: block;
            margin-bottom: 5px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        .auth-form input {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .auth-form input:focus {
            outline: none;
            border-color: #4ecdc4;
            background: rgba(255, 255, 255, 0.15);
        }
        
        .auth-form input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        .auth-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }
        
        .auth-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .auth-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .auth-message {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.9rem;
        }
        
        .auth-message.success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4caf50;
        }
        
        .auth-message.error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            color: #f44336;
        }
        
        .auth-message.info {
            background: rgba(33, 150, 243, 0.2);
            border: 1px solid rgba(33, 150, 243, 0.5);
            color: #2196f3;
            word-break: break-all;
        }
        
        @media (max-width: 480px) {
            .auth-modal-content {
                padding: 20px;
                margin: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// 添加交互效果
function addInteractiveEffects() {
    // 鼠标跟踪效果
    document.addEventListener('mousemove', function(e) {
        createMouseTrail(e.clientX, e.clientY);
    });
    
    // 为表单添加震动动画
    const style = document.createElement('style');
    style.textContent = `
        .shake {
            animation: shake 0.6s ease-in-out;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .error {
            border-color: #ff6b6b !important;
            box-shadow: 0 0 15px rgba(255, 107, 107, 0.3) !important;
        }
        @keyframes inputRipple {
            to {
                width: 50px;
                height: 50px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 创建鼠标轨迹
function createMouseTrail(x, y) {
    if (Math.random() > 0.95) { // 降低频率
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: rgba(78, 205, 196, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: trailFade 1s ease-out forwards;
        `;
        
        document.body.appendChild(trail);
        
        setTimeout(() => {
            trail.remove();
        }, 1000);
    }
}

// 添加轨迹动画
const trailStyle = document.createElement('style');
trailStyle.textContent = `
    @keyframes trailFade {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0.3);
        }    }
`;
document.head.appendChild(trailStyle);
