<script setup>
import { ref, reactive } from "vue";
import {
  getAuthorNameService,
  getCommunityListService
} from "../api/community";
import { useRouter } from "vue-router";
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
</script>

<template>
  <div class="community-container">
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
</style>
