/**
 * SSEClient - 类型安全 & 企业级增强版
 *
 * ----------------------------------------
 * 🧠 设计目标
 * ----------------------------------------
 * 1. 同时兼容两种 SSE 使用方式：
 *    ✅ 标准 SSE：event: xxx
 *    ✅ 自定义协议：message + type
 *
 * 2. 提供工程级能力：
 *    ✅ 自动重连
 *    ✅ 重连后自动恢复监听（核心）
 *    ✅ 精准 off（不会解绑失败）
 *    ✅ once 支持
 *    ✅ 第三方 SSE 兼容（fallback）
 *
 * 3. 类型安全：
 *    ✅ 事件名自动提示
 *    ✅ payload 自动推导类型
 *
 * ----------------------------------------
 * ⚠️ 注意
 * ----------------------------------------
 * - SSE 是单向通信（服务端 -> 客户端）
 * - 如果需要双向通信，请配合 HTTP 或 WebSocket
 */

/**
 * 内部协议定义（用于你自己的后端）
 *
 * 👉 这是“可选协议”，不是强制格式
 */
export interface SSEMessage<K extends string = string, T = any> {
    __socket_client__: true;
    namespace: string;
    type: K;
    payload: T;
}

/**
 * 事件映射类型
 *
 * 示例：
 * type MyEvents = {
 *   order_created: { id: number }
 *   user_login: { name: string }
 *   message: any
 * }
 */
export type EventMapBase = Record<string, any>;

/**
 * SSE 配置
 */
export interface SSEClientConfig {
    url: string;
    namespace: string;

    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;

    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

/**
 * 事件回调
 */
export type MessageHandler<T = any> = (payload: T, raw: MessageEvent) => void;

/**
 * SSE 客户端（泛型支持事件类型）
 */
export class SSEClient<Events extends EventMapBase = Record<string, any>> {
    /**
     * 原生 EventSource 实例
     */
    private es: EventSource | null = null;

    /**
     * 配置
     */
    private config: Required<SSEClientConfig>;

    /**
     * 业务 handler 存储
     *
     * key: 事件名
     * value: handler 集合
     */
    private messageHandlers = new Map<keyof Events, Set<MessageHandler>>();

    /**
     * 🔥 handler -> listener 映射（解决 removeEventListener 必须同引用问题）
     */
    private listenerMap = new Map<
        keyof Events,
        Map<MessageHandler, EventListener>
    >();

    /**
     * 已绑定的 SSE event（防止重复绑定）
     */
    private boundEvents = new Set<keyof Events>();

    /**
     * 连接状态
     */
    private connected = false;

    /**
     * 重连控制
     */
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
     * 建立 SSE 连接
     */
    private connect() {
        this.es = new EventSource(this.config.url);

        /**
         * 连接成功
         */
        this.es.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;

            // 🔥 重连后恢复所有事件监听
            this.rebindAllEvents();

            this.config.onConnect();
            console.log('[SSEClient] connected');
        };

        /**
         * 默认 message 事件
         */
        this.es.onmessage = (event) => {
            this.handleMessage(event, 'message' as keyof Events);
        };

        /**
         * 错误处理
         */
        this.es.onerror = (err) => {
            this.connected = false;

            this.config.onError(err);

            if (this.config.reconnect) {
                this.tryReconnect();
            }
        };
    }

    /**
     * 手动重连机制（兜底）
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
     * 🔥 重连后恢复所有事件监听
     */
    private rebindAllEvents() {
        if (!this.es) return;

        this.boundEvents.forEach((type) => {
            if (type === 'message') return;

            const handlerMap = this.listenerMap.get(type);
            if (!handlerMap) return;

            handlerMap.forEach((listener) => {
                this.es!.addEventListener(type as string, listener);
            });
        });
    }

    /**
     * 统一消息处理入口
     *
     * @param event 原始事件
     * @param eventType SSE 事件类型
     */
    private handleMessage(event: MessageEvent, eventType: keyof Events) {
        let rawData: any;

        try {
            rawData = JSON.parse(event.data);
        } catch {
            return;
        }

        /**
         * ✅ 1. 原生 SSE event 分发
         */
        this.dispatch(eventType, rawData, event);

        /**
         * ✅ 2. 自定义协议分发
         */
        if (rawData?.__socket_client__) {
            const data = rawData as SSEMessage;

            if (data.namespace !== this.config.namespace) return;

            if (data.type) {
                this.dispatch(
                    data.type as keyof Events,
                    data.payload,
                    event
                );
            }
        } else {
            /**
             * ✅ 3. fallback（第三方 SSE）
             */
            if (eventType === 'message') {
                this.dispatch('message' as keyof Events, rawData, event);
            }
        }
    }

    /**
     * 事件分发
     */
    private dispatch<K extends keyof Events>(
        type: K,
        payload: Events[K],
        event: MessageEvent
    ) {
        const handlers = this.messageHandlers.get(type);
        if (!handlers) return;

        handlers.forEach((handler) => {
            handler(payload, event);
        });
    }

    /**
     * 注册监听
     *
     * @example
     * client.on('order_created', data => {})
     */
    public on<K extends keyof Events>(
        type: K,
        handler: MessageHandler<Events[K]>
    ) {
        /**
         * 1️⃣ 存储 handler
         */
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);

        /**
         * 2️⃣ 标记 event（避免重复绑定）
         */
        if (type !== 'message') {
            this.boundEvents.add(type);
        }

        /**
         * 3️⃣ 创建 listener（用于 addEventListener）
         */
        const listener: EventListener = (event: Event) => {
            this.handleMessage(event as MessageEvent, type);
        };

        /**
         * 4️⃣ 建立映射（用于 off 时解绑）
         */
        if (!this.listenerMap.has(type)) {
            this.listenerMap.set(type, new Map());
        }
        this.listenerMap.get(type)!.set(handler, listener);

        /**
         * 5️⃣ 立即绑定
         */
        this.es?.addEventListener(type as string, listener);
    }

    /**
     * 注册一次性监听
     */
    public once<K extends keyof Events>(
        type: K,
        handler: MessageHandler<Events[K]>
    ) {
        const wrapper: MessageHandler<Events[K]> = (payload, event) => {
            handler(payload, event);
            this.off(type, wrapper);
        };

        this.on(type, wrapper);
    }

    /**
     * 取消监听
     */
    public off<K extends keyof Events>(
        type: K,
        handler: MessageHandler<Events[K]>
    ) {
        const handlers = this.messageHandlers.get(type);
        if (!handlers) return;

        handlers.delete(handler);

        /**
         * 同步移除 DOM listener
         */
        const listener = this.listenerMap.get(type)?.get(handler);
        if (listener) {
            this.es?.removeEventListener(type as string, listener);
            this.listenerMap.get(type)!.delete(handler);
        }
    }

    /**
     * 是否已连接
     */
    public isConnected() {
        return this.connected;
    }

    /**
     * 手动断开连接
     */
    public disconnect() {
        this.config.reconnect = false;
        this.es?.close();
        this.connected = false;
        this.config.onDisconnect();
    }

    /**
     * 销毁实例
     */
    public destroy() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.es?.close();
        this.es = null;

        this.messageHandlers.clear();
        this.listenerMap.clear();
        this.boundEvents.clear();

        this.connected = false;
    }
}