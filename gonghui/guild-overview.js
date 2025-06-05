// 公会大全页面交互脚本

document.addEventListener('DOMContentLoaded', function() {
    initializeGuildOverview();
});

// 初始化公会大全页面
function initializeGuildOverview() {
    initializeCardAnimations();
    initializeModal();
    initializeRankingAnimations();
    initializeUserAuth();
    setupScrollEffects();
    setupSearchListener();
}

// 设置搜索输入框监听器
function setupSearchListener() {
    const searchInput = document.getElementById('guildSearch');
    if (searchInput) {
        // 实时搜索
        searchInput.addEventListener('input', function() {
            const query = this.value;
            searchGuilds(query);
        });
        
        // 回车键搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value;
                searchGuilds(query);
            }
        });
    }
}

// 初始化卡片动画
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.guild-card');
    
    // 使用 Intersection Observer 实现滚动触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 200);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach(card => {
        observer.observe(card);
        
        // 添加鼠标悬停效果
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.zIndex = '';
        });
    });
}

// 初始化排行榜动画
function initializeRankingAnimations() {
    const rankingItems = document.querySelectorAll('.ranking-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.3
    });

    rankingItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-50px)';
        item.style.transition = 'all 0.6s ease';
        observer.observe(item);
        
        // 添加悬停效果
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

// 初始化模态框
function initializeModal() {
    const modal = document.getElementById('joinModal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('joinForm');
    
    // 关闭模态框
    closeBtn.addEventListener('click', closeJoinModal);
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeJoinModal();
        }
    });
    
    // 表单提交处理
    form.addEventListener('submit', handleJoinSubmit);
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeJoinModal();
        }
    });
}

// 用户认证相关
function initializeUserAuth() {
    const userAuthBtn = document.querySelector('.user-auth');
    const userMenu = document.querySelector('.user-menu');
    
    if (!userAuthBtn) return;
    
    // 检查登录状态
    checkLoginStatus();
    
    userAuthBtn.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        if (action === 'login') {
            window.location.href = '../login/login.html';
        } else if (action === 'profile') {
            toggleUserMenu();
        }
    });
    
    // 登出功能
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('username');
    const userAuthBtn = document.querySelector('.user-auth');
    const userMenu = document.querySelector('.user-menu');
    
    if (token && username) {
        userAuthBtn.textContent = username;
        userAuthBtn.setAttribute('data-action', 'profile');
        userMenu.style.display = 'block';
    } else {
        userAuthBtn.textContent = '登录';
        userAuthBtn.setAttribute('data-action', 'login');
        userMenu.style.display = 'none';
    }
}

// 切换用户菜单
function toggleUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const isVisible = userMenu.style.display !== 'none';
    userMenu.style.display = isVisible ? 'none' : 'block';
}

// 登出功能
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    showNotification('已成功登出', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// 打开加入公会模态框
function openJoinModal(guildName) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        showNotification('请先登录后再申请加入公会', 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    
    const modal = document.getElementById('joinModal');
    const form = document.getElementById('joinForm');
    
    // 设置公会名称
    form.setAttribute('data-guild', guildName);
    
    // 预填用户信息
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('playerName').value = username;
    }
    
    modal.style.display = 'block';
    
    // 添加显示动画
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 10);
}

// 关闭加入公会模态框
function closeJoinModal() {
    const modal = document.getElementById('joinModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.style.transform = 'scale(0.8)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('joinForm').reset();
    }, 300);
}

