#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
星梦服务器聊天消息接收服务器
用于接收来自Minecraft服务器插件的UDP消息并提供HTTP API
基于fsdownload中成功的聊天监控系统架构
"""

import json
import socket
import threading
import time
from datetime import datetime
from collections import defaultdict, deque
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # 支持中文JSON输出
CORS(app)  # 允许跨域请求

# 消息存储类 - 基于fsdownload中的成功实现
class MessageStore:
    def __init__(self, max_messages=200):
        self.messages = defaultdict(lambda: deque(maxlen=100))  # 按服务器分类存储
        self.last_activity = {}
        self.max_messages = max_messages
        self.lock = threading.Lock()
    
    def add_message(self, server_name, player, message, msg_type='incoming'):
        """添加新消息"""
        # 使用服务器名称映射
        original_name = server_name
        mapped_name = SERVER_NAME_MAPPING.get(server_name, server_name)
        
        print(f"💬 添加消息: [{original_name}] -> [{mapped_name}] {player}: {message}")
        
        message_data = {
            'id': int(time.time() * 1000000),  # 微秒时间戳作为ID
            'server': mapped_name,  # 使用映射后的名称
            'player': player,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'type': msg_type,
            'from_ip': getattr(self, '_current_ip', 'unknown')
        }
        
        with self.lock:
            # 添加到对应服务器的消息队列
            self.messages[mapped_name].append(message_data)
            self.last_activity[mapped_name] = datetime.now()
        
        print(f"📊 当前 {mapped_name} 消息数量: {len(self.messages[mapped_name])}")
        
        return message_data
    
    def get_messages(self, limit=50, server_name=None):
        """获取消息"""
        with self.lock:
            if server_name:
                # 返回特定服务器的消息
                messages = list(self.messages.get(server_name, []))
                return messages[-limit:] if limit and len(messages) > limit else messages
            else:
                # 返回所有服务器的消息
                all_messages = []
                for server_messages in self.messages.values():
                    all_messages.extend(list(server_messages))
                
                # 按时间戳排序
                all_messages.sort(key=lambda x: x['timestamp'])
                return all_messages[-limit:] if limit and len(all_messages) > limit else all_messages
    
    def get_servers(self):
        """获取服务器信息"""
        with self.lock:
            servers = {}
            for server_name, messages in self.messages.items():
                servers[server_name] = {
                    'message_count': len(messages),
                    'last_activity': self.last_activity.get(server_name, '无').isoformat() if isinstance(self.last_activity.get(server_name), datetime) else '无'
                }
            return servers

# 服务器名称映射 - 将插件发送的名称映射为前端期望的名称
SERVER_NAME_MAPPING = {
    "星梦1服": "星梦生存服",
    "星梦2服": "星梦空岛服", 
    "星梦3服": "星梦32K服",
    "我的服务器": "星梦生存服",  # 插件默认名称
    # 前端使用的简短名称也支持
    "生存服": "星梦生存服",
    "空岛服": "星梦空岛服",
    "32K服": "星梦32K服",
    # 反向映射 - 支持前端查询
    "星梦生存服": "星梦生存服",
    "星梦空岛服": "星梦空岛服",
    "星梦32K服": "星梦32K服"
}

# 创建全局消息存储
message_store = MessageStore(max_messages=200)

# 服务器状态配置 - 与官网服务器名称对应
server_status = {
    "星梦生存服": {"online": True, "players": "15/50", "ping": "28ms", "version": "1.19.2"},
    "星梦空岛服": {"online": True, "players": "23/50", "ping": "32ms", "version": "1.19.2"}, 
    "星梦32K服": {"online": True, "players": "8/30", "ping": "25ms", "version": "1.19.2"}
}

# UDP服务器类 - 参考fsdownload中的实现
class UDPServer:
    def __init__(self, message_store, host='0.0.0.0', port=9876):
        self.host = host
        self.port = port
        self.message_store = message_store
        self.sock = None
        self.running = False
        self.thread = None
    
    def start(self):
        """启动UDP服务器"""
        if self.running:
            return
        
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
    
    def _run(self):
        """UDP服务器主循环"""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.sock.bind((self.host, self.port))
            self.running = True
            
            print(f"📡 UDP服务器启动成功，监听地址: {self.host}:{self.port}")
            
            while self.running:
                try:
                    self.sock.settimeout(1.0)  # 设置超时以便能够检查running状态
                    data, addr = self.sock.recvfrom(4096)
                    
                    try:
                        message_data = json.loads(data.decode('utf-8'))
                        server_name = message_data.get('server', '未知服务器')
                        player_name = message_data.get('player', '未知玩家')
                        message = message_data.get('message', '')
                        msg_type = message_data.get('type', 'incoming')
                        
                        # 设置当前IP（用于记录）
                        self.message_store._current_ip = addr[0]
                        
                        # 添加消息到存储
                        self.message_store.add_message(
                            server_name, player_name, message, msg_type
                        )
                        
                    except json.JSONDecodeError:
                        print(f"❌ 接收到无效的JSON数据: {data}")
                    except Exception as e:
                        print(f"❌ 处理消息时出错: {e}")
                
                except socket.timeout:
                    continue
                except Exception as e:
                    if self.running:
                        print(f"❌ 接收消息时出错: {e}")
                    break
            
        except Exception as e:
            print(f"❌ 启动UDP服务器失败: {e}")
        finally:
            if self.sock:
                self.sock.close()
            print("📡 UDP服务器已停止")
    
    def stop(self):
        """停止UDP服务器"""
        self.running = False
        if self.sock:
            self.sock.close()

# 创建UDP服务器实例
udp_server = UDPServer(message_store)

# Flask API路由
@app.route('/api/messages')
def get_messages():
    """获取所有消息"""
    try:
        limit = request.args.get('limit', default=50, type=int)
        server_filter = request.args.get('server', default=None)
        
        print(f"🔍 API调用: /api/messages, limit={limit}, server_filter={server_filter}")
        
        messages = message_store.get_messages(limit=limit, server_name=server_filter)
        
        print(f"📜 返回消息数量: {len(messages)}")
        if messages:
            print(f"📝 示例消息: {messages[0]}")
        
        return jsonify({
            'success': True,
            'messages': messages,
            'count': len(messages)
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat/<server_name>')
def get_chat_messages(server_name):
    """获取指定服务器的聊天消息 - 兼容旧版API"""
    try:
        print(f"🔍 API调用: /api/chat/{server_name}")
        
        messages = message_store.get_messages(server_name=server_name)
        
        print(f"📜 返回 {server_name} 消息数量: {len(messages)}")
        
        return jsonify({
            'success': True,
            'server': server_name,
            'messages': messages,
            'count': len(messages)
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/servers')
def get_all_servers():
    """获取所有服务器信息"""
    try:
        print(f"🔍 API调用: /api/servers")
        
        servers = message_store.get_servers()
        
        print(f"📜 返回服务器数量: {len(servers)}")
        print(f"📝 服务器列表: {list(servers.keys())}")
        
        return jsonify({
            'success': True,
            'servers': servers
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats')
def get_stats():
    """获取统计信息 - 兼容fsdownload格式"""
    try:
        messages = message_store.get_messages()
        incoming = len([m for m in messages if m['type'] == 'incoming'])
        outgoing = len([m for m in messages if m['type'] == 'outgoing'])
        servers = set(m['server'] for m in messages)
        
        return jsonify({
            'total': len(messages),
            'incoming': incoming,
            'outgoing': outgoing,
            'servers': list(servers)
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/status/<server_name>')
def get_server_status(server_name):
    """获取服务器状态信息"""
    try:
        print(f"🔍 API调用: /api/status/{server_name}")
        
        status = server_status.get(server_name, {
            "online": False, 
            "players": "0/0", 
            "ping": "超时", 
            "version": "未知"
        })
        
        return jsonify({
            'success': True,
            'server': server_name,
            'status': status
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test', methods=['POST'])
def test_message():
    """测试API - 手动添加消息"""
    try:
        data = request.json
        server_name = data.get('server', '测试服')
        player_name = data.get('player', '测试玩家')
        message = data.get('message', '这是一条测试消息')
        msg_type = data.get('type', 'test')
        
        print(f"🧪 接收测试请求: [{server_name}] {player_name}: {message}")
        
        # 添加测试消息
        msg_data = message_store.add_message(
            server_name, player_name, message, msg_type
        )
        
        return jsonify({
            'success': True,
            'message': '测试消息已添加',
            'data': msg_data
        })
    except Exception as e:
        print(f"❌ API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# 主函数
def main():
    import os
    import ssl
    
    # 启动UDP服务器
    udp_server.start()
    
    # 检查SSL证书文件
    ssl_cert = 'dreamstarry.top.pem'
    ssl_key = 'dreamstarry.top.key'
    ssl_enabled = os.path.exists(ssl_cert) and os.path.exists(ssl_key)
    
    try:
        print(f"🌐 Flask聊天服务器启动中...")
        
        if ssl_enabled:
            print(f"🔒 HTTPS API: https://dreamstarry.top:5001")
            print(f"🔒 本地HTTPS: https://localhost:5001")
            print(f"📡 UDP监听: {udp_server.host}:{udp_server.port}")
            print(f"🎮 等待服务器插件连接...")
            print(f"✅ SSL证书已加载，启用HTTPS模式")
            
            # 创建SSL上下文
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(ssl_cert, ssl_key)
            
            # 启动HTTPS Flask应用
            app.run(host='0.0.0.0', port=5001, debug=False, threaded=True, ssl_context=context)
        else:
            print(f"⚠️  未找到SSL证书，使用HTTP模式")
            print(f"🎯 HTTP API: http://localhost:5000")
            print(f"🌐 公网HTTP: http://38.165.23.56:5000")  
            print(f"📡 UDP监听: {udp_server.host}:{udp_server.port}")
            print(f"🎮 等待服务器插件连接...")
            
            # 启动HTTP Flask应用
            app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
            
    except KeyboardInterrupt:
        print("\n🛑 程序被用户中断")
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")
        if ssl_enabled:
            print("💡 如果是SSL错误，请检查证书文件是否正确")
    finally:
        udp_server.stop()
        print("👋 聊天服务器已关闭")

if __name__ == "__main__":
    main()
