<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  deleteArticleService,
  getArticleListService,
  getSelectedArticleListService,
  updateCoverImageService //传入参数articleId, categoryId,coverImageUrl
} from "../../api/article.js";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Upload
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import ArticleCard from "../../components/ArticleCard.vue";
import { ossClient } from "../../utils/oss/index.js";

const router = useRouter();
const route = useRoute();
const categoryId = route.query.categoryId;
const tableData = ref([]);
const loading = ref(false);
const isSearchExpanded = ref(window.innerWidth > 768);
// 上传封面图片相关
const uploadDialogVisible = ref(false);
const currentUploadArticle = ref(null);
const imageUrl = ref("");
const selectedFile = ref(null);
const uploadLoading = ref(false);

// 监听窗口大小变化
const handleResize = () => {
  if (window.innerWidth <= 768) {
    isSearchExpanded.value = false;
  }
};

const toggleSearch = () => {
  isSearchExpanded.value = !isSearchExpanded.value;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// 获取文章列表
const getArticleList = async () => {
  loading.value = true;
  try {
    const result = await getArticleListService({ categoryId: categoryId });
    tableData.value = result.data.map((item) => {
      return {
        articleId: item.articleId,
        title: item.title,
        content: item.content,
        status: item.status,
        createTime: item.createTime,
        updateTime: item.updateTime,
        coverImage: item.coverImage
      };
    });
  } catch (error) {
    console.error("获取文章列表失败:", error);
    ElMessage.error("获取文章列表失败");
  } finally {
    loading.value = false;
  }
};
getArticleList();

// 删除文章
const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除文章"${row.title}"吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteArticleService({
          articleId: row.articleId
        });
        ElMessage.success("删除成功");
        const index = tableData.value.findIndex(
          (item) => item.articleId === row.articleId
        );
        if (index > -1) {
          tableData.value.splice(index, 1);
        }
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error("删除失败，请重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};

// 搜索功能
const searchForm = reactive({
  title: "",
  status: ""
});

const statusOptions = [
  { label: "已发布", value: "published" },
  { label: "草稿", value: "draft" },
  { label: "待审核", value: "pending" }
];

const handleSearch = async () => {
  loading.value = true;
  try {
    const result = await getSelectedArticleListService({
      title: searchForm.title,
      status: searchForm.status,
      categoryId: categoryId
    });
    tableData.value = result.data.map((item) => {
      return {
        articleId: item.articleId,
        title: item.title,
        content: item.content,
        status: item.status,
        createTime: item.createTime,
        updateTime: item.updateTime,
        coverImage: item.coverImage
      };
    });
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
  } finally {
    loading.value = false;
  }
};

// 查看文章详情
const handleRowClick = (rowData) => {
  router.push({
    name: "ArticleDetail",
    query: {
      articleId: rowData.articleId,
      categoryId: categoryId
    }
  });
};

// 添加新文章
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

// 处理文件上传前的验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过 5MB!");
    return false;
  }
  return true;
};

// 处理文件变更
const handleFileChange = (file) => {
  if (file && beforeUpload(file)) {
    selectedFile.value = file;
    imageUrl.value = URL.createObjectURL(file);
  }
};

// 处理拖拽文件
const handleDrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  handleFileChange(file);
};

// 处理文件上传
const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择图片");
    return;
  }

  uploadLoading.value = true;
  try {
    await ossClient.init();
    const extension = selectedFile.value.name.split(".").pop();
    const fileName = ossClient.generateFileName(
      currentUploadArticle.value.articleId,
      ossClient.constructor.IMAGE_TYPE.ARTICLE_BACKGROUND,
      extension
    );
    const fileUrl = ossClient.generateFileUrl(fileName);
    await ossClient.uploadFile(fileName, selectedFile.value);
    await updateCoverImageService({
      articleId: currentUploadArticle.value.articleId,
      categoryId: categoryId,
      coverImageUrl: fileUrl
    });
    ElMessage.success("上传成功");
    //找到currentUploadArticle在tableData中的索引
    const index = tableData.value.findIndex(
      (item) => item.articleId === currentUploadArticle.value.articleId
    );
    if (index > -1) {
      tableData.value[index].coverImage = fileUrl; // 更新封面图片
    }
    handleCloseUpload();
  } catch (error) {
    console.error("上传失败:", error);
    ElMessage.error("上传失败，请重试");
  } finally {
    uploadLoading.value = false;
  }
};

// 关闭上传对话框
const handleCloseUpload = () => {
  uploadDialogVisible.value = false;
  currentUploadArticle.value = null;
  imageUrl.value = "";
  selectedFile.value = null;
};

// 打开上传对话框
const handleChangeCoverImage = (row) => {
  currentUploadArticle.value = row;
  uploadDialogVisible.value = true;
};
</script>

