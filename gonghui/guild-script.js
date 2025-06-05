// 公会页面专用脚本

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    checkUserLoginStatus();
    
    // 初始化卡片动画
    initializeCardAnimations();
    
    // 初始化模态框
    initializeJoinModal();
    
    // 初始化画廊
    initializeGallery();
});

// 初始化卡片动画
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.info-card');
    
    // 创建观察器来触发卡片动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // 观察所有卡片
    cards.forEach(card => {
        observer.observe(card);
    });
}

// 初始化加入公会模态框
function initializeJoinModal() {
    const modal = document.getElementById('joinModal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('joinForm');
    
    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        closeJoinModal();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeJoinModal();
        }
    });
    
    // 处理表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleJoinApplication();
    });
}

// 打开加入公会模态框
function openJoinModal() {
    const modal = document.getElementById('joinModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 添加打开动画
    setTimeout(() => {
        modal.classList.add('modal-open');
    }, 10);
}

// 关闭加入公会模态框
function closeJoinModal() {
    const modal = document.getElementById('joinModal');
    modal.classList.remove('modal-open');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// 处理加入申请
async function handleJoinApplication() {
    const form = document.getElementById('joinForm');
    const formData = new FormData(form);
    
    const applicationData = {
        playerName: formData.get('playerName'),
        joinReason: formData.get('joinReason'),
        contactQQ: formData.get('contactQQ'),
        guildName: document.title.split(' - ')[0] // 从页面标题获取公会名称
    };
    
    try {
        const response = await fetch('/api/guild-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('申请提交成功！我们会尽快联系您。', 'success');
            closeJoinModal();
            form.reset();
        } else {
            showNotification(result.message || '申请提交失败，请稍后再试。', 'error');
        }
    } catch (error) {
        console.error('申请提交错误:', error);
        showNotification('网络错误，请稍后再试。', 'error');
    }
}

// 初始化画廊
function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                openImageModal(img.src, img.alt);
            }
        });
    });
}

// 打开图片模态框
function openImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <img src="${src}" alt="${alt}" class="modal-image">
            <div class="image-caption">${alt}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .image-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
        }
        
        .image-modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            text-align: center;
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 80vh;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .image-caption {
            color: white;
            margin-top: 15px;
            font-size: 1.1rem;
        }
        
        .image-modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            z-index: 1001;
        }
        
        @keyframes fadeIn {
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // 关闭功能
    const closeBtn = modal.querySelector('.image-modal-close');
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            document.body.style.overflow = 'auto';
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 显示通知（复用主页面的函数）
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 用户登录状态检查（复用主页面的函数）
async function checkUserLoginStatus() {
    try {
        const response = await fetch('/api/user-status');
        const data = await response.json();
        
        if (data.logged_in) {
            showUserMenu(data.username);
        } else {
            showLoginMenu();
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        showLoginMenu();
    }
}

function showUserMenu(username) {
    const userMenuItem = document.getElementById('userMenuItem');
    const loginMenuItem = document.getElementById('loginMenuItem');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (userMenuItem && loginMenuItem && userDisplayName) {
        userDisplayName.textContent = username;
        userMenuItem.style.display = 'block';
        loginMenuItem.style.display = 'none';
        
        setupUserMenu();
    }
}

function showLoginMenu() {
    const userMenuItem = document.getElementById('userMenuItem');
    const loginMenuItem = document.getElementById('loginMenuItem');
    
    if (userMenuItem && loginMenuItem) {
        userMenuItem.style.display = 'none';
        loginMenuItem.style.display = 'block';
    }
}

function setupUserMenu() {
    const userMenuToggle = document.getElementById('userMenuToggle');
    const logoutLink = document.getElementById('logoutLink');
    
    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            performLogout();
        });
    }
}

async function performLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('退出登录成功！', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('退出登录失败，请稍后再试。', 'error');
        }
    } catch (error) {
        console.error('退出登录错误:', error);
        showNotification('网络错误，请稍后再试。', 'error');
    }
}
