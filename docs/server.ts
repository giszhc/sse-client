/**
 * SSE Server 示例 - 后端服务
 * 
 * 这个简单的 Node.js 服务器用于模拟 SSE 服务器，发送测试消息
 */

import http from 'http';

const PORT = 3001;

// 消息计数器
let messageCount = 0;

// 消息类型
const messageTypes = ['message', 'notification', 'system'];

// 存储所有连接的客户端
const clients: Set<any> = new Set();

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // 处理 SSE 连接
    if (req.url === '/sse' && req.method === 'GET') {
        setupSSEConnection(req, res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function setupSSEConnection(req: http.IncomingMessage, res: http.ServerResponse) {
    console.log('🔌 新的 SSE 客户端连接');
    
    // 设置 SSE 响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // 将客户端添加到集合
    clients.add(res);
    
    // 发送初始连接消息
    sendSSEMessage(res, 'connected', {
        message: '欢迎连接到 SSE 服务器!',
        timestamp: new Date().toISOString()
    });
    
    // 监听客户端断开连接
    req.on('close', () => {
        console.log('🔌 客户端断开连接');
        clients.delete(res);
    });
    
    // 定期发送心跳
    const heartbeatInterval = setInterval(() => {
        if (!res.writableEnded) {
            res.write(': ping\n\n');
        } else {
            clearInterval(heartbeatInterval);
        }
    }, 15000);
}

function sendSSEMessage(res: http.ServerResponse, type: string, payload: any) {
    const message = {
        __socket_client__: true,
        namespace: 'chat',
        type: type,
        payload: payload
    };
    
    const data = JSON.stringify(message);
    res.write(`data: ${data}\n\n`);
}

// 每秒发送一条消息
setInterval(() => {
    if (clients.size > 0) {
        messageCount++;
        
        // 随机选择消息类型
        const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        
        // 创建不同类型的消息
        const messages = {
            message: {
                id: messageCount,
                text: `这是一条普通消息 #${messageCount}`,
                from: '用户' + Math.floor(Math.random() * 10)
            },
            notification: {
                title: '通知 #' + messageCount,
                content: '您有一条新的通知',
                priority: Math.random() > 0.5 ? 'high' : 'normal'
            },
            system: {
                event: '系统事件',
                description: `系统状态更新 #${messageCount}`,
                status: Math.random() > 0.5 ? 'success' : 'warning'
            }
        };
        
        // 向所有客户端发送消息
        clients.forEach(client => {
            if (!client.writableEnded) {
                sendSSEMessage(client, randomType, messages[randomType]);
            }
        });
        
        console.log(`📤 已发送消息 #${messageCount} (${randomType}) 到 ${clients.size} 个客户端`);
    }
}, 1000);

server.listen(PORT, () => {
    console.log(`🚀 SSE 服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 SSE 端点：http://localhost:${PORT}/sse`);
    console.log(`🌐 打开浏览器访问：http://localhost:5173/example/`);
});
