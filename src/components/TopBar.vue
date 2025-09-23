<template>
  <div class="top-bar">
    <div class="top-bar-content">
      <!-- 移动端菜单按钮 -->
      <el-button
        class="mobile-menu-btn"
        @click="toggleMobileMenu"
        :icon="Menu"
        circle
        size="large"
        type="primary"
      />

      <!-- 页面标题 -->
      <div class="page-title">
        <h3>{{ pageTitle }}</h3>
      </div>

      <!-- 用户信息和操作 -->
      <div class="user-actions">
        <el-dropdown @command="handleCommand">
          <span class="user-info-trigger">
            <el-avatar
              :size="36"
              :src="userInfo.avatarImage || '/avatar/avatar1.png'"
              class="user-avatar"
            />
            <span class="username">{{ userInfo.nickname || "用户" }}</span>
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                设置
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserInfoStore } from "../store/userInfo";
import { useTokenStore } from "../store/token";
import { storeToRefs } from "pinia";
import {
  Menu,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from "@element-plus/icons-vue";

// 定义 emits
const emit = defineEmits(["toggle-mobile-menu"]);

const route = useRoute();
const router = useRouter();
const userInfoStore = useUserInfoStore();
const tokenStore = useTokenStore();
const { userInfo } = storeToRefs(userInfoStore);

// 页面标题映射
const pageTitleMap = {
  "/home": "首页",
  "/community": "社区讨论",
  "/ai/chat": "AI助手",
  "/profile": "个人信息",
  "/article/category": "文章分类",
  "/article/list": "文章列表",
  "/article/save": "写文章",
  "/announcement": "系统公告",
  "/admin/home": "管理后台"
};

// 计算当前页面标题
const pageTitle = computed(() => {
  return pageTitleMap[route.path] || route.meta?.title || "系统";
});

// 切换移动端菜单
const toggleMobileMenu = () => {
  emit("toggle-mobile-menu");
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case "profile":
      router.push("/profile");
      break;
    case "settings":
      // 跳转到设置页面（如果有的话）
      break;
    case "logout":
      tokenStore.removeToken();
      router.push("/login");
      break;
  }
};
</script>

<style scoped>
.top-bar {
  height: 60px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
  display: none; /* 默认隐藏 */
}

/* 只在移动端显示 */
@media screen and (max-width: 768px) {
  .top-bar {
    display: block;
  }
}

.top-bar-content {
  height: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-menu-btn {
  width: 44px;
  height: 44px;
  margin-right: 16px;
}

.page-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.user-actions {
  display: flex;
  align-items: center;
}

.user-info-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.user-info-trigger:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.user-avatar {
  border: 2px solid rgba(59, 130, 246, 0.2);
}

.username {
  font-size: 14px;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media screen and (max-width: 480px) {
  .top-bar-content {
    padding: 0 12px;
  }

  .mobile-menu-btn {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }

  .page-title h3 {
    font-size: 16px;
  }

  .username {
    display: none;
  }
}
</style>
