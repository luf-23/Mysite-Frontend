<script setup>
import { ref, reactive } from "vue";
import {
  deleteArticleService,
  getArticleListService,
  getSelectedArticleListService
} from "../../api/article.js";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
const router = useRouter();
const route = useRoute();
const categoryId = route.query.categoryId;
const tableData = ref([]);
const getArticleList = async () => {
  const result = await getArticleListService({ categoryId: categoryId });
  tableData.value = result.data.map((item) => {
    return {
      id: item.articleId,
      title: item.title,
      content: item.content,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime
    };
  });
};
getArticleList();

const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除文章"${row.id}"吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteArticleService({
          articleId: row.id
        });
        ElMessage.success("删除成功");
        const index = tableData.value.findIndex((item) => item.id === row.id);
        if (index > -1) {
          tableData.value.splice(index, 1);
        }
        //getArticleList();
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error("删除失败，请重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};
// 内容格式化
const formatContent = (content) => {
  if (!content) return "";
  return content.length > 10 ? content.slice(0, 10) + "..." : content;
};
const formatTitle = (title) => {
  if (!title) return "";
  return title.length > 10 ? title.slice(0, 10) + "..." : title;
};

//搜索框
const searchForm = reactive({
  title: "",
  status: ""
});

const statusOptions = [
  { label: "已发布", value: "published" },
  { label: "草稿", value: "draft" },
  { label: "待审核", value: "pending" }
];

const getStatusType = (status) => {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "info";
    case "pending":
      return "warning";
    default:
      return "";
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

const loading = ref(false);

const handleSearch = async () => {
  loading.value = true;
  const result = await getSelectedArticleListService({
    title: searchForm.title,
    status: searchForm.status,
    categoryId: categoryId
  });
  tableData.value = result.data.map((item) => {
    return {
      id: item.articleId,
      title: item.title,
      content: item.content,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime
    };
  });
  loading.value = false;
};

// 处理行点击事件
const handleRowClick = (rowData) => {
  router.push({
    name: "ArticleDetail",
    query: {
      articleId: rowData.id,
      categoryId: categoryId
    }
  });
};

const handleAdd = () => {
  const currentPath = router.currentRoute.value.fullPath;
  router.push({
    name: "ArticleAdd",
    query: {
      categoryId: categoryId,
      redirect: currentPath,
      type: "add"
    }
  });
};
</script>

<template>
  <div class="article-container">
    <!-- 头部标题和说明区域 -->
    <div class="fixed-header">
      <div class="header-section">
        <div class="header-left">
          <el-button
            @click="$router.push('/article/category')"
            class="back-button"
          >
            <el-icon><arrow-left /></el-icon>
            返回
          </el-button>
        </div>
        <div class="header-center">
          <h2>文章管理</h2>
          <div class="description">
            在这里您可以管理所有的文章内容，包括添加、编辑和删除操作。
          </div>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            写文章
          </el-button>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="文章标题">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入文章标题关键字"
              clearable
              style="width: 300px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button
              @click="
                searchForm.title = '';
                searchForm.status = '';
              "
              >重置</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="article-list">
      <el-table
        :data="tableData"
        style="width: 100%"
        border
        :loading="loading"
        @row-click="handleRowClick"
      >
        <el-table-column prop="id" label="ID" width="180"></el-table-column>
        <el-table-column prop="title" label="标题" width="180">
          <template #default="{ row }">
            {{ formatTitle(row.title) }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" width="180">
          <template #default="{ row }">
            {{ formatContent(row.content) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="180">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="180"
        ></el-table-column>
        <el-table-column
          prop="updateTime"
          label="更新时间"
          width="180"
        ></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              size="small"
              type="danger"
              @click.stop="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.article-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 16px;
}

.fixed-header {
  position: sticky;
  top: 0;
  background-color: #f5f7fa;
  z-index: 10;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.header-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.header-left {
  flex: 0 0 80px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  padding: 8px 12px;
  height: 32px;
}

.back-button:hover {
  transform: translateX(-3px);
}

.header-center {
  flex: 1;
  text-align: center;
  padding: 0 80px;
}

.header-center h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.description {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.header-right {
  flex: 0 0 80px;
  text-align: right;
}

.search-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.search-form {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  max-width: 1000px;
  margin: 0 auto;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__content) {
  margin-bottom: 0 !important;
}

:deep(.el-button) {
  height: 32px;
  padding: 0 12px;
}

:deep(.el-input__wrapper) {
  height: 32px;
}

:deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
}

.article-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-top: 24px;
}

.article-list-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  position: relative;
}

.title::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50px;
  height: 4px;
  background: linear-gradient(135deg, #3a8ee6 0%, #0056b3 100%);
  border-radius: 4px;
}

.article-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: #e0e3e9;
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
}

.article-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.article-category {
  padding: 4px 12px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-weight: 500;
}

.article-date {
  color: #666;
  font-weight: 500;
}

.article-content {
  color: #333333;
  line-height: 1.6;
  margin: 16px 0;
  font-size: 15px;
}

.article-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-button) {
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3a8ee6 0%, #0056b3 100%);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #d63031 100%);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state-text {
  font-size: 16px;
  color: #909399;
  margin-top: 16px;
}

@media screen and (max-width: 768px) {
  .fixed-header {
    position: relative;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .header-section {
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  .header-left {
    flex-direction: row;
  }

  .back-button {
    padding: 6px 10px;
    height: 28px;
  }

  .header-center {
    padding: 0;
  }

  .header-center h2 {
    font-size: 16px;
    margin-bottom: 2px;
  }

  .description {
    display: none; /* 在移动端隐藏描述文字 */
  }

  .search-section {
    padding: 8px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  :deep(.el-form--inline) {
    display: flex;
    flex-direction: column;
  }

  :deep(.el-form--inline .el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-right: 0;
  }

  :deep(.el-form-item__label) {
    text-align: left;
    padding-bottom: 4px;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 100% !important;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  /* 调整按钮组的布局 */
  :deep(.el-form-item:last-child) {
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 8px;
  }

  :deep(.el-form-item:last-child .el-form-item__content) {
    flex-direction: row;
    gap: 8px;
  }

  .search-section {
    padding: 8px;
  }

  .article-list-container {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 16px;
    margin-bottom: 16px;
  }

  .title {
    font-size: 20px;
  }

  .article-card {
    padding: 16px;
  }

  .article-title {
    font-size: 18px;
  }

  .article-info {
    flex-wrap: wrap;
    gap: 8px;
  }

  .article-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  :deep(.el-button--small) {
    min-width: 70px;
    padding: 6px 12px;
  }
}
</style>
