<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useChatStore } from "../../store/chat";
import { storeToRefs } from "pinia";
import { ElMessage, ElSelect, ElOption } from "element-plus";
import { ElMessageBox } from "element-plus";
import "github-markdown-css";
import { getBaseURL } from "../../utils/request";
import { useTokenStore } from "../../store/token";
import { renderAssistantMessage } from "../../utils/markdown/chat/assistant.js";
import { renderUserMessage } from "../../utils/markdown/chat/user.js";
import { useUserInfoStore } from "../../store/userInfo.js";
const userInfoStore = useUserInfoStore();
const { userInfo } = storeToRefs(userInfoStore);
const avatarUrl = ref(userInfo.value?.avatarImage || "/avatar/avatar1.png");
const chatStore = useChatStore();
const { chatList, currentChatId } = storeToRefs(chatStore);
const inputMessage = ref("");
const chatContainer = ref(null);

// AI模型列表
const models = [
  { value: "deepseek-v3", label: "deepseek-v3" },
  { value: "deepseek-r1", label: "deepseek-r1" },
  { value: "qwq-plus", label: "qwq-plus" },
  { value: "qwen-max-2025-01-25", label: "qwen-max-2025-01-25" }
];
const selectedModel = ref("deepseek-v3");

// temperature相关配置
const temperature = ref(0.4);
const temperatureOptions = Array.from({ length: 11 }, (_, i) => i / 10); // 生成0.0到1.0的选项

// 在组件加载时，如果没有对话，创建一个新的
onMounted(() => {
  if (!currentChatId.value) {
    chatStore.createNewChat();
  }
});

const isLoading = ref(false);
const isthinking = ref(true); // 是否在思考中
const handleStreamChat = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.error("消息不能为空");
    return;
  }

  // 添加用户消息
  chatStore.addMessage("user", inputMessage.value);

  // 清空输入框
  inputMessage.value = "";

  // 等待DOM更新后滚动到底部
  await nextTick();
  scrollToBottom();

  isLoading.value = true;

  isthinking.value = true;

  try {
    const history = chatStore.getCurrentChatHistory();
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    chatStore.addMessage("assistant", ""); // 添加空的AI消息占位符
    const baseURL = getBaseURL();
    const token = useTokenStore().token;
    const response = await fetch(`${baseURL}ai/chat-stream`, {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        messages: messages,
        model: selectedModel.value,
        temperature: temperature.value
      })
    });

    if (!response.ok) {
      throw new Error("网络错误");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // 更新最后一条消息的内容
      const temp = parseChunk(chunk);
      chatStore.addChatToCurrent(temp);
    }
  } catch (error) {
    console.error("对话出错:", error);
    ElMessage.error(error.message || "对话出错");
  } finally {
    isLoading.value = false;
  }
};

let buffer = ""; // 存储未解析完的数据

function parseChunk(chunk) {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop(); // 最后一行可能不完整，放回 buffer

  let content = "";

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;

    const data = line.slice(5).trim();
    if (data === "[DONE]") continue;

    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta;

      if (!delta) continue;

      // 处理思考和回答
      if (delta.reasoning_content === null && isthinking.value) {
        content += "\n\n**======以上是思考过程======**\n\n";
        isthinking.value = false;
      }

      // 优先取 content，再取 reasoning_content
      const text = delta.content ?? delta.reasoning_content;
      if (text) content += text;
    } catch (error) {
      console.error("解析失败:", error, "数据:", data);
    }
  }

  return content;
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// 创建新对话
const createNew = () => {
  chatStore.createNewChat();
};

// 清空当前对话
const clearChat = () => {
  ElMessageBox.confirm("确定要清空当前会话吗", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    chatStore.clearCurrentChat();
    ElMessage.success("当前会话已清空");
  });
};
// 删除对话
const handleChatDelete = (chatId) => {
  ElMessageBox.confirm("确定要删除此对话吗", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    chatStore.deleteChat(chatId);
    ElMessage.success("对话已删除");
  });
};

