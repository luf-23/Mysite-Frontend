<script setup>
import LeftMenu from "../../components/LeftMenu.vue";
import { check } from "../../utils/admin/check";
import { useRouter } from "vue-router";
const router = useRouter();
check();

const handleClick1 = () => {
  router.push({
    name: "UserManager"
  });
};
const handleClick2 = () => {
  router.push({
    name: "ArticleListManager"
  });
};
</script>
<template>
  <LeftMenu>
    <div>
      <el-button type="primary" plain @click="handleClick1">用户信息</el-button>
      <el-button type="primary" plain @click="handleClick2">文章管理</el-button>
    </div>
  </LeftMenu>
</template>
<style scoped></style>
