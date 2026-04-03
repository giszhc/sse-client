# SSE Client

一个 **轻量、类型安全** 的 Server-Sent Events（SSE）通信客户端库，用于 **浏览器端实时数据订阅**。

相比 WebSocket，本库基于 **HTTP 长连接**，更适合 **流式数据、日志推送、AI 输出等场景**。

---

## ✨ 特性

* 🔌 **开箱即用** - 简单 API，快速接入 SSE 服务
* 🔄 **自动重连** - 内置重连机制（含兜底策略）
* 🎯 **Namespace 隔离** - 避免不同业务消息冲突
* 🛡️ **类型安全** - 完整 TypeScript 支持
* 📦 **事件订阅机制** - 基于 type 的消息分发
* ⚡ **轻量无依赖** - 基于原生 `EventSource`
* 🌊 **天然支持流式** - 非常适合 AI / 日志 / 进度流

---

## ⚠️ 与 WebSocket 的关键区别

> 这一段建议你保留，否则用户 100% 会误用

| 能力   | WebSocket | SSE               |
| ---- | --------- | ----------------- |
| 通信方式 | 双向        | **单向（服务端 → 客户端）** |
| 协议   | ws / wss  | http / https      |
| 发送消息 | ✅         | ❌（需走 HTTP）        |
| 使用场景 | 聊天 / 游戏   | **流式数据 / 推送**     |

👉 **重要：SSE 不支持直接发送消息**

---

## 🚀 快速开始

### 基本使用

```ts
import { SSEClient } from '@giszhc/sse-client';

const client = new SSEClient({
  url: 'http://localhost:8080/sse',
  namespace: 'my-app:chat:v1',

  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 2000,

  onConnect: () => {
    console.log('✅ 已连接');
  },

  onDisconnect: () => {
    console.log('❌ 已断开连接');
  },

  onError: (error) => {
    console.error('错误:', error);
  }
});

// 监听消息
client.on('MESSAGE', (data) => {
  console.log('收到消息:', data);
});
```

---

## 📦 消息结构

所有服务端推送的数据必须为：

```ts
{
  __socket_client__: true,
  namespace: string,
  type: string,
  payload?: any
}
```

* `__socket_client__`: 内部标识
* `namespace`: 命名空间
* `type`: 消息类型
* `payload`: 消息体

---

## 📡 服务端数据格式（必须）

SSE 响应头：

```text
Content-Type: text/event-stream
```

数据格式：

```text
data: {"__socket_client__":true,"namespace":"my-app:chat:v1","type":"MESSAGE","payload":{"text":"hello"}}

```

> 注意：**必须以两个换行结尾**

---

## 📤 发送消息（正确方式）

由于 SSE 是单向通信，发送数据需要通过 HTTP：

```ts
async function sendMessage(type: string, payload: any) {
  await fetch('/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      namespace: 'my-app:chat:v1',
      type,
      payload
    })
  });
}
```

---

## API

### 配置项

```ts
interface SSEClientConfig {
  url: string;
  namespace: string;

  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;

  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}
```

---

### on(type, handler)

监听事件：

```ts
client.on('MESSAGE', (data, rawEvent) => {
  console.log(data);
});
```

---

### off(type, handler)

取消监听：

```ts
const handler = (data) => {};

client.on('MESSAGE', handler);
client.off('MESSAGE', handler);
```

---

### isConnected()

```ts
client.isConnected();
```

---

### disconnect()

手动断开连接（禁用重连）：

```ts
client.disconnect();
```

---

### destroy()

销毁实例：

```ts
client.destroy();
```

---

## 💡 使用示例

### 流式 AI 输出（推荐场景）

```ts
const client = new SSEClient({
  url: '/api/ai/stream',
  namespace: 'ai:chat:v1'
});

let result = '';

client.on('TOKEN', (chunk) => {
  result += chunk;
  console.log('实时输出:', result);
});

client.on('END', () => {
  console.log('完成:', result);
});
```

---

### 日志流

```ts
client.on('LOG', (log) => {
  console.log(`[${log.level}]`, log.message);
});
```

---

### 多命名空间隔离

```ts
const chatClient = new SSEClient({
  url: '/sse',
  namespace: 'app:chat:v1'
});

const notifyClient = new SSEClient({
  url: '/sse',
  namespace: 'app:notification:v1'
});
```

---

## ⚠️ 注意事项

### 1️⃣ SSE 不能发送消息

```ts
// ❌ 错误
client.sendMessage(...);

// ✅ 正确
fetch(...)
```

---

### 2️⃣ namespace 必须一致

前后端必须完全匹配：

```ts
namespace: 'my-app:chat:v1'
```

---

### 3️⃣ 必须返回标准 SSE 格式

```text
data: xxx\n\n
```

---

### 4️⃣ 注意资源释放

```ts
useEffect(() => {
  const client = new SSEClient({ ... });

  return () => {
    client.destroy();
  };
}, []);
```

---

### 5️⃣ 生产环境建议

```ts
// ✅ 推荐
url: 'https://your-domain.com/sse'
```

---

## ❌ 常见问题

### Q: onConnect 什么时候触发？

A: 在 SSE 连接建立成功时（`EventSource.onopen`）。

---

### Q: 如何重连？

A: 默认开启自动重连：

```ts
reconnect: true
```

---

### Q: payload 支持什么类型？

A: 所有 JSON 可序列化数据：

* ✅ Object / Array
* ✅ String / Number / Boolean
* ❌ Function

---

### Q: SSE 和 WebSocket 怎么选？

👉 简单判断：

* **用 SSE：**

  * AI 流式输出
  * 日志 / 进度
  * 通知推送

* **用 WebSocket：**

  * 聊天 IM
  * 实时互动
  * 游戏

---

### Q: 可以不用这个库吗？

可以，使用原生：

```ts
const es = new EventSource('/sse');

es.onmessage = (e) => {
  console.log(e.data);
};
```

但你需要自己处理：

* 重连策略
* 消息分发
* 类型管理

---

## 🔐 安全建议

1. 使用 HTTPS
2. 校验 namespace
3. 校验 payload 数据
4. 做好错误处理

---

## 📄 License

MIT

---

## 一句实话（建议你保留）

> 如果你的场景是“流式数据”，SSE 会比 WebSocket 更简单、更稳定；
> 如果你需要“强交互”，请继续使用 WebSocket。

---

如果你下一步要做的是**对外开源这个库**，我可以帮你再补两块很加分的东西：

* npm 包结构优化（tree-shaking / d.ts）
* 对标竞品 README（比如 axios / socket.io 那种级别）

这套已经挺接近能发了。
