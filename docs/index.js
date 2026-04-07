import{S as p}from"./index.9R3if8uS.js";let n=null,E=0,r=0;function u(t){const e={url:t,namespace:"chat",reconnect:!0,maxReconnectAttempts:5,reconnectInterval:2e3,onConnect:()=>{console.log("✅ 已连接到 SSE 服务器"),a("connected"),m(!0),i()},onDisconnect:()=>{console.log("❌ 与 SSE 服务器断开连接"),a("disconnected"),m(!1),i()},onError:s=>{console.error("⚠️ SSE 连接错误:",s),a("error"),E++,i()}};return new p(e)}function a(t){const e=document.getElementById("status"),s={connected:"🟢 已连接",disconnected:"🔴 已断开",connecting:"🟡 连接中...",error:"⚠️ 错误"};e&&(e.textContent=s[t]||"未知状态",e.className=`status ${t}`)}function m(t){const e=document.getElementById("connectBtn");e&&(e.textContent=t?"✅ 已连接":"🔌 连接",e.disabled=t)}function i(){const t=document.getElementById("stats");t&&n&&(t.innerHTML=`
            <div class="stat-item">
                <span class="stat-label">连接状态:</span>
                <span class="stat-value">${n.isConnected()?"🟢 已连接":"🔴 未连接"}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">重连次数:</span>
                <span class="stat-value">${E}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">收到消息:</span>
                <span class="stat-value">${r} 条</span>
            </div>
        `)}function g(t){t.on("message",(e,s)=>{console.log("📨 收到消息:",e),d("message",e)}),t.on("notification",e=>{console.log("🔔 收到通知:",e),d("notification",e)}),t.on("system",e=>{console.log("⚙️ 收到系统消息:",e),d("system",e)}),t.once("connected",e=>{console.log("🎯 首次连接成功（仅触发一次）:",e),d("system",{type:"once-demo",message:"这是使用 once() 监听的欢迎消息，只会显示一次"})})}function d(t,e){r++;const s=document.getElementById("messages");if(!s)return;const c=document.createElement("div");c.className=`message ${t}`;const l=new Date().toLocaleTimeString(),o=typeof e=="object"?JSON.stringify(e,null,2):String(e);c.innerHTML=`
        <span class="time">[${l}]</span>
        <span class="type">${t.toUpperCase()}</span>: 
        <pre class="content">${o}</pre>
    `,s.appendChild(c),s.scrollTop=s.scrollHeight,i()}document.addEventListener("DOMContentLoaded",()=>{const t=document.getElementById("serverUrl"),e=document.getElementById("connectBtn"),s=document.getElementById("disconnectBtn"),c=document.getElementById("reconnectBtn"),l=document.getElementById("clearBtn");e==null||e.addEventListener("click",()=>{const o=(t==null?void 0:t.value.trim())||"http://localhost:3001/sse";console.log("开始连接到:",o),n&&n.destroy(),a("connecting"),n=u(o),g(n)}),s==null||s.addEventListener("click",()=>{console.log("手动断开连接"),n&&n.disconnect()}),c==null||c.addEventListener("click",()=>{console.log("重新连接...");const o=(t==null?void 0:t.value.trim())||"http://localhost:3001/sse";n&&n.destroy(),a("connecting"),n=u(o),g(n)}),l==null||l.addEventListener("click",()=>{const o=document.getElementById("messages");o&&(o.innerHTML="",r=0,i())}),a("disconnected"),m(!1)});window.addEventListener("beforeunload",()=>{n&&n.destroy()});window.sseClient=()=>n;
