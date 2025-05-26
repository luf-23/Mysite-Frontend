<script setup>
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useUserInfoStore } from "../../store/userInfo";
import {
  getPendingArticleListService,
  getPublishedArticleListService
} from "../../api/admin";
import { getAuthorNameService } from "../../api/community";
import { ref } from "vue";
import LeftMenu from "../../components/LeftMenu.vue";
const router = useRouter();
const userInfoStore = useUserInfoStore();
const { userInfo } = storeToRefs(userInfoStore);
if (userInfo.value.username !== "admin") {
  router.push({
    name: "NotFound"
  });
}
const articleList = ref([
  {
    articleId: "",
    categoryId: "",
    author: "",
    title: "",
    content: "",
    status: "", //pending or published
    createTime: "",
    updateTime: ""
  }
]);
const getAuthorName = async (categoryId) => {
  try {
    const result = await getAuthorNameService(categoryId);
    return result.data;
  } catch (error) {
    console.error("获取作者名称失败:", error);
    return "error";
  }
};
const loading = ref(false);
const getArticleList = async () => {
  loading.value = true;
  const publishedList = ref();
  const pendingList = ref();
  const result1 = await getPendingArticleListService();
  pendingList.value = result1.data.map((item) => {
    return {
      articleId: item.articleId,
      categoryId: item.categoryId,
      author: "",
      title: item.title,
      content: item.content,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime
    };
  });
  for (const item of pendingList.value) {
    const authorName = await getAuthorName({
      categoryId: item.categoryId
    });
    item.author = authorName;
  }
  const result2 = await getPublishedArticleListService();
  publishedList.value = result2.data.map((item) => {
    return {
      articleId: item.articleId,
      categoryId: item.categoryId,
      author: "",
      title: item.title,
      content: item.content,
      status: item.status,
      createTime: item.createTime,
      updateTime: item.updateTime
    };
  });
  for (const item of publishedList.value) {
    const authorName = await getAuthorName({
      categoryId: item.categoryId
    });
    item.author = authorName;
  }
  articleList.value = [
    ...JSON.parse(JSON.stringify(publishedList.value)),
    ...JSON.parse(JSON.stringify(pendingList.value))
  ];
  articleList.value.sort((a, b) => {
    return new Date(b.updateTime) - new Date(a.updateTime);
  });
  loading.value = false;
};
getArticleList();
// 内容格式化
const formatContent = (content) => {
  if (!content) return "";
  return content.length > 10 ? content.slice(0, 10) + "..." : content;
};
const formatTitle = (title) => {
  if (!title) return "";
  return title.length > 10 ? title.slice(0, 10) + "..." : title;
};
const getStatusType = (status) => {
  switch (status) {
    case "published":
      return "success";
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
    case "pending":
      return "待审核";
    default:
      return "未知状态";
  }
};
const handleRowClick = (rowData) => {
  router.push({
    name: "ArticleDetailManager",
    query: {
      articleId: rowData.articleId,
      categoryId: rowData.categoryId,
      author: rowData.author
    }
  });
};
</script>

<template>
  <LeftMenu>
    <!-- 表格区域 -->
    <div class="article-list-container">
      <el-card class="table-card">
        <el-table
          :data="articleList"
          style="width: auto"
          border
          :loading="loading"
          @row-click="handleRowClick"
        >
          <el-table-column prop="articleId" label="ID"></el-table-column>
          <el-table-column prop="categoryId" label="categoryId">
            <template #default="{ row }">
              {{ formatContent(row.categoryId) }}
            </template>
          </el-table-column>
          <el-table-column prop="author" label="作者">
            <template #default="{ row }">
              {{ formatContent(row.author) }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题">
            <template #default="{ row }">
              {{ formatTitle(row.title) }}
            </template>
          </el-table-column>
          <el-table-column prop="content" label="内容">
            <template #default="{ row }">
              {{ formatContent(row.content) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间">
            <template #default="{ row }">
              {{ new Date(row.createTime).toLocaleDateString() }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间">
            <template #default="{ row }">
              {{ new Date(row.updateTime).toLocaleDateString() }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </LeftMenu>
</template>

<style scoped>
.article-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.title-text {
  font-weight: 500;
  color: #409eff;
}

.content-text {
  color: #606266;
}

.el-table {
  font-size: 14px;
}

.el-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.el-tag {
  font-weight: 500;
}

/* 鼠标悬停行效果 */
.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
  cursor: pointer;
}

/* 当前行高亮效果 */
.el-table :deep(.current-row) {
  background-color: #ecf5ff !important;
}
</style>
