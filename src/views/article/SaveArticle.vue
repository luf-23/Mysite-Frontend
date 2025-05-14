<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MdEditor } from "md-editor-v3";
import { ElMessage } from "element-plus";
import {
  addArticleService,
  getArticleDetailService,
  updateArticleService
} from "../../api/article";
import "md-editor-v3/lib/style.css";

const route = useRoute();
const router = useRouter();
const isEdit = ref(route.query.type === "edit");
const categoryId = ref(route.query.categoryId);
const title = ref("");
const content = ref("");
const getArticleDetail = async () => {
  const result = await getArticleDetailService({
    articleId: route.query.articleId,
    categoryId: categoryId.value
  });
  title.value = result.data.title;
  content.value = result.data.content;
};
if (isEdit.value) {
  getArticleDetail();
}
const status = ref("draft"); // 默认为草稿状态

const handleSave = async () => {
  if (!title.value.trim()) {
    ElMessage.warning("请输入文章标题");
    return;
  }
  if (!content.value.trim()) {
    ElMessage.warning("请输入文章内容");
    return;
  }
  if (!isEdit.value) {
    await addArticleService({
      title: title.value,
      content: content.value,
      status: status.value === "published" ? "pending" : "draft",
      categoryId: categoryId.value
    });
    if (status.value === "published") {
      ElMessage.success("发布成功");
    } else {
      ElMessage.success("文章已保存为草稿");
    }
  } else {
    await updateArticleService({
      articleId: route.query.articleId,
      title: title.value,
      content: content.value,
      status: status.value === "published" ? "pending" : "draft",
      categoryId: categoryId.value
    });
    ElMessage.success("文章已更新");
  }
  const redirect = router.currentRoute.value.query.redirect || "/home";
  router.push(redirect);
};

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="add-article">
    <div class="article-header">
      <div class="left-section">
        <el-button @click="handleBack">返回</el-button>
        <input
          v-model="title"
          type="text"
          class="title-input"
          placeholder="请输入文章标题"
        />
      </div>
      <div class="right-section">
        <el-select v-model="status" class="status-select">
          <el-option label="草稿" value="draft" />
          <el-option label="发布" value="published" />
        </el-select>
        <el-button type="primary" @click="handleSave">保存文章</el-button>
      </div>
    </div>
    <div class="editor-container">
      <md-editor
        v-model="content"
        preview-theme="vuepress"
        style="height: calc(100vh - 150px)"
        :toolbars="[
          'bold',
          'underline',
          'italic',
          'strikeThrough',
          'title',
          'sub',
          'sup',
          'quote',
          'unorderedList',
          'orderedList',
          'codeRow',
          'code',
          'link',
          'image',
          'table',
          'revoke',
          'next',
          'save',
          'prettier',
          'pageFullscreen',
          'fullscreen',
          'preview',
          'htmlPreview',
          'catalog'
        ]"
      />
    </div>
  </div>
</template>

<style scoped>
.add-article {
  padding: 24px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  color: #2c3e50;
}

.title-input:hover {
  border-color: #c0c4cc;
}

.title-input:focus {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.title-input::placeholder {
  color: #909399;
}

.status-select {
  width: 120px;
}

:deep(.el-select) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

.editor-container {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

:deep(.md-editor) {
  height: 100% !important;
  border: none !important;
}

:deep(.md-editor-toolbar) {
  border-bottom: 1px solid #e4e7ed !important;
  background-color: #f8fafc !important;
}

:deep(.md-editor-content) {
  background-color: #fff !important;
}

:deep(.el-button) {
  border-radius: 8px;
  padding: 12px 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #409eff 0%, #007fff 100%);
}

:deep(.el-select-dropdown__item) {
  padding: 8px 16px;
}

:deep(.el-select-dropdown__item.selected) {
  font-weight: 600;
  background-color: #ecf5ff;
}

@media screen and (max-width: 768px) {
  .article-header {
    flex-direction: column;
    align-items: stretch;
  }

  .left-section {
    flex-direction: column;
  }

  .right-section {
    justify-content: flex-end;
    margin-top: 16px;
  }

  .title-input {
    width: 100%;
  }
}
</style>
