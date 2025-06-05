// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

// 初始化网站功能
function initializeWebsite() {
    setupContactModal();
    setupScrollAnimations();
    setupCarousels();
    setupSmoothScrolling();
    setupNavigationEffects();
    checkUserLoginStatus();
    setupUserMenu();
}

// 检查用户登录状态
async function checkUserLoginStatus() {
    try {
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                showUserMenu(data.user.username);
            } else {
                showLoginButton();
            }
        } else {
            showLoginButton();
        }
    } catch (error) {
        console.log('检查登录状态失败:', error);
        showLoginButton();
    }
}

// 显示用户菜单
function showUserMenu(username) {
    const loginArea = document.getElementById('login-area');
    const userArea = document.getElementById('user-area');
    const usernameDisplay = document.getElementById('username-display');
    
    if (loginArea && userArea && usernameDisplay) {
        loginArea.style.display = 'none';
        userArea.style.display = 'block';
        usernameDisplay.textContent = username;
    }
}

// 显示登录按钮
function showLoginButton() {
    const loginArea = document.getElementById('login-area');
    const userArea = document.getElementById('user-area');
    
    if (loginArea && userArea) {
        loginArea.style.display = 'block';
        userArea.style.display = 'none';
    }
}

// 设置用户菜单功能
function setupUserMenu() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await performLogout();
        });
    }
}

// 执行注销操作
async function performLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showLoginButton();
                showNotification('注销成功', 'success');
            } else {
                showNotification('注销失败: ' + data.message, 'error');
            }
        } else {
            showNotification('注销失败，请重试', 'error');
        }
    } catch (error) {
        console.error('注销错误:', error);
        showNotification('注销失败，网络错误', 'error');
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        background: ${type === 'success' ? 'linear-gradient(45deg, #4CAF50, #45a049)' : 
                     type === 'error' ? 'linear-gradient(45deg, #f44336, #da190b)' : 
                     'linear-gradient(45deg, #2196F3, #0b7dda)'};
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 设置联系我们弹窗
function setupContactModal() {
    const contactBtn = document.getElementById('contact-btn');
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-modal');

    // 打开弹窗
    contactBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 添加打开动画
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    });

    // 关闭弹窗
    function closeModal() {
        modal.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(0.8)';
        modal.querySelector('.modal-content').style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    
    // 点击背景关闭弹窗
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// 设置滚动动画
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 观察所有需要动画的元素
    const animatedElements = document.querySelectorAll('.server-section, .owner-section');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// 设置轮播图功能
function setupCarousels() {
    const carousels = ['carousel1', 'carousel2', 'carousel3'];
      carousels.forEach(carouselId => {
        const carousel = document.getElementById(carouselId);
        
        if (!carousel) {
            console.error(`找不到轮播容器: ${carouselId}`);
            return;
        }
        
        const slides = carousel.querySelectorAll('.slide');
        if (slides.length === 0) {
            console.error(`轮播容器 ${carouselId} 中没有找到幻灯片`);
            return;
        }
        
        console.log(`初始化轮播 ${carouselId}，共 ${slides.length} 张幻灯片`);let currentSlide = 0;
        let autoSlideInterval;        // 显示指定的幻灯片
        function showSlide(index) {
            // 隐藏所有幻灯片
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
            });
            
            // 显示当前幻灯片
            if (slides[index]) {
                slides[index].classList.add('active');
                console.log(`${carouselId}: 显示幻灯片 ${index + 1}/${slides.length}`);
            } else {
                console.error(`${carouselId}: 幻灯片索引 ${index} 超出范围`);
            }
        }

        // 下一张幻灯片
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        // 上一张幻灯片
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }

        // 开始自动轮播
        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 4000);
        }

        // 停止自动轮播
        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }        // 鼠标悬停时停止自动轮播
        const carouselContainer = carousel.closest('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', stopAutoSlide);
            carouselContainer.addEventListener('mouseleave', startAutoSlide);
        }

        // 全局函数供按钮调用
        const carouselNumber = carouselId.slice(-1);
        window[`nextSlide${carouselNumber}`] = nextSlide;
        window[`prevSlide${carouselNumber}`] = prevSlide;

        // 确保初始状态正确 - 移除所有active类
        slides.forEach(slide => slide.classList.remove('active'));

        // 初始化显示第一张幻灯片
        showSlide(0);
        
        // 开始自动轮播
        startAutoSlide();
    });
}

// 全局轮播控制函数
function nextSlide(carouselId) {
    const carouselNum = carouselId.slice(-1);
    window[`nextSlide${carouselNum}`]();
}

function prevSlide(carouselId) {
    const carouselNum = carouselId.slice(-1);
    window[`prevSlide${carouselNum}`]();
}

// 设置平滑滚动
function setupSmoothScrolling() {
    // 为导航链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // 考虑导航栏高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 设置导航栏效果
function setupNavigationEffects() {
    const navbar = document.querySelector('.navbar');
    
    // 滚动时改变导航栏样式
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.9)';
            navbar.style.boxShadow = 'none';
        }
    });

    // 高亮当前页面部分
    highlightCurrentSection();
}

// 高亮当前页面部分
function highlightCurrentSection() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.dropdown-content a[href^="#"]');

    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// 添加页面加载动画
function addLoadingAnimation() {
    const mainTitle = document.querySelector('.main-title');
    
    // 页面加载完成后显示标题动画
    setTimeout(() => {
        mainTitle.style.transform = 'scale(1)';
        mainTitle.style.opacity = '1';
    }, 500);
}

// 添加鼠标跟随效果
function setupMouseFollowEffect() {
    const heroSection = document.querySelector('.hero-section');
    
    heroSection.addEventListener('mousemove', function(e) {
        const rect = heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / centerY * 5;
        const rotateY = (centerX - x) / centerX * 5;
        
        const mainTitle = document.querySelector('.main-title');
        mainTitle.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    heroSection.addEventListener('mouseleave', function() {
        const mainTitle = document.querySelector('.main-title');
        mainTitle.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
}

// 添加视差滚动效果
function setupParallaxEffect() {
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.server-section');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5;
            const offset = scrolled * speed;
            element.style.backgroundPosition = `center ${offset}px`;
        });
    });
}

// 添加打字机效果
function setupTypewriterEffect() {
    const subtitle = document.querySelector('.subtitle');
    const text = subtitle.textContent;
    subtitle.textContent = '';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        subtitle.textContent += text.charAt(i);
        i++;
        
        if (i >= text.length) {
            clearInterval(typeInterval);
        }
    }, 100);
}

// 初始化额外效果
document.addEventListener('DOMContentLoaded', function() {
    addLoadingAnimation();
    setupMouseFollowEffect();
    setupParallaxEffect();
    
    // 延迟启动打字机效果
    setTimeout(setupTypewriterEffect, 1000);
});

// 登录按钮点击事件
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login-btn');
    
    loginBtn.addEventListener('click', function() {
        // 添加点击动画
        this.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.style.transform = 'scale(1)';
            // 这里可以添加登录逻辑
            alert('登录功能正在开发中...');
        }, 150);
    });
});

// 添加粒子背景效果（可选）
function createParticleBackground() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    
    document.body.appendChild(canvas);
    
    const particles = [];
    const particleCount = 50;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 创建粒子
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 边界检测
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
            
            // 绘制粒子
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // 窗口大小变化时调整画布
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 启用粒子背景（可选）
// createParticleBackground();
