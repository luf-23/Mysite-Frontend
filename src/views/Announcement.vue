<script setup>
import { ref } from "vue";

const announcements = ref([
  {
    id: 1,
    title: "系统更新通知",
    content:
      "系统将于2025年5月4日晚上8点到11点进行维护升级，届时系统将暂停服务3小时。",
    date: "2025-05-04",
    type: "warning"
  },
  {
    id: 2,
    title: "新功能发布",
    content: "文章相关所有接口均已实现，欢迎体验！",
    date: "2025-05-03",
    type: "success"
  },
  {
    id: 3,
    title: "新功能发布",
    content: "个人信息查看和修改功能已实现，欢迎体验！",
    date: "2025-05-02",
    type: "success"
  },
  {
    id: 4,
    title: "温馨提示",
    content: "请注意保护个人隐私，不要随意泄露账号信息。",
    date: "2025-05-02",
    type: "warning"
  },
  {
    id: 5,
    title: "温馨提示",
    content: "电脑端体验更佳，建议使用Chrome浏览器访问。",
    date: "2025-05-01",
    type: "warning"
  }
]);
</script>

<template>
  <div class="announcement-container">
    <h2 class="page-title">系统公告</h2>
    <el-timeline>
      <el-timeline-item
        v-for="item in announcements"
        :key="item.id"
        :type="item.type"
        :timestamp="item.date"
        size="large"
      >
        <el-card class="announcement-card">
          <template #header>
            <div class="card-header">
              <h3>{{ item.title }}</h3>
            </div>
          </template>
          <p class="announcement-content">{{ item.content }}</p>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped>
.announcement-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 30px;
  color: #303133;
  text-align: center;
}

.announcement-card {
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.announcement-content {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}
</style>