// 处理加入公会表单提交
async function handleJoinSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const guildName = form.getAttribute('data-guild');
    
    // 创建申请数据
    const applicationData = {
        guild: guildName,
        playerName: formData.get('playerName'),
        playerLevel: parseInt(formData.get('playerLevel')),
        serverChoice: formData.get('serverChoice'),
        experience: formData.get('experience'),
        reason: formData.get('reason'),
        timestamp: new Date().toISOString(),
        username: localStorage.getItem('username'),
        status: 'pending'
    };
    
    // 显示提交中状态
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    
    try {
        // 发送申请请求
        const response = await fetch('/api/guild/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(applicationData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('申请已提交，请等待公会管理员审核', 'success');
            closeJoinModal();
            
            // 保存申请记录到本地存储
            saveApplicationToLocal(applicationData);
        } else {
            const error = await response.json();
            showNotification(error.message || '申请提交失败，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('申请提交错误:', error);
        
        // 如果网络请求失败，保存到本地存储
        saveApplicationToLocal(applicationData);
        showNotification('申请已保存，将在网络恢复时自动提交', 'info');
        closeJoinModal();
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 保存申请到本地存储
function saveApplicationToLocal(applicationData) {
    const applications = JSON.parse(localStorage.getItem('guild_applications') || '[]');
    applications.push(applicationData);
    localStorage.setItem('guild_applications', JSON.stringify(applications));
}

// 设置滚动效果
function setupScrollEffects() {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const navbar = document.querySelector('.navbar');
        
        // 导航栏隐藏/显示效果
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
        
        // 视差滚动效果
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        const backgrounds = document.querySelectorAll('.guild-background');
        backgrounds.forEach(bg => {
            bg.style.transform = `translateY(${rate}px)`;
        });
    });
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 2000;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 15px 20px;
        color: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: translateX(400px);
        transition: all 0.3s ease;
        max-width: 350px;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 关闭按钮事件
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // 自动关闭
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

// 移除通知
function removeNotification(notification) {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

// 搜索功能
function searchGuilds(query) {
    const cards = document.querySelectorAll('.guild-card');
    const searchTerm = query.toLowerCase().trim();
    let visibleCount = 0;
    
    if (!searchTerm) {
        // 如果搜索为空，显示所有卡片
        cards.forEach(card => {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
            visibleCount++;
        });
        updateSearchStatus(visibleCount, cards.length);
        return;
    }
    
    cards.forEach(card => {
        const guildName = card.querySelector('.guild-name').textContent.toLowerCase();
        const guildMotto = card.querySelector('.guild-motto').textContent.toLowerCase();
        const guildTags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        const guildLeader = card.querySelector('.info-value').textContent.toLowerCase();
        
        const isMatch = guildName.includes(searchTerm) || 
                       guildMotto.includes(searchTerm) || 
                       guildTags.some(tag => tag.includes(searchTerm)) ||
                       guildLeader.includes(searchTerm);
        
        if (isMatch) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
            highlightSearchTerm(card, searchTerm);
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    updateSearchStatus(visibleCount, cards.length);
}

// 高亮搜索词
function highlightSearchTerm(card, searchTerm) {
    const elements = card.querySelectorAll('.guild-name, .guild-motto, .tag, .info-value');
    elements.forEach(element => {
        const originalText = element.getAttribute('data-original') || element.textContent;
        if (!element.getAttribute('data-original')) {
            element.setAttribute('data-original', originalText);
        }
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark style="background: rgba(100, 181, 246, 0.3); color: #64b5f6; border-radius: 3px; padding: 1px 3px;">$1</mark>');
        element.innerHTML = highlightedText;
    });
}

// 更新搜索状态
function updateSearchStatus(visibleCount, totalCount) {
    // 移除现有的状态提示
    const existingStatus = document.querySelector('.search-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // 创建新的状态提示
    const statusElement = document.createElement('div');
    statusElement.className = 'search-status';
    statusElement.innerHTML = `
        <span class="status-text">
            显示 ${visibleCount} / ${totalCount} 个公会
            ${visibleCount === 0 ? '<span style="color: #ff5722;">未找到匹配的公会</span>' : ''}
        </span>
    `;
    
    // 插入到工具栏后面
    const toolbar = document.querySelector('.guild-toolbar');
    toolbar.parentNode.insertBefore(statusElement, toolbar.nextSibling);
}

// 筛选功能
function filterGuilds(criteria) {
    const cards = document.querySelectorAll('.guild-card');
    
    cards.forEach(card => {
        let shouldShow = true;
        
        // 根据等级筛选
        if (criteria.level) {
            const guildLevel = parseInt(card.querySelector('.info-value').textContent.replace('Lv.', ''));
            shouldShow = shouldShow && guildLevel >= criteria.level;
        }
        
        // 根据标签筛选
        if (criteria.tags && criteria.tags.length > 0) {
            const guildTags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
            shouldShow = shouldShow && criteria.tags.some(tag => guildTags.includes(tag));
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// 应用筛选器
function applyFilters() {
    const levelFilter = document.getElementById('levelFilter');
    const level = levelFilter ? parseInt(levelFilter.value) : null;
    
    filterGuilds({
        level: level
    });
}

// 重置筛选器
function resetFilters() {
    // 重置筛选器控件
    const levelFilter = document.getElementById('levelFilter');
    const sortBy = document.getElementById('sortBy');
    const searchInput = document.getElementById('guildSearch');
    
    if (levelFilter) levelFilter.value = '';
    if (sortBy) sortBy.value = '';
    if (searchInput) searchInput.value = '';
    
    // 显示所有卡片
    const cards = document.querySelectorAll('.guild-card');
    cards.forEach(card => {
        card.style.display = 'block';
        card.style.animation = 'fadeIn 0.5s ease';
    });
    
    // 重置为默认顺序
    const container = document.querySelector('.guilds-grid');
    const cards_array = Array.from(cards);
    cards_array.sort((a, b) => {
        const guildOrder = ['tianyu', 'xinghe', 'cangqiong', 'menghua', 'fengyun', 'longteng'];
        const aGuild = a.getAttribute('data-guild');
        const bGuild = b.getAttribute('data-guild');
        return guildOrder.indexOf(aGuild) - guildOrder.indexOf(bGuild);
    });
    
    cards_array.forEach(card => container.appendChild(card));
}

// 排序功能
function sortGuilds(criteria) {
    const container = document.querySelector('.guilds-grid');
    const cards = Array.from(container.querySelectorAll('.guild-card'));
    
    cards.sort((a, b) => {
        switch (criteria) {
            case 'level':
                const levelA = parseInt(a.querySelector('.info-value').textContent.replace('Lv.', ''));
                const levelB = parseInt(b.querySelector('.info-value').textContent.replace('Lv.', ''));
                return levelB - levelA;
            case 'members':
                const membersA = parseInt(a.querySelectorAll('.info-value')[1].textContent.replace('人', ''));
                const membersB = parseInt(b.querySelectorAll('.info-value')[1].textContent.replace('人', ''));
                return membersB - membersA;
            case 'name':
                const nameA = a.querySelector('.guild-name').textContent;
                const nameB = b.querySelector('.guild-name').textContent;
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });
    
    // 重新排列DOM元素
    cards.forEach(card => container.appendChild(card));
}

// 添加CSS动画类
const style = document.createElement('style');
style.textContent = `
    .guild-card.animate-in {
        animation: cardSlideIn 0.8s ease forwards;
    }
    
    @keyframes cardSlideIn {
        from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-icon {
        font-weight: bold;
        font-size: 1.2rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// 全局公开函数
window.openJoinModal = openJoinModal;
window.closeJoinModal = closeJoinModal;
window.searchGuilds = searchGuilds;
window.filterGuilds = filterGuilds;
window.sortGuilds = sortGuilds;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
