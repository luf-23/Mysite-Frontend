<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useChatStore } from "../../store/chat";
import { storeToRefs } from "pinia";
import { ElMessage, ElSelect, ElOption } from "element-plus";
import { chatService } from "../../api/ai";
import { ElMessageBox } from "element-plus";
import MarkdownIt from "markdown-it";
import "github-markdown-css";
import { getBaseURL } from "../../utils/request";
import { useTokenStore } from "../../store/token";
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

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

// 发送消息
const sendMessage = async () => {
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

  try {
    // TODO: 这里添加调用AI接口的逻辑
    const history = chatStore.getCurrentChatHistory();
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    const response = await chatService({
      messages: messages,
      model: selectedModel.value
    });
    // 添加AI消息
    chatStore.addMessage("assistant", response.data);
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

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
        Authorization: `Bearer ${token}`,
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

// 将 Markdown 转换为 HTML
const renderMarkdown = (content) => {
  return md.render(content);
};

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
            :class="['message', msg.role]"
          >
            <div
              class="message-content markdown-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
            <div class="message-time">
              {{ new Date(msg.timestamp).toLocaleTimeString() }}
            </div>
          </div>
        </template>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <textarea
          v-model="inputMessage"
          placeholder="输入消息...    Enter换行   Ctrl+Enter发送"
          @keyup.enter.ctrl="sendMessage"
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
  background-color: #f5f5f5;
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
    max-width: 90%;
    padding: 0.8rem;
    font-size: 0.9rem;
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
    background-color: #4caf50;
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
    padding: 0.8rem;
  }

  /* 移动端的图片适配 */
  .message :deep(.markdown-body img) {
    max-width: 100%;
    height: auto;
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
  background-color: #4caf50;
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
  background-color: #e3f2fd;
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
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100vh - 140px); /* 减去头部和底部的高度 */
}

.message {
  max-width: 80%;
  padding: 1rem;
  border-radius: 8px;
  position: relative;
}

.message.user {
  align-self: flex-end;
  background-color: #4caf50;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background-color: #fff;
  border: 1px solid #e0e0e0;
}

.message-time {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.5rem;
}

.chat-input {
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
}

.chat-input textarea {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  resize: none;
  min-height: 45px;
}

.chat-input button {
  padding: 0.8rem 2rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:hover {
  background-color: #45a049;
}

/* Markdown 样式覆盖 */
.message.assistant :deep(.markdown-body) {
  background: transparent;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

.message.user :deep(.markdown-body) {
  background: transparent;
  color: white;
  font-size: 14px;
  line-height: 1.6;
}

/* 代码块样式调整 */
.message.assistant :deep(.markdown-body pre) {
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 16px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.message.user :deep(.markdown-body pre) {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 16px;
  margin-top: 8px;
  margin-bottom: 8px;
}

/* 链接样式调整 */
.message.assistant :deep(.markdown-body a) {
  color: #0366d6;
}

.message.user :deep(.markdown-body a) {
  color: #ffffff;
  text-decoration: underline;
}

.message-content {
  word-break: break-word;
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
</style>
