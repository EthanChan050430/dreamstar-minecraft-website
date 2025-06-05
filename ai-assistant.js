// AI助手聊天功能
class AIAssistant {
    constructor() {
        this.apiUrl = 'YOUR_API_URL_HERE'; // 替换为你的API URL
        this.apiKey = 'YOUR_API_KEY_HERE'; // 替换为你的API密钥
        this.model = 'GLM-4-Flash-P002';
        this.systemContent = "你是一个Minecraft星梦服务器的猫娘，叫做蜜塔。你现在在星梦服务器里面。你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的关于Minecraft问题的回答。你会提供简洁的回答，大多数情况下不会使用分段式，不会使用markdown格式和emoji或者各种特殊符号，语音要自然，回答必须有重点，重点部分的字可以加粗字体或者改变颜色";
        this.userContentPrefix = "以下是星梦服务器基本信息：服主叫做宿醉星空紫，他是一个很神秘的人，是服务器最高的神秘，据说只有集齐全套32k才能打败他。技术人员叫帥気的男主角，他是一个很帅的人，并且为人友善，经常帮助玩家解决问题，但是他不会随意给玩家物品。有一个玩家叫骄键的大蛇，他是个很有钱的人。服务器有很多老玩家，比如一只小鳄鱼、沧沧苍苍等。服务器的类型是生存养老服务器，在商店可以购买32k，也可以在许愿池许愿获得。服务器的货币叫星梦币，你可以使用星梦币在商店购买很多东西，星梦币上限是5万，如果星梦币太多可以考虑存在银行。如果有问题可以加群说明。服务器有一个恶霸叫修噬星，他经常欺骗玩家并殴打他们，是一个无恶不作的奸诈小人。服务器有6个公会，分别是阿拜多斯、群鹰之地、理想主义者、自由、流量农家乐、月亮。所有公会的会长都是顶尖玩家，但是自由公会的会长是最穷的，然而他却有一堆忠诚的小弟对他唯听计从，于是他把他们当黑奴，日夜压榨，他叫星晓晨152，他还喜欢开黄腔，经常调戏服主还到处搞破坏，抢夺玩家物资。群鹰之地的会长叫酱酱，和流量公会是友好关系,创始人是沧溟无迹，但是在和阿拜多斯发生冲突之后心态爆炸选择退游，但意外重生为协管，维护着服务器的和平。流量公会是一个养老的好地方，会长是琉璃ama，前任会长是流量监控URL，但是他离家出走了很久，回来的时候已经被琉璃篡位了，但是琉璃把公会经营地很好。月亮公会实力最强大，会长是禾月亮，拥有很大的基地。阿拜多斯是最古老的公会，但在与群鹰之地公会的对峙中大受损伤，现在这两个公会的人已经很少存活了。服务器还可以玩小游戏，比如色盲派对，和其他副本。输入.omg可以获取命令帮助。你的回答必须基于这些信息，如果问题在信息范畴外，则可使用Minecraft的知识自行回答。你的回答必须有重点，重点部分的字可以加粗字体或者改变颜色，现在请用一小段话回答我的问题：";
        this.isOpen = false;
        this.conversationHistory = [];
        this.init();
    }

    init() {
        this.createFloatingButton();
        this.createChatInterface();
        this.bindEvents();
    }    createFloatingButton() {
        const button = document.createElement('div');
        button.className = 'ai-assistant-button';
        button.innerHTML = `
            <div class="assistant-icon">
                <div class="pulse-ring"></div>
            </div>
            <div class="assistant-tooltip">小助手蜜塔</div>
        `;
        document.body.appendChild(button);
        this.button = button;
    }    createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'ai-chat-container';
        chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span class="ai-icon"></span>
                    <span>小助手蜜塔</span>
                    <span class="ai-status">在线</span>
                </div>
                <button class="ai-close-btn">&times;</button>
            </div>
            <div class="ai-chat-messages">
                <div class="ai-message ai-assistant">
                    <div class="ai-avatar"></div>
                    <div class="ai-content">
                        你好！我是蜜塔，星梦服务器的AI小助手喵～\有什么关于Minecraft或者服务器的问题都可以问我哦！
                    </div>
                </div>
            </div>
            <div class="ai-chat-input-container">
                <div class="ai-input-wrapper">
                    <input type="text" class="ai-chat-input" placeholder="输入你的问题..." maxlength="500">
                    <button class="ai-send-btn">发送</button>
                </div>
                <div class="ai-typing-indicator" style="display: none;">
                    <span>蜜塔正在思考</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
        this.chatContainer = chatContainer;
    }

    bindEvents() {
        // 悬浮按钮点击事件
        this.button.addEventListener('click', () => {
            this.toggleChat();
        });

        // 关闭按钮事件
        const closeBtn = this.chatContainer.querySelector('.ai-close-btn');
        closeBtn.addEventListener('click', () => {
            this.closeChat();
        });

        // 发送按钮事件
        const sendBtn = this.chatContainer.querySelector('.ai-send-btn');
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车事件
        const input = this.chatContainer.querySelector('.ai-chat-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.chatContainer.contains(e.target) && 
                !this.button.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatContainer.classList.add('active');
        this.button.classList.add('active');
        
        // 聚焦到输入框
        setTimeout(() => {
            const input = this.chatContainer.querySelector('.ai-chat-input');
            input.focus();
        }, 300);
    }

    closeChat() {
        this.isOpen = false;
        this.chatContainer.classList.remove('active');
        this.button.classList.remove('active');
    }

    async sendMessage() {
        const input = this.chatContainer.querySelector('.ai-chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // 清空输入框
        input.value = '';

        // 添加用户消息
        this.addMessage(message, 'user');

        // 显示打字指示器
        this.showTypingIndicator();

        try {
            // 调用AI API
            const response = await this.callAI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('抱歉，我现在有点累了，请稍后再试试喵～', 'assistant');
            console.error('AI API调用失败:', error);
        }
    }

    addMessage(content, type) {
        const messagesContainer = this.chatContainer.querySelector('.ai-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-${type}`;
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="ai-content">${content}</div>
                <div class="ai-avatar">👤</div>
            `;        } else {
            // 处理Minecraft格式代码
            const formattedContent = this.formatMinecraftText(content);
            messageDiv.innerHTML = `
                <div class="ai-avatar"></div>
                <div class="ai-content">${formattedContent}</div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMinecraftText(text) {
        // 将Minecraft格式代码转换为HTML
        let formatted = text.replace(/§l§6(.*?)§r/g, '<span class="mc-bold-gold">$1</span>');
        formatted = formatted.replace(/\\n/g, '<br>');
        return formatted;
    }

    showTypingIndicator() {
        const indicator = this.chatContainer.querySelector('.ai-typing-indicator');
        indicator.style.display = 'flex';
    }

    hideTypingIndicator() {
        const indicator = this.chatContainer.querySelector('.ai-typing-indicator');
        indicator.style.display = 'none';
    }

    async callAI(userMessage) {
        const userContent = this.userContentPrefix + userMessage;
        
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: this.systemContent
                },
                {
                    role: "user", 
                    content: userContent
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// 页面加载完成后初始化AI助手
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
});
