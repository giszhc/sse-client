/**
 * SSE Client 使用示例 - 前端入口文件
 */

import { SSEClient, SSEClientConfig } from '../src/index';

let client: SSEClient | null = null;

// 创建 SSE 客户端实例
function createClient(url: string): SSEClient {
    const config: SSEClientConfig = {
        url: url,
        namespace: 'chat', // 命名空间，用于消息隔离
        
        // 自动重连配置
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectInterval: 2000,
        
        // 回调函数
        onConnect: () => {
            console.log('✅ 已连接到 SSE 服务器');
            updateConnectionStatus('connected');
            updateConnectButton(true);
        },
        
        onDisconnect: () => {
            console.log('❌ 与 SSE 服务器断开连接');
            updateConnectionStatus('disconnected');
            updateConnectButton(false);
        },
        
        onError: (error) => {
            console.error('⚠️ SSE 连接错误:', error);
            updateConnectionStatus('error');
        }
    };
    
    return new SSEClient(config);
}

// 更新连接状态
function updateConnectionStatus(status: string) {
    const statusElement = document.getElementById('status');
    const statusText = {
        'connected': '🟢 已连接',
        'disconnected': '🔴 已断开',
        'connecting': '🟡 连接中...',
        'error': '⚠️ 错误'
    };
    
    if (statusElement) {
        statusElement.textContent = statusText[status as keyof typeof statusText] || '未知状态';
        statusElement.className = `status ${status}`;
    }
}

// 更新连接按钮状态
function updateConnectButton(connected: boolean) {
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.textContent = connected ? '✅ 已连接' : '🔌 连接';
        (connectBtn as HTMLButtonElement).disabled = connected;
    }
}

// 订阅不同类型的消息
function subscribeMessages(clientInstance: SSEClient) {
    clientInstance.on('message', (payload, rawEvent) => {
        console.log('📨 收到消息:', payload);
        addMessageToUI('message', payload);
    });

    clientInstance.on('notification', (payload) => {
        console.log('🔔 收到通知:', payload);
        addMessageToUI('notification', payload);
    });

    clientInstance.on('system', (payload) => {
        console.log('⚙️ 收到系统消息:', payload);
        addMessageToUI('system', payload);
    });
}

function addMessageToUI(type: string, payload: any) {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const time = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <span class="time">[${time}]</span>
        <span class="type">${type.toUpperCase()}</span>: 
        <span class="content">${JSON.stringify(payload)}</span>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 控制按钮功能
document.addEventListener('DOMContentLoaded', () => {
    const serverUrlInput = document.getElementById('serverUrl') as HTMLInputElement;
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const reconnectBtn = document.getElementById('reconnectBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // 连接按钮点击事件
    connectBtn?.addEventListener('click', () => {
        const url = serverUrlInput?.value.trim() || 'http://localhost:3001/sse';
        
        console.log('开始连接到:', url);
        
        // 如果已有连接，先断开
        if (client) {
            client.destroy();
        }
        
        // 创建新客户端
        updateConnectionStatus('connecting');
        client = createClient(url);
        subscribeMessages(client);
    });
    
    // 断开按钮点击事件
    disconnectBtn?.addEventListener('click', () => {
        console.log('手动断开连接');
        if (client) {
            client.disconnect();
        }
    });
    
    // 重新连接按钮点击事件
    reconnectBtn?.addEventListener('click', () => {
        console.log('重新连接...');
        const url = serverUrlInput?.value.trim() || 'http://localhost:3001/sse';
        
        if (client) {
            client.destroy();
        }
        
        updateConnectionStatus('connecting');
        client = createClient(url);
        subscribeMessages(client);
    });
    
    // 清空按钮点击事件
    clearBtn?.addEventListener('click', () => {
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            messagesDiv.innerHTML = '';
        }
    });
    
    // 初始状态
    updateConnectionStatus('disconnected');
    updateConnectButton(false);
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (client) {
        client.destroy();
    }
});

// 导出客户端供调试使用
(window as any).sseClient = () => client;
