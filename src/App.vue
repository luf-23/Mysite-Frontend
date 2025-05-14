<script setup>
import { useTokenStore } from "./store/token.js";
const tokenStore = useTokenStore();
const token = tokenStore.token;
// 不需要直接导入 LoginVue 组件，因为现在使用路由来管理组件
</script>

<template>
  <router-view />
</template>

<style scoped></style>
