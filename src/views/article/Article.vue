<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Clock } from "@element-plus/icons-vue";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";
import { useUserInfoStore } from "../../store/userInfo";
import {
  getArticleDetailService,
  publishArticleService,
  checkService
} from "../../api/article";
import { ElMessage } from "element-plus";
const userInfoStore = useUserInfoStore();
const route = useRoute();
const router = useRouter();
const articleData = ref({
  articleId: "",
  categoryId: "",
  title: "",
  content: "",
  status: "",
  createTime: "",
  updateTime: ""
});
const getArticleDetail = async () => {
  const articleId = route.query.articleId;
  const categoryId = route.query.categoryId;
  const result = await getArticleDetailService({
    articleId: articleId,
    categoryId: categoryId
  });
  articleData.value = result.data;
};
getArticleDetail();

const isAuthor = ref(false);
const author = ref("");
const check = async () => {
  const categoryId = route.query.categoryId;
  const result = await checkService({
    categoryId: categoryId
  });
  isAuthor.value = result.data;
  author.value = isAuthor.value
    ? userInfoStore.userInfo.username
    : route.query.author;
};
check();
const getStatusType = (status) => {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "info";
    case "pending":
      return "warning";
    default:
      return "info";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "published":
      return "已发布";
    case "draft":
      return "草稿";
    case "pending":
      return "待审核";
    default:
      return "未知状态";
  }
};

const goBack = () => {
  router.go(-1);
};

const handlePublish = async () => {
  try {
    await publishArticleService({
      articleId: articleData.value.articleId,
      categoryId: articleData.value.categoryId
    });
    ElMessage.success("发布成功");
    getArticleDetail(); // 刷新文章状态
  } catch (error) {
    ElMessage.error("发布失败，请重试");
  }
};

const handleEdit = () => {
  const currentPath = router.currentRoute.value.fullPath;
  router.push({
    name: "ArticleEdit",
    query: {
      articleId: articleData.value.articleId,
      categoryId: articleData.value.categoryId,
      redirect: currentPath,
      type: "edit"
    }
  });
};
</script>

<template>
  <div class="article-container">
    <div class="article-header">
      <el-button @click="goBack" class="back-button">
        <el-icon><arrow-left /></el-icon>
        返回
      </el-button>
      <h1>文章详情</h1>
    </div>

    <el-card class="article-card">
      <div class="article-meta">
        <div class="left-meta">
          <div class="meta-item">
            <span class="label">文章ID：</span>
            <span>{{ articleData.id }}</span>
          </div>
          <div class="meta-item">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(articleData.status)">
              {{ getStatusText(articleData.status) }}
            </el-tag>
          </div>
          <div class="meta-item author-info">
            <span class="label">作者：</span>
            <span>{{ author }}</span>
          </div>
        </div>
        <div class="right-meta" v-if="isAuthor">
          <el-button
            type="primary"
            @click="handlePublish"
            :disabled="articleData.status === 'published'"
            v-if="articleData.status === 'draft'"
          >
            发布
          </el-button>
          <el-button
            type="info"
            disabled
            v-else-if="articleData.status === 'published'"
          >
            已发布
          </el-button>
          <el-button
            type="warning"
            disabled
            v-else-if="articleData.status === 'pending'"
          >
            审核中
          </el-button>
          <el-button
            type="primary"
            @click="handleEdit"
            v-if="articleData.status !== 'pending'"
          >
            修改文章
          </el-button>
        </div>
      </div>

      <div class="article-content">
        <h2 class="article-title">{{ articleData.title }}</h2>

        <div class="time-info">
          <span class="time-item">
            <el-icon><clock /></el-icon>
            创建时间：{{ articleData.createTime }}
          </span>
          <span class="time-item">
            <el-icon><clock /></el-icon>
            更新时间：{{ articleData.updateTime }}
          </span>
        </div>

        <div class="content-box">
          <div class="content-label">文章内容：</div>
          <md-preview
            :modelValue="articleData.content"
            preview-theme="vuepress"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.article-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.article-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.article-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: 500;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.back-button:hover {
  transform: translateX(-3px);
}

.article-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.article-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.left-meta {
  display: flex;
  gap: 24px;
}

.right-meta {
  display: flex;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-info {
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.label {
  color: #606266;
  font-weight: 500;
}

.article-content {
  padding: 24px;
}

.article-title {
  font-size: 28px;
  color: #303133;
  margin: 0 0 24px 0;
  font-weight: 600;
  line-height: 1.4;
}

.time-info {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  color: #909399;
  font-size: 14px;
  padding: 16px;
  background: #f8f9fb;
  border-radius: 6px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-box {
  margin-top: 24px;
}

.content-label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 16px;
  font-size: 16px;
}

:deep(.md-preview-wrapper) {
  background-color: transparent !important;
  padding: 0 !important;
}

:deep(.md-preview-wrapper pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 16px 0;
}

:deep(.md-preview-wrapper code) {
  background-color: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 85%;
  font-family: "Courier New", Courier, monospace;
}

:deep(.md-preview-wrapper pre code) {
  background-color: transparent;
  padding: 1em;
  display: block;
  overflow-x: auto;
}

:deep(.el-button) {
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tag) {
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .article-container {
    padding: 10px;
  }

  .article-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }

  .article-header h1 {
    font-size: 20px;
  }

  .article-meta {
    flex-direction: column;
    padding: 15px;
  }

  .left-meta,
  .right-meta {
    width: 100%;
  }

  .left-meta {
    flex-direction: column;
    gap: 10px;
  }

  .right-meta {
    margin-top: 15px;
    justify-content: flex-start;
    gap: 8px;
  }

  .article-title {
    font-size: 22px;
    margin-bottom: 16px;
  }

  .time-info {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    font-size: 12px;
  }

  :deep(.md-preview-wrapper) {
    font-size: 14px;
  }

  :deep(.md-preview-wrapper pre) {
    margin: 12px 0;
    padding: 8px;
    font-size: 12px;
    overflow-x: auto;
  }

  :deep(.el-button) {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>
