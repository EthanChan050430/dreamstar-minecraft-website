# import websockets
# import requests
import json
import time
# import asyncio
# import base64
import threading
import datetime
import socket
from socket import gaierror
from dataclasses import dataclass
from typing import Any
from collections.abc import Callable
from websockets.exceptions import ConnectionClosed
from websockets.legacy.client import WebSocketClientProtocol
from tooldelta import Frame, Plugin, cfg, fmts, utils, Chat, plugin_entry, InternalBroadcast


# CUSTOMIZE CLASSES AND FUNCS 自定义的类和方法
@dataclass
class Data:
    # 数据类，可以是发往服务端的信息或者服务端返回的信息
    type: str
    content: dict

    def marshal(self) -> str:
        return json.dumps({"Type": self.type, "Content": self.content})


def format_data(type: str, content: dict):
    return Data(type, content)


def new_result_getter():
    lock = threading.Lock()
    lock.acquire()
    resp: list[None | Data] = [None]

    def setter(result: Data):
        resp[0] = result
        lock.release()

    def getter(timeout: float = -1):
        lock.acquire(timeout=timeout)
        return resp[0]

    return setter, getter


# 数据转发器 - 将消息转发到本地Web服务器
class MessageForwarder:
    def __init__(self, host="127.0.0.1", port=9876):
        self.host = host
        self.port = port
        self.sock = None
        self.connected = False
        self.lock = threading.Lock()
        self.connect()

    def connect(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.connected = True
            fmts.print_suc(f"已连接到Web服务器({self.host}:{self.port})")
        except Exception as e:
            fmts.print_err(f"连接Web服务器失败: {e}")
            self.connected = False

    def forward_message(self, server_name, player_name, message, msg_type="incoming", retry=True):
        if not self.connected and retry:
            self.connect()
            if self.connected:
                return self.forward_message(server_name, player_name, message, msg_type, False)
            return False

        try:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            data = {
                "server": server_name,
                "player": player_name,
                "message": message,
                "type": msg_type,
                "timestamp": timestamp
            }

            with self.lock:
                self.sock.sendto(json.dumps(data).encode("utf-8"), (self.host, self.port))
            return True
        except Exception as e:
            fmts.print_err(f"消息转发失败: {e}")
            self.connected = False
            return False


# PROTOCOL CLASSES 服服互通协议类
class BasicProtocol:
    # 所有服服互通协议的基类
    def __init__(self, frame: Frame, ws_ip: str, cfgs: dict):
        self.frame = frame
        self.ws_ip = ws_ip
        self.cfgs = cfgs
        self.active = False
        self.listen_cbs = {}

    def start(self):
        # 开始连接
        raise NotImplementedError

    def send(self, data: Any):
        # 发送数据
        raise NotImplementedError

    def send_and_wait_req(self, data: Any) -> Any:
        # 向服务端请求数据
        raise NotImplementedError

    def listen_for_data(self, data_type: str, cb: Callable[[Any], None]):
        raise NotImplementedError


class SuperLinkProtocol(BasicProtocol):
    def __init__(self, frame: Frame, ws_ip: str, cfgs: dict):
        super().__init__(frame, ws_ip, cfgs)
        self.retryTime = 30
        self.retryCount = 0
        self.req_resps: dict[str, Callable[[Data], None]] = {}
        self.listen_cbs: dict[str, Callable[[Data], None]] = {}
        self.active = True  # 直接设置为活跃状态，不再需要连接

    @utils.thread_func("服服互通本地处理线程")
    def start(self):
        # 不再尝试连接中心服务器，只需打印信息
        fmts.print_suc("服服互通: 本地模式启动成功，只转发消息到外部服务器")
        # 无限循环保持线程活跃
        while 1:
            time.sleep(600)  # 每10分钟检查一次

    def find_default_ips(self):
        # 此方法不再需要，但保留以兼容调用
        return "本地模式", "none"

    async def start_ws_con(self):
        # 此方法不再需要，但保留以兼容可能的调用
        pass

    async def handle(self, recv_data: dict):
        # 此方法不再需要，但保留以兼容可能的调用
        pass

    async def send(self, data: Data):
        # 转换为仅打印，不再实际发送
        fmts.print_inf(f"本地模式: 模拟发送消息 {data.type}")
        return True

    @staticmethod
    def format_data(type: str, content: dict):
        return format_data(type, content)

    async def send_and_wait_req(self, data: Data, timeout=-1):
        # 简化实现，直接返回成功
        fmts.print_inf(f"本地模式: 模拟请求 {data.type}")
        return None

    def listen_for_data(self, data_type: str, cb: Callable[[Any], None]):
        self.listen_cbs[data_type] = cb


# PLUGIN MAIN
class SuperLink(Plugin):
    name = "服服互通v4"
    author = "SuperScript"
    version = (0, 0, 9)

    def __init__(self, frame: Frame):
        super().__init__(frame)
        self.read_cfgs()
        self.init_funcs()
        self.ListenActive(self.on_inject)
        self.ListenChat(self.on_player_message)

        # 初始化消息转发器
        if self.enable_forward:
            self.forwarder = MessageForwarder(
                host=self.forward_host,
                port=self.forward_port
            )
            fmts.print_suc(f"服服互通: 消息转发功能已启用，转发至 {self.forward_host}:{self.forward_port}")
        else:
            self.forwarder = None
            fmts.print_inf("服服互通: 消息转发功能已禁用")

    def read_cfgs(self):
        CFG_DEFAULT = {
            "中心服务器IP": "none",  # 不再使用中心服务器
            "服服互通协议": "SuperLink-v4@SuperScript",
            "协议附加配置": {
                "此租赁服的公开显示名": "我的服务器",  # 修改为更有意义的名称
                "登入后自动连接到的频道大区名": "公共大区",
                "频道密码": "",
            },
            "基本互通配置": {
                "是否转发玩家发言": True,
                "转发聊天到本服格式": "<[服名]:[玩家名]> [消息]",
                "屏蔽以下前缀的信息上报": [".", "omg", "!"],
            },
            "消息转发配置": {
                "启用消息转发": True,
                "转发服务器地址": "YOUR_SERVICE_IP",  # 您的外部服务器地址
                "转发服务器端口": 9876,  # UDP端口，Flask通常5000，这里是UDP转发端口
            },
        }
        CFG_STD = {
            "中心服务器IP": str,
            "服服互通协议": str,
            "协议附加配置": {
                "此租赁服的公开显示名": str,
                "登入后自动连接到的频道大区名": str,
                "频道密码": str,
            },
            "基本互通配置": {
                "是否转发玩家发言": bool,
                "转发聊天到本服格式": str,
                "屏蔽以下前缀的信息上报": cfg.JsonList(str),
            },
            "消息转发配置": {
                "启用消息转发": bool,
                "转发服务器地址": str,
                "转发服务器端口": int,
            },
        }
        self.cfg, _ = cfg.get_plugin_config_and_version(
            self.name, CFG_STD, CFG_DEFAULT, self.version
        )
        use_protocol: type[BasicProtocol] | None = {
            "SuperLink-v4@SuperScript": SuperLinkProtocol
        }.get(self.cfg["服服互通协议"])
        if use_protocol is None:
            fmts.print_err(f"协议不受支持: {self.cfg['服服互通协议']}")
            raise SystemExit
        self.active_protocol = use_protocol(
            self.frame, self.cfg["中心服务器IP"], self.cfg["协议附加配置"]
        )
        basic_link_cfg = self.cfg["基本互通配置"]
        self.enable_trans_chat = basic_link_cfg["是否转发玩家发言"]
        self.trans_fmt = basic_link_cfg["转发聊天到本服格式"]

        # 初始化转发配置
        forward_cfg = self.cfg.get("消息转发配置", {})
        self.enable_forward = forward_cfg.get("启用消息转发", True)
        self.forward_host = forward_cfg.get("转发服务器地址", "YOUR_SERVICE_IP") # 确保默认使用您的外部服务器
        self.forward_port = forward_cfg.get("转发服务器端口", 9876)

    def init_funcs(self):
        # --------------- API -------------------
        self.send = self.active_protocol.send
        self.send_and_wait_req = self.active_protocol.send_and_wait_req
        self.listen_for_data = self.active_protocol.listen_for_data
        self.ListenInternalBroadcast("superlink.event", self.listen_chat)
        # ---------------------------------------

    def active(self):
        self.active_protocol.start()

    def on_inject(self):
        fmts.print_inf("正在启动消息转发模式...")
        self.active()

    @utils.thread_func("服服互通上报消息")
    def on_player_message(self, chat: Chat):
        player = chat.player.name
        msg = chat.msg

        if not self.check_send(msg):
            return

        # 转发本服玩家消息到服务器
        if self.enable_forward and self.forwarder:
            server_name = self.cfg["协议附加配置"]["此租赁服的公开显示名"]
            self.forwarder.forward_message(server_name, player, msg, "outgoing")
            fmts.print_inf(f"转发玩家消息: {player} -> {msg}")

    def check_send(self, msg: str):
        for prefix in self.cfg["基本互通配置"]["屏蔽以下前缀的信息上报"]:
            if msg.startswith(prefix):
                return False
        return True

    def listen_chat(self, dt: InternalBroadcast):
        data: Data = dt.data
        if data.type == "chat.msg" and self.enable_trans_chat:
            # 转发接收到的消息到本地服务器
            if self.enable_forward and self.forwarder:
                server_name = data.content.get("Sender", "未知服务器")
                player_name = data.content.get("ChatName", "未知玩家")
                message = data.content.get("Msg", "")
                self.forwarder.forward_message(server_name, player_name, message, "incoming")

            # 在游戏内显示消息
            self.game_ctrl.say_to(
                "@a",
                utils.simple_fmt(
                    {
                        "[服名]": data.content["Sender"],
                        "[玩家名]": data.content["ChatName"],
                        "[消息]": data.content["Msg"],
                    },
                    self.cfg["基本互通配置"]["转发聊天到本服格式"],
                ),
            )
        return True


entry = plugin_entry(SuperLink, "服服互通")
