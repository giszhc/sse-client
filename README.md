# SSE Client

一个 **轻量、类型安全** 的 Server-Sent Events（SSE）通信客户端库，用于 **浏览器端实时数据订阅**。

相比 WebSocket，本库基于 **HTTP 长连接**，更适合 **流式数据、日志推送、AI 输出等场景**。

---

## ✨ 特性

* 🔌 **开箱即用** - 简单 API，快速接入 SSE 服务
* 🔄 **智能重连** - 内置重连机制，重连后自动恢复所有事件监听
* 🎯 **Namespace 隔离** - 避免不同业务消息冲突
* 🛡️ **类型安全** - 完整 TypeScript 支持，事件名和 payload 自动推导
* 📦 **灵活的消息分发** - 同时支持标准 SSE 和自定义协议
* ⚡ **轻量无依赖** - 基于原生 `EventSource`，零运行时依赖
* 🌊 **天然支持流式** - 非常适合 AI / 日志 / 进度流
* 🎪 **精准事件管理** - 支持 `on`、`off`、`once`，不会解绑失败
* 🔧 **企业级增强** - 兼容第三方 SSE，fallback 机制完善

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

## 在线示例

我们提供了一个功能完整的在线演示页面，您可以直接在浏览器中体验所有功能：

**🌐 立即体验：** [点击访问在线演示](https://giszhc.github.io/sse-client/example/)

---

## 🚀 快速开始

### 安装

```bash
npm install @giszhc/sse-client
# 或
pnpm add @giszhc/sse-client
# 或
yarn add @giszhc/sse-client
```

### 基本使用

```ts
import { SSEClient } from '@giszhc/sse-client';

const client = new SSEClient({
  url: 'http://localhost:3001/sse',
  namespace: 'my-app:chat:v1',

  // 自动重连配置
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 2000,

  // 生命周期回调
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
client.on('message', (data, rawEvent) => {
  console.log('收到消息:', data);
});

// 监听特定类型事件
client.on('notification', (data) => {
  console.log('收到通知:', data);
});
```

---

## 📦 消息结构

本库支持 **两种消息格式**，自动识别并分发：

### 方式一：自定义协议（推荐）

服务端推送的数据格式：

```ts
{
  __socket_client__: true,  // 内部标识，必须
  namespace: string,         // 命名空间，用于隔离
  type: string,              // 事件类型
  payload?: any              // 消息体
}
```

示例：

```json
{
  "__socket_client__": true,
  "namespace": "my-app:chat:v1",
  "type": "message",
  "payload": {
    "text": "Hello World",
    "from": "user123"
  }
}
```

### 方式二：标准 SSE 格式

直接使用原生 SSE 的 `event` 和 `data` 字段：

```text
event: message
data: {"text":"Hello"}

```

> 💡 **提示**：两种方式可以同时使用，库会自动识别并正确分发。

---

## 📡 服务端数据格式

### SSE 响应头（必须）

```text
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### 数据格式

#### 自定义协议格式

```text
data: {"__socket_client__":true,"namespace":"my-app:chat:v1","type":"message","payload":{"text":"hello"}}

```

#### 标准 SSE 格式

```text
event: message
data: {"text":"hello"}

```

> ⚠️ 注意：**必须以两个换行符 `\n\n` 结尾**

---

## 📤 发送消息（正确方式）

由于 SSE 是**单向通信**（服务端 → 客户端），发送数据需要通过 HTTP：

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

## 📘 类型安全使用

本库提供完整的 TypeScript 支持，可以自动推导事件名和 payload 类型：

```ts
import { SSEClient } from '@giszhc/sse-client';

// 定义事件映射
type MyEvents = {
  message: { text: string; from: string };
  notification: { title: string; content: string };
  system: { event: string; status: 'success' | 'warning' | 'error' };
};

// 创建类型安全的客户端
const client = new SSEClient<MyEvents>({
  url: 'http://localhost:3001/sse',
  namespace: 'my-app:chat:v1'
});

// ✅ 类型安全：IDE 会自动提示事件名
client.on('message', (data) => {
  // data 类型自动推导为 { text: string; from: string }
  console.log(data.text); // ✅ 类型检查通过
  console.log(data.unknown); // ❌ TypeScript 错误
});

client.on('notification', (data) => {
  // data 类型自动推导为 { title: string; content: string }
  console.log(data.title);
});

// ❌ TypeScript 错误：事件名不存在
client.on('invalid_event', (data) => {});
```

---

## 📚 API

### 配置项

```ts
interface SSEClientConfig {
  url: string;                    // SSE 服务器地址
  namespace: string;              // 命名空间，用于消息隔离

  // 重连配置
  reconnect?: boolean;            // 是否启用自动重连（默认：true）
  maxReconnectAttempts?: number;  // 最大重连次数（默认：5）
  reconnectInterval?: number;     // 重连间隔毫秒数（默认：2000）

  // 生命周期回调
  onConnect?: () => void;         // 连接成功时触发
  onDisconnect?: () => void;      // 断开连接时触发
  onError?: (error: Event) => void; // 发生错误时触发
}
```

---

### on(type, handler)

注册事件监听器：

```ts
client.on('message', (payload, rawEvent) => {
  console.log('收到消息:', payload);
  console.log('原始事件:', rawEvent);
});
```

**参数：**
- `type`: 事件名称（string）
- `handler`: 回调函数 `(payload: T, rawEvent: MessageEvent) => void`

---

### once(type, handler)

注册一次性事件监听器，触发后自动移除：

```ts
client.once('connected', (payload) => {
  console.log('首次连接成功:', payload);
  // 此监听器只会触发一次
});
```

**参数：**
- `type`: 事件名称（string）
- `handler`: 回调函数 `(payload: T, rawEvent: MessageEvent) => void`

---

### off(type, handler)

取消事件监听：

```ts
const handler = (data) => {
  console.log('收到数据:', data);
};

// 注册监听
client.on('message', handler);

// 取消监听
client.off('message', handler);
```

⚠️ **注意**：必须传入与 `on` 相同的 handler 引用才能成功解绑。

---

### isConnected()

检查当前连接状态：

```ts
if (client.isConnected()) {
  console.log('已连接');
} else {
  console.log('未连接');
}
```

**返回值：** `boolean`

---

### disconnect()

手动断开连接（禁用自动重连）：

```ts
client.disconnect();
```

调用后不会触发自动重连，如需重新连接需要手动创建新实例。

---

### destroy()

销毁实例，清理所有资源：

```ts
client.destroy();
```

会执行以下操作：
- 关闭 SSE 连接
- 清除所有事件监听器
- 清除重连定时器
- 释放内存

💡 **建议**：在组件卸载或页面关闭时调用。

---

## 💡 使用示例

### 流式 AI 输出（推荐场景）

```ts
const client = new SSEClient({
  url: '/api/ai/stream',
  namespace: 'ai:chat:v1'
});

let result = '';

client.on('token', (chunk) => {
  result += chunk;
  console.log('实时输出:', result);
});

client.once('end', () => {
  console.log('生成完成:', result);
});
```

---

### 日志流监控

```ts
const client = new SSEClient({
  url: '/api/logs/stream',
  namespace: 'app:logs:v1'
});

client.on('log', (log) => {
  console.log(`[${log.level}] ${log.timestamp}:`, log.message);
});

client.on('error', (err) => {
  console.error('系统错误:', err);
});
```

---

### 进度条实时更新

```ts
const client = new SSEClient({
  url: '/api/upload/progress',
  namespace: 'upload:v1'
});

client.on('progress', (data) => {
  const { percent, speed, remaining } = data;
  updateProgressBar(percent);
  console.log(`上传进度: ${percent}%, 速度: ${speed}, 剩余: ${remaining}s`);
});

client.once('complete', (data) => {
  console.log('上传完成！文件ID:', data.fileId);
});
```

---

### 多命名空间隔离

```ts
// 聊天客户端
const chatClient = new SSEClient({
  url: '/sse',
  namespace: 'app:chat:v1'
});

chatClient.on('message', (data) => {
  console.log('收到聊天消息:', data);
});

// 通知客户端
const notifyClient = new SSEClient({
  url: '/sse',
  namespace: 'app:notification:v1'
});

notifyClient.on('notification', (data) => {
  console.log('收到通知:', data);
});
```

---

### React 中使用

```tsx
import { useEffect, useRef } from 'react';
import { SSEClient } from '@giszhc/sse-client';

function ChatComponent() {
  const clientRef = useRef<SSEClient | null>(null);

  useEffect(() => {
    // 创建客户端
    clientRef.current = new SSEClient({
      url: '/api/chat/stream',
      namespace: 'chat:v1',
      onConnect: () => console.log('已连接'),
      onError: (err) => console.error('错误:', err)
    });

    // 注册监听
    clientRef.current.on('message', (data) => {
      console.log('收到消息:', data);
    });

    // 清理函数
    return () => {
      clientRef.current?.destroy();
    };
  }, []);

  return <div>Chat Component</div>;
}
```

---

### Vue 3 中使用

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { SSEClient } from '@giszhc/sse-client';

let client: SSEClient | null = null;

onMounted(() => {
  client = new SSEClient({
    url: '/api/notifications',
    namespace: 'notifications:v1'
  });

  client.on('notification', (data) => {
    console.log('收到通知:', data);
  });
});

onBeforeUnmount(() => {
  client?.destroy();
});
</script>
```

---

### 配合 HTTP 发送消息

```ts
const client = new SSEClient({
  url: '/api/events',
  namespace: 'chat:v1'
});

// 接收消息
client.on('message', (data) => {
  console.log('收到:', data);
});

// 发送消息（通过 HTTP）
async function sendMessage(text: string) {
  await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      namespace: 'chat:v1',
      type: 'message',
      payload: { text }
    })
  });
}

// 使用
sendMessage('Hello World');
```

---

## 🔄 重连机制

本库内置智能重连机制，确保连接稳定性：

### 自动重连

```ts
const client = new SSEClient({
  url: '/api/events',
  namespace: 'app:v1',
  
  // 启用自动重连（默认开启）
  reconnect: true,
  
  // 最大重连次数（默认 5 次）
  maxReconnectAttempts: 5,
  
  // 重连间隔（默认 2000ms）
  reconnectInterval: 2000
});
```

### 重连后自动恢复事件监听

🔥 **核心特性**：重连成功后，所有之前注册的事件监听器会自动重新绑定，无需手动处理。

```ts
const client = new SSEClient({
  url: '/api/events',
  namespace: 'app:v1'
});

// 注册多个事件监听
client.on('message', handler1);
client.on('notification', handler2);
client.on('system', handler3);

// 网络中断后...
// 重连成功后，以上三个监听器会自动恢复！
```

### 手动控制重连

```ts
// 禁用重连
const client = new SSEClient({
  url: '/api/events',
  namespace: 'app:v1',
  reconnect: false
});

// 或者在运行时断开（自动禁用重连）
client.disconnect();
```

---

## ⚠️ 注意事项

### 1️⃣ SSE 不能发送消息

SSE 是**单向通信**（服务端 → 客户端），不支持直接发送消息：

```ts
// ❌ 错误：SSE 没有 sendMessage 方法
client.sendMessage(...);

// ✅ 正确：通过 HTTP 发送
fetch('/api/send', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
```

如果需要双向通信，请使用 **WebSocket**。

---

### 2️⃣ namespace 必须一致

前后端的 `namespace` 必须完全匹配，否则消息会被过滤：

```ts
// 前端
const client = new SSEClient({
  url: '/sse',
  namespace: 'my-app:chat:v1'  // 注意这个值
});

// 后端
data: {"__socket_client__":true,"namespace":"my-app:chat:v1",...}
```

---

### 3️⃣ 必须返回标准 SSE 格式

服务端响应必须以两个换行符结尾：

```text
data: {...}\n\n
```

Node.js 示例：

```js
res.write(`data: ${JSON.stringify(message)}\n\n`);
```

---

### 4️⃣ 注意资源释放

在组件卸载或页面关闭时，务必调用 `destroy()` 清理资源：

#### React

```tsx
useEffect(() => {
  const client = new SSEClient({ ... });
  
  return () => {
    client.destroy();  // 清理资源
  };
}, []);
```

#### Vue 3

```vue
<script setup>
import { onBeforeUnmount } from 'vue';

let client = null;

onBeforeUnmount(() => {
  client?.destroy();  // 清理资源
});
</script>
```

---

### 5️⃣ 生产环境建议

- ✅ 使用 HTTPS/WSS
- ✅ 设置合理的重连次数和间隔
- ✅ 做好错误处理和日志记录
- ✅ 校验 payload 数据结构
- ✅ 避免在 payload 中传递敏感信息

```ts
const client = new SSEClient({
  url: 'https://your-domain.com/sse',  // 使用 HTTPS
  namespace: 'app:prod:v1',
  maxReconnectAttempts: 10,             // 适当增加重连次数
  reconnectInterval: 3000,              // 适当增加重连间隔
  onError: (error) => {
    // 上报错误到监控系统
    reportError(error);
  }
});
```

---

## ❓ 常见问题

### Q: onConnect 什么时候触发？

A: 在 SSE 连接建立成功时（`EventSource.onopen`）触发。每次重连成功后也会再次触发。

---

### Q: 如何处理重连？

A: 默认开启自动重连，无需额外配置：

```ts
const client = new SSEClient({
  url: '/sse',
  namespace: 'app:v1',
  reconnect: true,  // 默认值
  maxReconnectAttempts: 5,
  reconnectInterval: 2000
});
```

重连后所有事件监听器会自动恢复。

---

### Q: payload 支持什么类型？

A: 所有 JSON 可序列化数据：

* ✅ Object / Array
* ✅ String / Number / Boolean
* ✅ null
* ❌ Function
* ❌ undefined
* ❌ Symbol

---

### Q: SSE 和 WebSocket 怎么选？

👉 简单判断：

**使用 SSE：**
- AI 流式输出
- 日志 / 进度推送
- 通知推送
- 股票行情
- 实时数据展示

**使用 WebSocket：**
- 聊天 IM
- 实时互动游戏
- 协同编辑
- 需要双向通信的场景

---

### Q: 可以不用这个库吗？

可以，使用原生 `EventSource`：

```ts
const es = new EventSource('/sse');

es.onmessage = (e) => {
  console.log(e.data);
};

es.onerror = (err) => {
  console.error('Error:', err);
};
```

但你需要自己处理：
- ❌ 重连策略
- ❌ 消息分发
- ❌ 类型管理
- ❌ 事件恢复
- ❌ 资源清理

本库帮你解决了以上所有问题！

---

### Q: 如何调试？

A: 可以通过以下方式调试：

```ts
const client = new SSEClient({
  url: '/sse',
  namespace: 'app:v1',
  onConnect: () => console.log('✅ Connected'),
  onDisconnect: () => console.log('❌ Disconnected'),
  onError: (err) => console.error('⚠️ Error:', err)
});

// 检查连接状态
console.log('Is connected:', client.isConnected());

// 在浏览器控制台查看
window.client = client;
```

---

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器（Chrome、Firefox、Safari、Edge），因为它们都原生支持 `EventSource` API。

如需支持 IE，需要引入 polyfill：

```bash
npm install event-source-polyfill
```

## 🔐 安全建议

1. 使用 HTTPS
2. 校验 namespace
3. 校验 payload 数据
4. 做好错误处理

---

## 📄 License

MIT

---