// Markdown渲染方法已移至 utils/markdown.js

const isSidebarVisible = ref(false);

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value;
};

const closeSidebar = () => {
  isSidebarVisible.value = false;
};

// 点击对话项后自动隐藏侧边栏
const handleChatSelect = (id) => {
  chatStore.setCurrentChat(id);
  if (window.innerWidth <= 768) {
    isSidebarVisible.value = false;
  }
};
</script>

<template>
  <div class="chat-layout">
    <!-- 遮罩层 -->
    <div
      class="sidebar-overlay"
      :class="{ show: isSidebarVisible }"
      @click="closeSidebar"
    ></div>

    <!-- 左侧对话列表 -->
    <div class="chat-sidebar" :class="{ show: isSidebarVisible }">
      <div class="sidebar-header">
        <h2>对话设置</h2>
        <div class="sidebar-controls">
          <div class="control-item">
            <label>模型选择：</label>
            <el-select v-model="selectedModel" class="model-select">
              <el-option
                v-for="model in models"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-select>
          </div>
          <div class="control-item">
            <label>采样温度：</label>
            <el-select
              v-model="temperature"
              class="temperature-select"
              placeholder="采样温度"
            >
              <el-option
                v-for="temp in temperatureOptions"
                :key="temp"
                :label="temp.toFixed(1)"
                :value="temp"
              />
            </el-select>
          </div>
        </div>
        <div class="sidebar-divider"></div>
        <h2>对话历史</h2>
        <button class="new-chat-btn" @click="createNew">新对话</button>
      </div>

      <div class="chat-list">
        <div
          v-for="(chat, index) in chatList"
          :key="chat.id"
          class="chat-item"
          :class="{ active: chat.id === currentChatId }"
          @click="handleChatSelect(chat.id)"
        >
          <span class="chat-title">对话 {{ index + 1 }}</span>
          <button class="delete-btn" @click.stop="handleChatDelete(chat.id)">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <h1>AI 助手</h1>
        </div>
        <button class="clear-btn" @click="clearChat">清空当前对话</button>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="chatContainer">
        <template v-if="currentChatId">
          <div
            v-for="msg in chatList.find((c) => c.id === currentChatId)
              ?.messages"
            :key="msg.id"
            :class="['message-container', msg.role]"
          >
            <div class="avatar">
              <img
                :src="
                  msg.role === 'assistant' ? '/avatar/avatar2.png' : avatarUrl
                "
                :alt="msg.role"
              />
            </div>
            <div class="message-wrapper">
              <div class="message">
                <div
                  v-if="msg.role === 'assistant'"
                  class="message-content markdown-body"
                  v-html="renderAssistantMessage(msg.content)"
                ></div>
                <div
                  v-else-if="msg.role === 'user'"
                  class="message-content"
                  v-html="renderUserMessage(msg.content)"
                ></div>
                <div class="message-time">
                  {{ new Date(msg.timestamp).toLocaleTimeString() }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <textarea
          v-model="inputMessage"
          placeholder="请输入文本..."
          @keyup.enter.ctrl="handleStreamChat"
          rows="3"
        ></textarea>
        <button @click="handleStreamChat" :disabled="isLoading">发送</button>
      </div>
    </div>

    <!-- 移动端菜单按钮 -->
    <button class="menu-btn" @click="toggleSidebar">
      <span style="font-size: 1.5rem">☰</span>
    </button>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  background-color: #f7fbfe;
  position: relative;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }

  .chat-sidebar {
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 10;
    transform: translateX(-100%);
    background-color: #fff;
    transition: transform 0.3s ease;
  }

  .chat-sidebar.show {
    transform: translateX(0);
  }

  .sidebar-overlay.show {
    display: block;
  }

  .chat-main {
    width: 100%;
    margin-left: 0;
  }

  .chat-header {
    padding: 0.5rem;
  }

  .header-left {
    gap: 0.5rem;
  }

  .chat-header h1 {
    font-size: 1.2rem;
  }

  .model-select {
    width: 120px;
  }

  .temperature-select {
    width: 120px;
  }

  .clear-btn {
    padding: 0.3rem 0.8rem;
    font-size: 0.9rem;
  }

  .message {
    max-width: 100%;
    padding: 0.7rem 0.8rem;
    font-size: 0.9rem;
  }

  .message-container {
    margin-bottom: 0.8rem;
  }

  .avatar {
    width: 15px !important;
    height: 15px !important;
  }

  .message-wrapper {
    max-width: 75% !important; /* 移动端适当增加宽度 */
    margin: 0.3rem 0;
  }

  .message {
    padding: 0.5rem !important;
    max-width: 100% !important;
  }

  /* 优化移动端消息布局 */
  .message-container.assistant .message-wrapper {
    margin-right: 8px !important;
    align-items: flex-start;
  }

  .message-container.user .message-wrapper {
    margin-left: 8px !important;
    align-items: flex-end;
  }

  /* 优化移动端代码块显示 */
  .message.assistant .markdown-body pre {
    margin: 0.5rem 0;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .message.assistant .markdown-body code {
    font-size: 0.9rem;
  }

  /* 优化思考状态显示 */
  .message.assistant:last-child.thinking::after {
    bottom: -18px;
    left: 32px; /* 对齐头像右侧 */
    font-size: 0.8rem;
    color: #3498db;
  }

  .message-container {
    gap: 0.5rem;
  }

  .message-time {
    font-size: 0.7rem;
  }

  .chat-input {
    padding: 0.5rem;
  }

  .chat-input textarea {
    padding: 0.5rem;
    min-height: 40px;
    font-size: 0.9rem;
  }

  .chat-input button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .menu-btn {
    display: block;
    position: fixed;
    top: 80px;
    left: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #3498db;
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 11;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-btn:active {
    background-color: #45a049;
  }

  /* 代码块在移动端的适配 */
  .message :deep(.markdown-body pre) {
    max-width: 100%;
    overflow-x: auto;
    font-size: 0.8rem;
    padding: 0.6rem;
    margin: 0.5rem 0;
  }

  .message :deep(.markdown-body) {
    font-size: 0.9rem;
  }

  .message :deep(.markdown-body p) {
    margin: 0.5rem 0;
  }

  /* 移动端的图片适配 */
  .message :deep(.markdown-body img) {
    max-width: 100%;
    height: auto;
  }

  /* 移动端消息布局优化 */
  .message {
    margin: 0.3rem 0;
    padding: 0 0.3rem;
    gap: 0.3rem;
  }

  .message-content {
    padding: 0.5rem;
    font-size: 0.95rem;
  }

  .message-time {
    font-size: 0.7rem;
    margin-top: 0.25rem;
  }

  .message.user .message-content {
    border-radius: 12px 12px 4px 12px;
  }

  .message.assistant .message-content {
    border-radius: 12px 12px 12px 4px;
  }
}

/* 在大屏幕上隐藏菜单按钮 */
@media screen and (min-width: 769px) {
  .menu-btn {
    display: none;
  }
}

/* 恢复其他原有样式 */
.chat-sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

.sidebar-controls {
  margin-bottom: 1rem;
}

.control-item {
  margin-bottom: 1rem;
}

.control-item label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.sidebar-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1rem 0;
}

