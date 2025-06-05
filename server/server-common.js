// 服务器页面通用JavaScript功能
class ServerPageManager {
    constructor(serverName, serverPort = 9876) {
        this.serverName = serverName;
        this.serverPort = serverPort;
        this.currentPage = 'home';
        this.chatMessages = [];
        this.socket = null;
          this.init();
    }

    init() {
        this.createParticles();
        this.setupNavigation();
        this.setupNavbarScroll();
        this.showPage('home');
        this.connectToChat();
        this.startChatPolling();
    }

    // 创建粒子效果
    createParticles() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 1}px;
                height: ${Math.random() * 4 + 1}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1});
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float ${Math.random() * 20 + 10}s infinite linear;
                pointer-events: none;
            `;
            particlesContainer.appendChild(particle);
        }

        // 添加CSS动画
        if (!document.querySelector('#particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes float {
                    0% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }    // 设置导航功能
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
                this.setActiveNav(link);
            });
        });

        // 设置下拉菜单功能
        this.setupDropdownMenus();
    }

    // 设置下拉菜单功能
    setupDropdownMenus() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                // 点击切换下拉菜单
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 关闭其他下拉菜单
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.classList.remove('active');
                        }
                    });
                    
                    // 切换当前下拉菜单
                    dropdown.classList.toggle('active');
                });
            }
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        });

        // 阻止下拉菜单内部点击冒泡
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }    // 设置导航栏滚动效果
    setupNavbarScroll() {
        let lastScrollTop = 0;
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // 显示指定页面
    showPage(pageName) {
        // 隐藏所有页面
        const allPages = document.querySelectorAll('.page-section');
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.querySelector(`[data-page-content="${pageName}"]`);
        if (targetPage) {
            setTimeout(() => {
                targetPage.classList.add('active');
            }, 100);
        }

        this.currentPage = pageName;

        // 如果是聊天页面，刷新聊天内容
        if (pageName === 'chat') {
            this.refreshChat();
        }
    }

    // 设置活跃导航
    setActiveNav(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }    // 连接到聊天服务器
    async connectToChat() {
        console.log(`正在连接到${this.serverName}聊天系统...`);
        
        try {
            // 测试API连接 - 支持远程服务器
            const apiBase = window.location.hostname === 'localhost' 
                ? 'http://localhost:5000' 
                : 'http://101.34.205.89:5000';
                
            console.log(`使用API地址: ${apiBase}`);
            
            const response = await fetch(`${apiBase}/api/servers`);
            if (response.ok) {
                const data = await response.json();
                console.log('聊天API连接成功，服务器列表:', data);
                this.apiBase = apiBase;
                this.updateChatStatus(true);
                return true;
            } else {
                console.warn('聊天API连接失败，状态码:', response.status);
                this.updateChatStatus(false);
                return false;
            }
        } catch (error) {
            console.warn('无法连接到聊天API，使用模拟数据:', error);
            this.updateChatStatus(false);
            return false;
        }
    }

    // 开始聊天轮询
    startChatPolling() {
        // 每3秒更新一次聊天记录（更频繁的更新）
        setInterval(() => {
            this.fetchChatMessages();
        }, 3000);
        
        // 立即获取一次
        this.fetchChatMessages();
    }

    // 获取聊天消息 - 重写以支持多种服务器名称
    async fetchChatMessages() {
        if (!this.apiBase) {
            console.warn('API未连接，跳过获取聊天消息');
            this.simulateChat();
            return;
        }

        try {            // 尝试多种服务器名称匹配
            const serverNameVariations = [
                this.serverName,
                this.serverName.replace('星梦', ''),
                `星梦${this.serverName}`,
                this.serverName === '星梦1服' ? '星梦生存服' : this.serverName,
                this.serverName === '星梦2服' ? '星梦空岛服' : this.serverName,
                this.serverName === '星梦3服' ? '星梦32K服' : this.serverName
            ];

            console.log(`正在获取聊天消息，尝试的服务器名称:`, serverNameVariations);

            let allMessages = [];
            let foundMessages = false;

            // 首先尝试获取所有消息，然后过滤
            try {
                const allResponse = await fetch(`${this.apiBase}/api/messages?limit=50`);
                if (allResponse.ok) {
                    const allData = await allResponse.json();
                    if (allData.success && allData.messages) {
                        console.log('获取到所有消息:', allData.messages.length, '条');
                        
                        // 过滤出匹配的服务器消息
                        allMessages = allData.messages.filter(msg => 
                            serverNameVariations.includes(msg.server)
                        );
                        
                        if (allMessages.length > 0) {
                            foundMessages = true;
                            console.log(`找到匹配的消息:`, allMessages.length, '条');
                        }
                    }
                }
            } catch (error) {
                console.warn('获取所有消息失败:', error);
            }

            // 如果没有找到消息，尝试逐个服务器名称查询
            if (!foundMessages) {
                for (const serverName of serverNameVariations) {
                    try {
                        const response = await fetch(`${this.apiBase}/api/chat/${encodeURIComponent(serverName)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.messages && data.messages.length > 0) {
                                allMessages = data.messages;
                                foundMessages = true;
                                console.log(`在服务器 "${serverName}" 中找到 ${data.messages.length} 条消息`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.warn(`查询服务器 "${serverName}" 失败:`, error);
                    }
                }
            }

            if (foundMessages) {
                this.updateChatDisplay(allMessages);
                this.updateChatStatus(true);
            } else {
                console.log('未找到任何匹配的聊天消息，使用模拟数据');
                this.simulateChat();
            }
            
        } catch (error) {
            console.warn('获取聊天消息失败，使用模拟数据:', error);
            this.simulateChat();
        }
    }

    // 更新聊天状态显示
    updateChatStatus(connected) {
        const statusIndicators = document.querySelectorAll('.chat-header .status-indicator');
        statusIndicators.forEach(indicator => {
            indicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
        });
    }    // 更新聊天消息显示 - 优化动画版本
    updateChatDisplay(messages) {
        const chatContainer = document.querySelector('.chat-messages');
        if (!chatContainer) {
            console.warn('找不到聊天容器元素');
            return;
        }

        if (!messages || messages.length === 0) {
            chatContainer.innerHTML = '<div class="no-messages">暂无聊天消息</div>';
            console.log('没有消息需要显示');
            return;
        }

        console.log(`更新聊天显示: ${messages.length} 条消息`);

        // 按时间排序（最新的在下面，符合聊天习惯）
        const sortedMessages = messages
            .filter(msg => msg && msg.message && msg.player && msg.type !== 'system') // 过滤无效消息和系统消息
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (sortedMessages.length === 0) {
            chatContainer.innerHTML = '<div class="no-messages">暂无有效聊天消息</div>';
            return;
        }

        // 获取当前已存在的消息ID
        const existingMessageIds = new Set();
        chatContainer.querySelectorAll('.chat-message[data-id]').forEach(msg => {
            const id = msg.getAttribute('data-id');
            if (id) existingMessageIds.add(id);
        });

        // 只处理新消息，避免重复渲染导致的闪烁
        const newMessages = sortedMessages.filter(msg => !existingMessageIds.has(String(msg.id)));

        if (newMessages.length === 0 && existingMessageIds.size > 0) {
            // 没有新消息，不需要更新
            return;
        }

        // 如果有新消息或者是首次加载，重新渲染
        const messagesHTML = sortedMessages.map((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const typeClass = msg.type === 'outgoing' ? 'outgoing' : 'incoming';
            const serverInfo = msg.server && msg.server !== this.serverName ? `[${msg.server}] ` : '';
            
            // 判断是否为新消息，添加动画类
            const isNewMessage = !existingMessageIds.has(String(msg.id));
            const animationClass = isNewMessage ? 'new-message-animation' : '';
            
            return `
                <div class="chat-message ${typeClass} ${animationClass}" data-id="${msg.id || ''}">
                    <div class="chat-header-msg">
                        <span class="chat-player">${serverInfo}${msg.player}</span>
                        <span class="chat-time">${timestamp}</span>
                    </div>
                    <div class="chat-content">${this.escapeHtml(msg.message)}</div>
                </div>
            `;
        }).join('');

        chatContainer.innerHTML = messagesHTML;

        // 滚动到底部（最新消息）
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 移除动画类（避免重复触发）
        setTimeout(() => {
            chatContainer.querySelectorAll('.new-message-animation').forEach(element => {
                element.classList.remove('new-message-animation');
            });
        }, 1000);

        // 保存消息到本地存储
        this.chatMessages = sortedMessages;
        
        console.log(`聊天显示已更新，显示 ${sortedMessages.length} 条消息，新消息 ${newMessages.length} 条`);
    }

    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 模拟聊天消息（实际应用中应该从服务器获取真实消息）
    simulateChat() {
        if (Math.random() > 0.7) { // 30%概率生成新消息
            const players = ['玩家A', '建筑大师', '冒险者小明', '挖矿王', '农夫老李'];
            const messages = [
                '大家好！今天天气不错啊',
                '谁要一起去挖矿？',
                '我刚建了一个很酷的城堡',
                '有人想交易吗？',
                '晚上一起打怪吧！',
                '服务器真的很棒！',
                '新手求带~',
                '刚发现一个钻石矿'
            ];
            
            const message = {
                server: this.serverName,
                player: players[Math.floor(Math.random() * players.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: new Date().toLocaleString(),
                type: 'incoming'
            };
            
            this.addChatMessage(message);
        }
    }

    // 添加聊天消息
    addChatMessage(messageData) {
        // 只显示本服务器的消息
        if (messageData.server !== this.serverName) {
            return;
        }

        this.chatMessages.unshift(messageData);
        
        // 限制消息数量
        if (this.chatMessages.length > 50) {
            this.chatMessages = this.chatMessages.slice(0, 50);
        }

        // 如果当前在聊天页面，立即更新显示
        if (this.currentPage === 'chat') {
            this.refreshChat();
        }
    }

    // 刷新聊天显示
    refreshChat() {
        const chatContainer = document.querySelector('.chat-messages');
        if (!chatContainer) return;

        if (this.chatMessages.length === 0) {
            chatContainer.innerHTML = '<div class="no-messages">暂无聊天消息</div>';
            return;
        }

        chatContainer.innerHTML = this.chatMessages.map(msg => `
            <div class="chat-message">
                <div class="chat-player">${msg.player}</div>
                <div class="chat-content">${msg.message}</div>
                <div class="chat-time">${msg.timestamp}</div>
            </div>
        `).join('');

        // 滚动到顶部（最新消息）
        chatContainer.scrollTop = 0;
    }    // 获取服务器状态
    async getServerStatus() {
        // 返回固定的服务器状态
        return {
            online: true, // 始终在线
            players: '20', // 可容纳玩家数
            version: '我的世界中国版',
            ping: '2ms' // 固定延迟
        };
    }

    // 更新服务器状态显示
    async updateServerStatus() {
        const status = await this.getServerStatus();
        const statusElements = document.querySelectorAll('[data-server-status]');
        
        statusElements.forEach(element => {
            const type = element.getAttribute('data-server-status');
            switch(type) {
                case 'online':
                    const isOnline = typeof status.online === 'boolean' ? status.online : true;
                    element.textContent = isOnline ? '在线' : '离线';
                    if (element.classList.contains('status-indicator')) {
                        element.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
                    }
                    break;
                case 'players':
                    element.textContent = status.players;
                    break;
                case 'version':
                    element.textContent = status.version;
                    break;
                case 'ping':
                    element.textContent = status.ping;
                    break;
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
