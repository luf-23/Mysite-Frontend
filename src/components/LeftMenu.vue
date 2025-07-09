<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo" @click="toggleCollapse">
        <span v-if="!isCollapse">Mysite</span>
        <span v-else>M</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#f8f9fa"
        text-color="#6c757d"
        active-text-color="#3b82f6"
        router
      >
        <el-menu-item index="/home">
          <el-icon><home-filled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-menu-item index="/ai/chat">
          <el-icon><ChatDotSquare /></el-icon>
          <template #title>对话</template>
        </el-menu-item>

        <el-sub-menu index="user">
          <template #title>
            <el-icon><user /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/profile">个人信息</el-menu-item>
          <el-menu-item index="/article/category">文章管理</el-menu-item>
          <el-menu-item index="/message">我的私信</el-menu-item>
          <el-menu-item index="/security">安全设置</el-menu-item>
          <el-menu-item @click="handleLogout">退出登录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title>
            <el-icon><setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/settings">系统设置</el-menu-item>
          <el-menu-item index="/system/users">用户管理</el-menu-item>
          <el-menu-item index="/system/roles">角色权限</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/about">
          <el-icon><info-filled /></el-icon>
          <template #title>关于我们</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-main class="main">
      <slot></slot>
      <!-- 这里显示传入的内容 -->
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute,useRouter } from "vue-router";
import {
  HomeFilled,
  User,
  Setting,
  InfoFilled,
  ChatDotSquare
} from "@element-plus/icons-vue";
import { useTokenStore } from "../store/token";

const route = useRoute();
const isCollapse = ref(false);
const tokenStore = useTokenStore();
const router = useRouter();
// 计算当前激活的菜单
const activeMenu = computed(() => {
  const { path } = route;
  return path;
});

const handleLogout = ()=>{
  tokenStore.removeToken();
  router.push({
    path:"/login"
  })
}

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
}

.aside {
  background-color: #f8f9fa;
  transition: width 0.3s;
  box-shadow: 1px 0 10px rgba(0, 0, 0, 0.05);
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #3b82f6;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  background-color: #f1f5f9;
  transition: all 0.3s;
}

.logo:hover {
  color: #60a5fa;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  margin: 4px 0;
  &:hover {
    background-color: #e2e8f0 !important;
    color: #3b82f6 !important;
  }
  &.is-active {
    background-color: #dbeafe !important;
    color: #3b82f6 !important;
  }
}

:deep(.el-sub-menu__title) {
  &:hover {
    background-color: #e2e8f0 !important;
    color: #3b82f6 !important;
  }
}

:deep(.el-menu--collapse) {
  .el-sub-menu__title {
    padding: 0 20px !important;
  }
}

.main {
  background-color: #ffffff;
  flex: 1;
}

@media screen and (max-width: 768px) {
  .aside {
    display: none; /* 在移动端直接隐藏侧边栏 */
  }

  .main {
    width: 100%;
    padding: 10px;
  }
}
</style>
