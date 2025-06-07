<script setup>
import { ref, onMounted } from "vue";
import { markRaw } from "vue";
import { useTokenStore } from "../store/token";
import { useUserInfoStore } from "../store/userInfo";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import LeftMenu from "../components/LeftMenu.vue";
import {
  User,
  Document,
  Bell,
  ChatDotSquare,
  ChatDotRound,
  HotWater
} from "@element-plus/icons-vue";

const router = useRouter();
const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const token = tokenStore.token;
const { userInfo } = storeToRefs(userInfoStore);
const loading = ref(false);

// 获取时间相关数据
const currentDate = ref(new Date());
const timeOfDay = ref("");

const updateDateTime = () => {
  currentDate.value = new Date();
  const hour = currentDate.value.getHours();
  if (hour < 6) timeOfDay.value = "凌晨好";
  else if (hour < 9) timeOfDay.value = "早上好";
  else if (hour < 12) timeOfDay.value = "上午好";
  else if (hour < 14) timeOfDay.value = "中午好";
  else if (hour < 17) timeOfDay.value = "下午好";
  else if (hour < 19) timeOfDay.value = "傍晚好";
  else timeOfDay.value = "晚上好";
};

// 更新时间
setInterval(updateDateTime, 1000);

// 快捷入口数据
const quickActions = ref([
  {
    title: "社区讨论",
    icon: markRaw(ChatDotSquare),
    path: "/community",
    color: "#60A5FA",
    description: "参与社区讨论，分享你的想法"
  },
  {
    title: "AI助手",
    icon: markRaw(ChatDotRound),
    path: "/ai/chat",
    color: "#A855F7",
    description: "智能AI助手"
  },
  {
    title: "文章管理",
    icon: markRaw(Document),
    path: "/article/category",
    color: "#F56C6C",
    description: "管理你的文章内容"
  },
  {
    title: "个人信息",
    icon: markRaw(User),
    path: "/profile",
    color: "#409EFF",
    description: "查看和编辑个人资料"
  },
  {
    title: "系统公告",
    icon: markRaw(Bell),
    path: "/announcement",
    color: "#67C23A",
    description: "查看最新系统公告"
  }
]);
if (userInfo.value.username === "admin") {
  quickActions.value.push({
    title: "管理员入口",
    icon: markRaw(HotWater),
    path: "/admin/home",
    color: "#666666",
    description: "提供管理员相关接口"
  });
}
onMounted(() => {
  if (!token) {
    router.push("/login");
    return;
  }
  updateDateTime();
});

const handleWelcomeClick = () => {
  router.push({
    path: "/profile"
  });
};
</script>

<template>
  <div class="home-container">
    <LeftMenu />
    <el-main class="main-content" v-loading="loading">
      <!-- 顶部欢迎区域 -->
      <div
        class="welcome-section"
        :style="{
          backgroundImage: `url(${
            userInfo.backgroundImage || '/background/background1.jpg'
          })`
        }"
        @click="handleWelcomeClick"
      >
        <div class="welcome-content">
          <el-avatar
            :size="64"
            :src="userInfo.avatarImage || '/avatar/avatar1.png'"
          />
          <div class="welcome-text">
            <h2>{{ timeOfDay }}，{{ userInfo.nickname || "亲爱的用户" }}</h2>
            <p class="signature">
              {{ userInfo.signature || "这个人很懒，还没有设置签名" }}
            </p>
          </div>
          <div class="date-time">
            <p>
              {{ currentDate.toLocaleString("zh-CN", { hour12: false }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 快捷入口区域 -->
      <div class="quick-actions">
        <h3>快捷入口</h3>
        <div class="actions-grid">
          <el-card
            v-for="action in quickActions"
            :key="action.title"
            class="action-card"
            :body-style="{ padding: '20px' }"
            @click="router.push(action.path)"
          >
            <div class="action-content">
              <el-icon :size="30" :color="action.color">
                <component :is="action.icon" />
              </el-icon>
              <h4>{{ action.title }}</h4>
              <p>{{ action.description }}</p>
            </div>
          </el-card>
        </div>
      </div>
    </el-main>
  </div>
</template>

<style>
.home-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 0px;
}

.main-content {
  flex: 1;
  padding-left: 20px;
}

.welcome-section {
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  height: 200px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.welcome-content {
  position: relative;
  padding: 30px;
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-text h2 {
  margin: 0;
  font-size: 24px;
  margin-bottom: 8px;
}

.signature {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.date-time {
  margin-left: auto;
  text-align: right;
  font-size: 14px;
}

.quick-actions {
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.quick-actions h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-content {
  text-align: center;
}

.action-content h4 {
  margin: 12px 0;
  color: #333;
}

.action-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.main-content {
  cursor: pointer;
}

@media (max-width: 768px) {
  .home-container {
    padding: 0;
  }

  .main-content {
    padding: 12px;
  }

  .welcome-section {
    height: auto;
    min-height: 160px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    padding: 20px;
    gap: 12px;
  }

  .el-avatar {
    flex-shrink: 0;
  }

  .welcome-text {
    width: 100%;
  }

  .welcome-text h2 {
    font-size: 18px;
  }

  .date-time {
    width: 100%;
    margin: 0;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 8px;
  }

  .welcome-content {
    padding: 16px;
  }

  .welcome-text h2 {
    font-size: 16px;
  }
}
</style>
