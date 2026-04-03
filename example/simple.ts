/**
 * SSE Client 简单示例 - 独立页面脚本
 */

import { SSEClient } from '../src/index';

let client: SSEClient | null = null;

// 连接函数
(window as any).connect = function() {
    const urlInput = document.getElementById('serverUrl') as HTMLInputElement;
    const url = urlInput.value.trim() || 'http://localhost:3001/sse';
    
    console.log('开始连接到:', url);
    
    // 如果已有连接，先断开
    if (client) {
        client.destroy();
    }
    
    // 创建新客户端
    updateStatus('connecting', '🟡 连接中...');
    
    client = new SSEClient({
        url: url,
        namespace: 'chat',
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectInterval: 2000,
        onConnect: () => {
            console.log('✅ 已连接到 SSE 服务器');
            updateStatus('connected', '🟢 已连接');
        },
        onDisconnect: () => {
            console.log('❌ 与 SSE 服务器断开连接');
            updateStatus('disconnected', '🔴 已断开');
        },
        onError: (error) => {
            console.error('⚠️ SSE 连接错误:', error);
            updateStatus('error', '⚠️ 错误');
        }
    });
    
    // 订阅消息
    client.on('message', (payload) => {
        console.log('📨 收到消息:', payload);
        addMessage('message', payload);
    });
    
    client.on('notification', (payload) => {
        console.log('🔔 收到通知:', payload);
        addMessage('notification', payload);
    });
    
    client.on('system', (payload) => {
        console.log('⚙️ 收到系统消息:', payload);
        addMessage('system', payload);
    });
};

function updateStatus(status: string, text: string) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.className = 'status ' + status;
        statusEl.textContent = text;
    }
}

function addMessage(type: string, payload: any) {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'message ' + type;
    
    const time = new Date().toLocaleTimeString();
    messageEl.innerHTML = `
        <strong>[${time}]</strong> 
        <em>${type.toUpperCase()}</em>: 
        ${JSON.stringify(payload)}
    `;
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

(window as any).disconnect = function() {
    if (client) {
        client.disconnect();
    }
};

(window as any).clearMessages = function() {
    const messagesEl = document.getElementById('messages');
    if (messagesEl) {
        messagesEl.innerHTML = '';
    }
};

// 页面加载时不自动连接，等待用户点击
updateStatus('disconnected', '🔴 已断开');

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (client) {
        client.destroy();
    }
});
