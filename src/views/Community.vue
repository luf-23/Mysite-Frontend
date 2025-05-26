<script setup>
import { ref, reactive } from "vue";
import {
  getAuthorNameService,
  getCommunityListService,
  getSelectedCommunityListService
} from "../api/community";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
const router = useRouter();
const communityList = ref([]);

const loading = ref(true);
const getAuthorName = async (categoryId) => {
  try {
    const result = await getAuthorNameService(categoryId);
    return result.data;
  } catch (error) {
    console.error("获取作者名称失败:", error);
    return "error";
  }
};
const getCommunityList = async () => {
  try {
    loading.value = true;
    const result = await getCommunityListService();
    communityList.value = result.data.map((item) => {
      return {
        categoryId: item.categoryId,
        articleId: item.articleId,
        title: item.title,
        content: item.content,
        author: "",
        createTime: item.createTime,
        updateTime: item.updateTime
      };
    });
    for (const item of communityList.value) {
      const authorName = await getAuthorName({
        categoryId: item.categoryId
      });
      console.log(111);
      item.author = authorName;
    }
    communityList.value.sort((a, b) => {
      return new Date(b.updateTime) - new Date(a.updateTime);
    });
  } catch (error) {
    console.error("获取社区列表失败:", error);
  } finally {
    loading.value = false;
  }
};
getCommunityList();
const handleRowClick = (item) => {
  router.push({
    name: "ArticleDetail",
    query: {
      articleId: item.articleId,
      categoryId: item.categoryId,
      author: item.author
    }
  });
};

//搜索框
const searchForm = reactive({
  title: "",
  content: ""
});

const handleSearch = async function () {
  try {
    loading.value = true;
    const result = await getSelectedCommunityListService({
      title: searchForm.title,
      content: searchForm.content
    });
    communityList.value = result.data.map((item) => {
      return {
        categoryId: item.categoryId,
        articleId: item.articleId,
        title: item.title,
        content: item.content,
        author: "",
        createTime: item.createTime,
        updateTime: item.updateTime
      };
    });
    for (const item of communityList.value) {
      const authorName = await getAuthorName({
        categoryId: item.categoryId
      });
      item.author = authorName;
    }
    communityList.value.sort((a, b) => {
      return new Date(b.updateTime) - new Date(a.updateTime);
    });
  } catch {
    console.log("搜索失败");
    ElMessage.error("搜索失败");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="community-container">
    <div class="fixed-header">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="标题关键字">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入文章标题关键字"
              clearable
              style="width: 300px"
            />
          </el-form-item>
          <el-form-item label="内容关键字">
            <el-input
              v-model="searchForm.content"
              placeholder="请输入文章内容关键字"
              clearable
              style="width: 300px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              @click="
                searchForm.title = '';
                searchForm.content = '';
              "
              >重置</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="article-list">
      <div
        v-for="item in communityList"
        :key="item.articleId"
        @click="handleRowClick(item)"
        class="article-card"
      >
        <h2 class="article-title">{{ item.title }}</h2>
        <div class="article-info">
          <span class="author">作者：{{ item.author }}</span>
          <span class="time"
            >发布时间：{{
              new Date(item.createTime).toLocaleDateString()
            }}</span
          >
          <span class="time"
            >更新时间：{{
              new Date(item.updateTime).toLocaleDateString()
            }}</span
          >
        </div>
        <p class="article-content">
          {{
            item.content.length > 100
              ? item.content.substring(0, 100) + "..."
              : item.content
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.community-container {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.article-list {
  display: grid;
  gap: 20px;
}

.article-card {
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.article-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.article-info {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.article-content {
  margin: 0;
  line-height: 1.6;
  color: #555;
}

.fixed-header {
  position: sticky;
  top: 0;
  background-color: #f5f7fa;
  z-index: 10;
  padding-bottom: 12px;
  margin-bottom: 16px;
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
@media screen and (max-width: 768px) {
  .fixed-header {
    position: relative;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .search-section {
    padding: 8px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>
