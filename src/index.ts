/**
 * SSEClient - Server-Sent Events 通信客户端
 *
 * 特性：
 * ✅ 自动重连（基于 EventSource + 手动兜底）
 * ✅ namespace 隔离
 * ✅ 事件订阅机制
 * ✅ 类型安全
 * ❌ 不支持双向通信（需配合 HTTP）
 */

export interface SSEMessage {
    __socket_client__: true;
    namespace: string;
    type: string;
    payload?: any;
}

export interface SSEClientConfig {
    /** SSE 地址 */
    url: string;

    /** 命名空间（必填） */
    namespace: string;

    /** 是否自动重连 */
    reconnect?: boolean;

    /** 最大重连次数 */
    maxReconnectAttempts?: number;

    /** 重连间隔（ms） */
    reconnectInterval?: number;

    /** 连接成功 */
    onConnect?: () => void;

    /** 断开连接 */
    onDisconnect?: () => void;

    /** 错误 */
    onError?: (error: Event) => void;
}

export type MessageHandler<T = any> = (payload: T, raw: MessageEvent) => void;

export class SSEClient {
    private es: EventSource | null = null;
    private config: Required<SSEClientConfig>;
    private messageHandlers = new Map<string, MessageHandler[]>();

    private connected = false;
    private reconnectAttempts = 0;
    private reconnectTimer?: number;

    constructor(config: SSEClientConfig) {
        if (!config.url) throw new Error('url is required');
        if (!config.namespace) throw new Error('namespace is required');

        this.config = {
            reconnect: true,
            maxReconnectAttempts: 5,
            reconnectInterval: 2000,
            onConnect: () => {},
            onDisconnect: () => {},
            onError: () => {},
            ...config
        };

        this.connect();
    }

    /**
     * 建立连接
     */
    private connect() {
        this.es = new EventSource(this.config.url);

        this.es.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;

            this.config.onConnect();
            console.log('[SSEClient] connected');
        };

        this.es.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.es.onerror = (err) => {
            this.connected = false;

            this.config.onError(err);

            // EventSource 默认会自动重连，但有些情况下需要手动兜底
            if (this.config.reconnect) {
                this.tryReconnect();
            }
        };
    }

    /**
     * 重连机制（兜底）
     */
    private tryReconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.warn('[SSEClient] max reconnect reached');
            return;
        }

        this.reconnectAttempts++;

        this.reconnectTimer = window.setTimeout(() => {
            console.log('[SSEClient] reconnecting...');
            this.es?.close();
            this.connect();
        }, this.config.reconnectInterval);
    }

    /**
     * 处理消息
     */
    private handleMessage(event: MessageEvent) {
        let data: SSEMessage;

        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }

        // 校验
        if (!data.__socket_client__) return;
        if (data.namespace !== this.config.namespace) return;

        // 分发
        const handlers = this.messageHandlers.get(data.type);
        handlers?.forEach(h => h(data.payload, event));
    }

    /**
     * 监听
     */
    public on<T = any>(type: string, handler: MessageHandler<T>) {
        const list = this.messageHandlers.get(type) || [];
        list.push(handler);
        this.messageHandlers.set(type, list);
    }

    /**
     * 取消监听
     */
    public off(type: string, handler: MessageHandler) {
        const list = this.messageHandlers.get(type);
        if (!list) return;

        this.messageHandlers.set(
            type,
            list.filter(h => h !== handler)
        );
    }

    /**
     * 是否连接
     */
    public isConnected() {
        return this.connected;
    }

    /**
     * 手动关闭
     */
    public disconnect() {
        this.config.reconnect = false;
        this.es?.close();
        this.connected = false;
        this.config.onDisconnect();
    }

    /**
     * 销毁
     */
    public destroy() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.es?.close();
        this.es = null;
        this.messageHandlers.clear();
        this.connected = false;
    }
}