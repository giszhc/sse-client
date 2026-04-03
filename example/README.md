# SSE Client 示例

这个示例展示了如何使用 `SSEClient` 库连接到 SSE (Server-Sent Events) 服务器。

## 📁 文件说明

- `main.ts` - 前端客户端代码，展示如何使用 SSEClient
- `index.html` - 前端页面，提供可视化界面（需要构建）
- `simple.html` - 简单示例页面（无需构建，直接使用）
- `server.ts` - 后端 SSE 服务器，用于发送测试消息

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm add -D tsx
```

### 2. 启动 SSE 服务器

```bash
pnpm run example:server
```

### 3. 打开前端页面

**方式一：使用 Vite 开发服务器（推荐）**

在项目根目录运行:

```bash
pnpm run dev
```

然后在浏览器中访问：`http://localhost:5173/example/`

**方式二：使用构建后的文件**

先构建示例：

```bash
pnpm run build:example
```

构建完成后，所有文件会输出到 `docs` 目录：
- `docs/index.html` - 主页面
- `docs/simple.html` - 简单页面
- `docs/server.ts` - 服务器代码（复制）

然后启动服务器：

```bash
npx tsx docs/server.ts
```

最后直接在浏览器打开 `docs/index.html` 或 `docs/simple.html`

## 🎯 功能演示

### 前端功能

- ✅ 自动连接到 SSE 服务器
- ✅ 实时显示连接状态（已连接/断开/连接中/错误）
- ✅ 接收并显示不同类型的消息（message、notification、system）
- ✅ 支持手动断开和重新连接
- ✅ 自动重连机制
- ✅ 消息清空功能

### 后端功能

- ✅ SSE 服务器每秒发送一条随机类型的消息
- ✅ 支持多个客户端同时连接
- ✅ 心跳机制（每 15 秒发送 ping）
- ✅ CORS 跨域支持

## 🔧 配置说明

在 `main.ts` 中可以修改以下配置:

```typescript
const client = new SSEClient({
    url: 'http://localhost:3001/sse',     // SSE 服务器地址
    namespace: 'chat',                     // 命名空间
    reconnect: true,                       // 是否自动重连
    maxReconnectAttempts: 5,               // 最大重连次数
    reconnectInterval: 2000,               // 重连间隔（毫秒）
    onConnect: () => {},                   // 连接成功回调
    onDisconnect: () => {},                // 断开连接回调
    onError: (error) => {}                 // 错误回调
});
```

## 📝 使用说明

1. **订阅消息**: 使用 `client.on(type, handler)` 订阅特定类型的事件
2. **取消订阅**: 使用 `client.off(type, handler)` 取消订阅
3. **手动断开**: 使用 `client.disconnect()` 手动断开连接
4. **销毁实例**: 使用 `client.destroy()` 完全销毁客户端实例

## 🌟 特性

- **Namespace 隔离**: 通过 namespace 参数实现消息过滤
- **类型安全**: 完整的 TypeScript 类型定义
- **自动重连**: 网络中断后自动尝试重新连接
- **事件驱动**: 基于事件订阅的消息处理机制

## 💡 调试技巧

1. 打开浏览器开发者工具查看控制台日志
2. 使用 `window.sseClient` 访问客户端实例进行调试
3. 在 Network 面板中查看 SSE 连接状态

## ⚠️ 注意事项

- SSE 是单向通信协议（仅支持服务器到客户端）
- 需要配合 HTTP 请求实现双向通信
- 某些旧版浏览器可能不支持 EventSource API