<template>
  <div class="article-container">
    <!-- 头部区域 -->
    <div class="fixed-header">
      <div class="header-content">
        <el-button
          @click="$router.push('/article/category')"
          class="back-button"
          size="small"
          :icon="ArrowLeft"
          circle
        />
        <h2 class="header-title">文章管理</h2>
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          size="small"
          circle
          class="add-button"
        />
      </div>

      <!-- 搜索区域 -->
      <div class="search-toggle" @click="toggleSearch">
        <span>{{ isSearchExpanded ? "收起搜索" : "展开搜索" }}</span>
        <el-icon>
          <component :is="isSearchExpanded ? ArrowUp : ArrowDown" />
        </el-icon>
      </div>
      <div
        class="search-section"
        :class="{ 'search-collapsed': !isSearchExpanded }"
      >
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="文章标题">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入文章标题关键字"
              clearable
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              style="width: 120px"
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
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
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="article-list">
      <template v-if="tableData.length > 0">
        <ArticleCard
          v-for="item in tableData"
          :key="item.articleId"
          :article="item"
          :showDelete="true"
          :showCategoryId="false"
          :showChangeCoverImage="true"
          @click="() => handleRowClick(item)"
          @delete="() => handleDelete(item)"
          @changeCoverImage="() => handleChangeCoverImage(item)"
        />
      </template>
      <el-empty v-else description="暂无文章数据" />
    </div>

    <!-- 上传封面图片对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="更改文章封面"
      width="400px"
      :close-on-click-modal="false"
      @close="handleCloseUpload"
    >
      <div
        class="upload-container"
        @drop.prevent="handleDrop"
        @dragover.prevent
      >
        <div class="upload-area" :class="{ 'has-image': imageUrl }">
          <template v-if="imageUrl">
            <img :src="imageUrl" class="preview-image" />
            <div class="image-overlay">
              <el-icon><Upload /></el-icon>
              <span>点击或拖拽更换图片</span>
            </div>
          </template>
          <template v-else>
            <el-icon><Upload /></el-icon>
            <div class="upload-text">
              <span>点击或拖拽上传图片</span>
              <p class="upload-hint">支持 jpg、png 格式，大小不超过 2MB</p>
            </div>
          </template>
          <input
            type="file"
            class="file-input"
            accept="image/*"
            @change="(e) => handleFileChange(e.target.files[0])"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseUpload">取消</el-button>
          <el-button
            type="primary"
            :loading="uploadLoading"
            @click="handleUpload"
          >
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-container {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

/* 头部样式 */
.fixed-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  min-height: 40px;
}

.back-button {
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  text-align: center;
}

.add-button {
  flex-shrink: 0;
}

/* 搜索区域 */
.search-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 12px;
  cursor: pointer;
  gap: 8px;
  border: 1px solid #eee;
  transition: all 0.3s ease;
}

.search-toggle:hover {
  background: #f0f0f0;
}

.search-section {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
  border: 1px solid #eee;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.search-section.search-collapsed {
  max-height: 0;
  padding: 0;
  margin: 0;
  border: none;
  opacity: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-form .el-form-item {
  margin-bottom: 0;
}

/* 文章列表 */
.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding-top: 12px;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .article-list {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .article-container {
    padding: 8px;
  }

  .fixed-header {
    padding: 6px 0;
  }

  .header-content {
    padding: 0 8px;
    min-height: 36px;
  }

  .header-title {
    font-size: 15px;
  }

  .search-toggle {
    display: flex;
  }

  .search-section {
    padding: 8px;
    margin-top: 8px;
  }

  .search-section.search-collapsed {
    margin-top: 0;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .search-form .el-form-item {
    width: 100%;
    margin-right: 0;
  }

  .search-form .el-input,
  .search-form .el-select {
    width: 100% !important;
  }

  .article-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 14px;
  }

  .search-section {
    padding: 6px;
  }

  .search-form .el-button {
    width: 100%;
    margin: 2px 0 !important;
  }

  .article-list {
    gap: 10px;
  }
}

/* 上传图片模态框样式 */
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-demo {
  width: 100%;
  text-align: center;
  padding: 20px 0;
  border: 1px dashed #d3d3d3;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-demo:hover {
  background-color: #f5f5f5;
}

.image-preview {
  margin-top: 12px;
  width: 100%;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

:deep(.el-upload__tip) {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: center;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #909399;
  margin-bottom: 12px;
}

:deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
  text-align: center;
}

:deep(.el-upload__text em) {
  color: #409eff;
  font-style: normal;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-area {
  width: 100%;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 4px;
}

/* 新增上传对话框样式 */
.upload-container {
  padding: 20px;
}

.upload-area {
  position: relative;
  width: 100%;
  height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.upload-area:hover {
  border-color: var(--el-color-primary);
}

.upload-area.has-image {
  border-style: solid;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.upload-area.has-image:hover .image-overlay {
  opacity: 1;
}

.upload-text {
  text-align: center;
  color: #606266;
}

.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
