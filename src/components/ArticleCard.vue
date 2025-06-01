<script setup>
const props = defineProps({
  article: {
    type: Object,
    required: true,
    default: () => ({
      title: "",
      author: "",
      createTime: "",
      updateTime: "",
      content: "",
      articleId: "",
      categoryId: "",
      status: ""
    })
  },
  onClick: {
    type: Function,
    default: () => {}
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};
</script>

<template>
  <div class="article-card" @click="onClick">
    <h2 class="article-title">{{ article.title }}</h2>
    <div class="article-info">
      <span class="author">作者：{{ article.author }}</span>
      <span class="time">发布时间：{{ formatDate(article.createTime) }}</span>
      <span class="time">更新时间：{{ formatDate(article.updateTime) }}</span>
    </div>
    <p class="article-content">
      {{
        article.content?.length > 100
          ? article.content.substring(0, 100) + "..."
          : article.content
      }}
    </p>
  </div>
</template>

<style scoped>
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
  word-break: break-all;
  overflow-wrap: break-word;
}

.article-info {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
}

.article-content {
  margin: 0;
  line-height: 1.6;
  color: #555;
  word-break: break-all;
  overflow-wrap: break-word;
}

@media screen and (max-width: 768px) {
  .article-card {
    padding: 15px;
  }

  .article-info {
    flex-direction: column;
    gap: 5px;
  }

  .article-title {
    font-size: 16px;
  }

  .article-content {
    font-size: 14px;
  }
}
</style>
