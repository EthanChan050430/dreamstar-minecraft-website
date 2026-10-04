#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
星梦服务器官网 Flask 后端
主要功能：用户认证、注册、密码重置
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_cors import CORS
import csv
import hashlib
import secrets
import re
import os
from datetime import datetime, timedelta
import threading
import time
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))  # 生产环境应使用更安全的密钥
CORS(app)

# 配置
CSV_FILE = 'users.csv'
RESET_TOKENS_FILE = 'reset_tokens.csv'

# HTTPS重定向装饰器
def require_https(f):
    """强制使用HTTPS的装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否使用HTTPS
        if not request.is_secure and not request.headers.get('X-Forwarded-Proto') == 'https':
            # 如果启用了SSL且不在调试模式下，重定向到HTTPS
            if not app.debug and 'ssl_enabled' in globals() and ssl_enabled:
                return redirect(request.url.replace('http://', 'https://', 1))
        return f(*args, **kwargs)
    return decorated_function

# 安全头配置
@app.after_request
def add_security_headers(response):
    """添加安全头"""
    # 检查是否使用HTTPS连接
    is_https = request.is_secure or request.headers.get('X-Forwarded-Proto') == 'https'
    
    if is_https:
        # 仅在HTTPS连接时添加HTTPS专用安全头
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
      # 通用安全头（HTTP和HTTPS都适用）
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # 修改CSP以允许连接到聊天API
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "connect-src 'self' https://dreamstarry.top:5001 http://dreamstarry.top:5000 "
        "https://localhost:5001 http://localhost:5000 "
        "https://YOUR_SERVICE_IP:5001 http://YOUR_SERVICE_IP:5000; "
        "img-src 'self' data:; "
        "font-src 'self'"
    )
    response.headers['Content-Security-Policy'] = csp_policy
    
    return response

# 初始化CSV文件
def init_csv_files():
    """初始化用户数据和密码重置令牌CSV文件"""
    # 初始化用户数据文件
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['username', 'email', 'password_hash', 'created_at', 'last_login'])
    
    # 初始化密码重置令牌文件
    if not os.path.exists(RESET_TOKENS_FILE):
        with open(RESET_TOKENS_FILE, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['email', 'token', 'expires_at'])

def hash_password(password):
    """使用SHA-256哈希密码"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def validate_input(text, input_type='username'):
    """验证输入以防止基本注入攻击"""
    if not text or len(text.strip()) == 0:
        return False, "输入不能为空"
    
    # 移除潜在的危险字符
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        if char in text:
            return False, f"输入包含非法字符: {char}"
    
    if input_type == 'username':
        if len(text) < 3 or len(text) > 20:
            return False, "用户名长度必须在3-20个字符之间"
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', text):
            return False, "用户名只能包含字母、数字、下划线和中文"
    
    elif input_type == 'email':
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', text):
            return False, "邮箱格式不正确"
    
    elif input_type == 'password':
        if len(text) < 6 or len(text) > 50:
            return False, "密码长度必须在6-50个字符之间"
    
    return True, "验证通过"

def read_users():
    """读取用户数据"""
    users = []
    try:
        with open(CSV_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                users.append(row)
    except FileNotFoundError:
        init_csv_files()
    return users

def write_user(username, email, password_hash):
    """写入新用户数据"""
    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([username, email, password_hash, datetime.now().isoformat(), ''])

def update_last_login(username):
    """更新用户最后登录时间"""
    users = read_users()
    for user in users:
        if user['username'] == username:
            user['last_login'] = datetime.now().isoformat()
    
    # 重写整个文件
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['username', 'email', 'password_hash', 'created_at', 'last_login'])
        writer.writeheader()
        writer.writerows(users)

def update_user_password(email, new_password_hash):
    """更新用户密码"""
    users = read_users()
    for user in users:
        if user['email'] == email:
            user['password_hash'] = new_password_hash
    
    # 重写整个文件
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['username', 'email', 'password_hash', 'created_at', 'last_login'])
        writer.writeheader()
        writer.writerows(users)

def generate_reset_token():
    """生成密码重置令牌"""
    return secrets.token_urlsafe(32)