.model-select,
.temperature-select {
  width: 100% !important;
}

.new-chat-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.chat-item:hover {
  background-color: #f0f0f0;
}

.chat-item.active {
  background-color: #ebf5fb;
}

.delete-btn {
  padding: 0.2rem 0.5rem;
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
}

.chat-item:hover .delete-btn {
  opacity: 1;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.chat-header {
  padding: 1rem;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.model-select {
  width: 150px;
}

.temperature-select {
  width: 120px;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.3rem; /* 进一步减小内边距 */
  display: flex;
  flex-direction: column;
  gap: 0.3rem; /* 减小消息之间的间距 */
  height: calc(100vh - 140px); /* 减去头部和底部的高度 */
}

.message-container {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.3rem; /* 减小头像和消息之间的间距 */
  width: 100%;
}

.message-container.user {
  flex-direction: row-reverse;
}

@media screen and (max-width: 768px) {
  .message-container {
    margin-bottom: 0.3rem;
    gap: 0.2rem; /* 移动端进一步减小间距 */
  }
}

.avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media screen and (max-width: 768px) {
  .chat-layout .avatar {
    width: 28px !important;
    height: 28px !important;
  }
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-wrapper {
  flex: 1;
  max-width: 85%;
  width: auto;
  display: flex;
  flex-direction: column;
}

.message-container.user .message-wrapper {
  display: flex;
  align-items: flex-end;
}

.message-container.assistant .message-wrapper {
  display: flex;
  align-items: flex-start;
}

/* 修改现有的message样式 */
.message {
  max-width: 100%;
  width: fit-content;
  padding: 1rem;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin: 0 8px; /* 增加左右间距，避免消息太靠近头像 */
}

.message-container.user .message {
  background-color: #3498db;
  color: white;
  font-size: 13px;
  border-top-right-radius: 4px;
}

.message-container.assistant .message {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-top-left-radius: 4px;
}

/* 添加消息气泡的小尾巴 */
.message::before {
  content: "";
  position: absolute;
  top: 0;
  width: 12px;
  height: 12px;
}

.message-container.assistant .message::before {
  left: -6px;
  border-radius: 0 0 12px 0;
  border: 6px solid #fff;
  border-left-color: transparent;
  border-top-color: transparent;
  box-shadow: 2px 2px 0 0 #e0e0e0;
}

.message-container.user .message::before {
  right: -6px;
  border-radius: 0 0 0 12px;
  border: 6px solid #3498db;
  border-right-color: transparent;
  border-top-color: transparent;
}

/* 优化消息气泡和内容的样式 */
.message-wrapper .message {
  transition: transform 0.2s ease;
}

.message-wrapper:hover .message {
  transform: translateY(-1px);
}

.message-content {
  position: relative;
  z-index: 1;
}

.message-time {
  margin-top: 4px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.4);
  text-align: right;
}

.message-container.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

/* 优化markdown内容的显示 */
.message.assistant .markdown-body {
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
  color: #24292e;
}

.message.assistant .markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 8px 0;
}

.message.assistant .markdown-body code {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  padding: 2px 4px;
}

/* 用户消息样式 */
.message-container.user .message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #d9e7eb;
}

/* 添加输入状态提示 */
.message.assistant:last-child {
  position: relative;
}

.message.assistant:last-child.thinking::after {
  content: "正在思考...";
  position: absolute;
  bottom: -20px;
  left: 0;
  font-size: 12px;
  color: #666;
  animation: thinking 1.5s infinite;
}

@keyframes thinking {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9;
}

/* 输入框区域样式 */
.chat-input {
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  align-items: center;
  position: relative;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.chat-input textarea {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  height: 56px;
  min-height: 56px;
  max-height: 56px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: block;
  margin: 0;
  box-sizing: border-box;
}

.chat-input textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.2);
}

.chat-input textarea::placeholder {
  color: #999;
}

.chat-input button {
  padding: 0 1.5rem;
  height: 56px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.chat-input button:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.chat-input button:active {
  transform: translateY(0);
}

.chat-input button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 移动端输入框适配 */
@media screen and (max-width: 768px) {
  .chat-input {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .chat-input textarea {
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    height: 48px;
    min-height: 48px;
    max-height: 48px;
  }

  .chat-input button {
    padding: 0 1.2rem;
    height: 48px;
    font-size: 0.95rem;
  }
}
</style>