def save_reset_token(email, token):
    """保存密码重置令牌"""
    expires_at = (datetime.now() + timedelta(hours=1)).isoformat()  # 1小时过期
    with open(RESET_TOKENS_FILE, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([email, token, expires_at])

def verify_reset_token(token):
    """验证密码重置令牌"""
    try:
        with open(RESET_TOKENS_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['token'] == token:
                    expires_at = datetime.fromisoformat(row['expires_at'])
                    if datetime.now() < expires_at:
                        return row['email']
                    else:
                        return None  # 令牌已过期
    except FileNotFoundError:
        pass
    return None

def cleanup_expired_tokens():
    """清理过期的重置令牌"""
    try:
        valid_tokens = []
        with open(RESET_TOKENS_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                expires_at = datetime.fromisoformat(row['expires_at'])
                if datetime.now() < expires_at:
                    valid_tokens.append(row)
        
        # 重写文件，只保留有效令牌
        with open(RESET_TOKENS_FILE, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=['email', 'token', 'expires_at'])
            writer.writeheader()
            writer.writerows(valid_tokens)
    except FileNotFoundError:
        pass

# 主页路由（端口80）
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# 登录API
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        # 验证输入
        valid_username, username_msg = validate_input(username, 'username')
        if not valid_username:
            return jsonify({'success': False, 'message': username_msg}), 400
        
        valid_password, password_msg = validate_input(password, 'password')
        if not valid_password:
            return jsonify({'success': False, 'message': password_msg}), 400
        
        # 检查用户凭据
        users = read_users()
        password_hash = hash_password(password)
        
        for user in users:
            if user['username'] == username and user['password_hash'] == password_hash:
                session['username'] = username
                session['logged_in'] = True
                update_last_login(username)
                return jsonify({
                    'success': True, 
                    'message': '登录成功',
                    'user': {'username': username, 'email': user['email']}
                })
        
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

# 注册API
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        # 验证输入
        valid_username, username_msg = validate_input(username, 'username')
        if not valid_username:
            return jsonify({'success': False, 'message': username_msg}), 400
        
        valid_email, email_msg = validate_input(email, 'email')
        if not valid_email:
            return jsonify({'success': False, 'message': email_msg}), 400
        
        valid_password, password_msg = validate_input(password, 'password')
        if not valid_password:
            return jsonify({'success': False, 'message': password_msg}), 400
        
        # 检查用户是否已存在
        users = read_users()
        for user in users:
            if user['username'] == username:
                return jsonify({'success': False, 'message': '用户名已存在'}), 409
            if user['email'] == email:
                return jsonify({'success': False, 'message': '邮箱已被注册'}), 409
        
        # 创建新用户
        password_hash = hash_password(password)
        write_user(username, email, password_hash)
        
        return jsonify({'success': True, 'message': '注册成功'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

# 忘记密码API
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        email = data.get('email', '').strip()
        
        # 验证邮箱格式
        valid_email, email_msg = validate_input(email, 'email')
        if not valid_email:
            return jsonify({'success': False, 'message': email_msg}), 400
        
        # 检查邮箱是否存在
        users = read_users()
        user_found = False
        for user in users:
            if user['email'] == email:
                user_found = True
                break
        
        if not user_found:
            return jsonify({'success': False, 'message': '邮箱不存在'}), 404
        
        # 生成重置令牌
        token = generate_reset_token()
        save_reset_token(email, token)
        
        # 在实际应用中，这里应该发送邮件
        # 现在只返回令牌用于测试
        return jsonify({
            'success': True, 
            'message': '密码重置链接已发送到您的邮箱',
            'reset_token': token  # 仅用于测试，生产环境不应返回
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

# 重置密码API
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '').strip()
        
        # 验证新密码
        valid_password, password_msg = validate_input(new_password, 'password')
        if not valid_password:
            return jsonify({'success': False, 'message': password_msg}), 400
        
        # 验证令牌
        email = verify_reset_token(token)
        if not email:
            return jsonify({'success': False, 'message': '无效或已过期的重置令牌'}), 400
        
        # 更新密码
        new_password_hash = hash_password(new_password)
        update_user_password(email, new_password_hash)
        
        # 清理过期令牌
        cleanup_expired_tokens()
        
        return jsonify({'success': True, 'message': '密码重置成功'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

# 登出API
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '登出成功'})

# 获取用户信息API
@app.route('/api/user', methods=['GET'])
def get_user():
    if 'logged_in' in session and session['logged_in']:
        return jsonify({
            'success': True,
            'user': {'username': session['username']}
        })
    return jsonify({'success': False, 'message': '未登录'}), 401

# AI API代理端点
@app.route('/api/ai-proxy', methods=['POST'])
def ai_proxy():
    """AI API代理，解决前端CORS问题"""
    import requests
    
    try:
        # 获取前端发送的请求数据
        request_data = request.get_json()
        
        # AI API配置
        ai_api_url = "https://llmapi.paratera.com/v1/chat/completions"
        ai_api_key = os.environ.get("AI_API_KEY", "")
        
        # 构建请求头
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {ai_api_key}'
        }
        
        # 发送请求到AI API
        ai_response = requests.post(
            ai_api_url,
            headers=headers,
            json=request_data,
            timeout=30
        )
        
        # 返回AI API的响应
        if ai_response.status_code == 200:
            return jsonify(ai_response.json())
        else:
            return jsonify({
                'error': {
                    'message': f'AI API请求失败: {ai_response.status_code}',
                    'details': ai_response.text
                }
            }), ai_response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'error': {
                'message': 'AI API请求超时',
                'details': '请求超过30秒未响应'
            }
        }), 408
    except requests.exceptions.ConnectionError:
        return jsonify({
            'error': {
                'message': 'AI API连接失败',
                'details': '无法连接到AI服务器'
            }
        }), 503
    except Exception as e:
        return jsonify({
            'error': {
                'message': 'AI API代理错误',
                'details': str(e)
            }
        }), 500

# 初始化应用
def init_app():
    """初始化应用"""
    init_csv_files()
    
    # 启动定期清理过期令牌的任务
    def cleanup_task():
        while True:
            time.sleep(3600)  # 每小时清理一次
            cleanup_expired_tokens()
    
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()

if __name__ == '__main__':
    init_app()
    
    # SSL证书配置 - 使用dreamstarry.top域名证书
    SSL_CERT_PATH = 'dreamstarry.top.pem'        # SSL证书文件路径
    SSL_KEY_PATH = 'dreamstarry.top.key'         # SSL私钥文件路径
    SSL_CHAIN_PATH = 'dreamstarry.top_chain.pem' # SSL证书链文件路径
    
    # 检查SSL证书文件是否存在
    ssl_enabled = (os.path.exists(SSL_CERT_PATH) and 
                   os.path.exists(SSL_KEY_PATH) and 
                   os.path.exists(SSL_CHAIN_PATH))
    
    if ssl_enabled:
        print("✅ 检测到dreamstarry.top SSL证书文件，启用HTTPS...")
        # 创建包含证书链的完整证书文件
        combined_cert_path = 'dreamstarry.top_combined.pem'
        try:
            with open(combined_cert_path, 'w', encoding='utf-8') as combined_file:
                # 写入主证书
                with open(SSL_CERT_PATH, 'r', encoding='utf-8') as cert_file:
                    combined_file.write(cert_file.read())
                # 写入证书链
                with open(SSL_CHAIN_PATH, 'r', encoding='utf-8') as chain_file:
                    combined_file.write(chain_file.read())
            ssl_context = (combined_cert_path, SSL_KEY_PATH)
            print("✅ SSL证书链已合并完成")
        except Exception as e:
            print(f"❌ SSL证书合并失败: {e}")
            ssl_context = (SSL_CERT_PATH, SSL_KEY_PATH)  # 降级使用单个证书
    else:
        print("⚠️  未找到dreamstarry.top SSL证书文件，使用HTTP模式...")
        ssl_context = None
    
    def run_auth_server():
        """运行认证服务器"""
        auth_app = Flask(__name__)
        auth_app.secret_key = app.secret_key
        CORS(auth_app)
        
        # 复制所有API路由到认证服务器
        auth_app.add_url_rule('/api/login', 'login', login, methods=['POST'])
        auth_app.add_url_rule('/api/register', 'register', register, methods=['POST'])
        auth_app.add_url_rule('/api/forgot-password', 'forgot_password', forgot_password, methods=['POST'])
        auth_app.add_url_rule('/api/reset-password', 'reset_password', reset_password, methods=['POST'])
        auth_app.add_url_rule('/api/logout', 'logout', logout, methods=['POST'])
        auth_app.add_url_rule('/api/user', 'get_user', get_user, methods=['GET'])
        
        # 为认证服务器提供登录页面
        @auth_app.route('/')
        def login_page():
            return send_from_directory('.', 'login.html')
        
        @auth_app.route('/<path:filename>')
        def serve_auth_static(filename):
            return send_from_directory('.', filename)
            # 认证服务器端口配置
        if ssl_enabled:
            print("🔐 认证服务器启动: https://dreamstarry.top:2001")
            auth_app.run(host='0.0.0.0', port=2001, debug=True, ssl_context=ssl_context)
        else:
            print("🔐 认证服务器启动: http://dreamstarry.top:2000")
            auth_app.run(host='0.0.0.0', port=2000, debug=True)
      # 启动信息
    if ssl_enabled:
        print("🚀 启动星梦服务器官网 (HTTPS模式)...")
        print("🌐 主页服务器: https://dreamstarry.top")
        print("🔐 认证服务器: https://dreamstarry.top:2001")
        print("📋 本地访问: https://localhost:443")
    else:
        print("🚀 启动星梦服务器官网 (HTTP模式)...")
        print("🌐 主页服务器: http://dreamstarry.top")
        print("🔐 认证服务器: http://dreamstarry.top:2000")
        print("📋 本地访问: http://localhost:80")
    
    # 启动主服务器
    try:
        if ssl_enabled:
            # HTTPS模式 - 端口443
            try:
                app.run(host='0.0.0.0', port=443, debug=True, ssl_context=ssl_context)
            except PermissionError:
                print("⚠️  无法绑定到端口443，需要管理员权限。正在使用端口8443...")
                app.run(host='0.0.0.0', port=8443, debug=True, ssl_context=ssl_context)
        else:
            # HTTP模式 - 端口80
            try:
                app.run(host='0.0.0.0', port=80, debug=True)
            except PermissionError:
                print("⚠️  无法绑定到端口80，需要管理员权限。正在使用端口8080...")
                app.run(host='0.0.0.0', port=8080, debug=True)
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")
        print("请检查SSL证书文件是否正确或端口是否被占用")
