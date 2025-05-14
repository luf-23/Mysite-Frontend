<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import LeftMenu from "../../components/LeftMenu.vue";
import {
  getCategoryListService,
  addCategoryService,
  updateCategoryService,
  deleteCategoryService
} from "../../api/category.js";
import { ElMessage, ElMessageBox } from "element-plus";
const router = useRouter();
const tableData = reactive([]);
const getArticleCategoryList = async () => {
  const result = await getCategoryListService();
  Object.assign(
    tableData,
    result.data.map((item) => {
      return {
        id: item.categoryId,
        name: item.categoryName,
        description: item.categoryDescription ? item.categoryDescription : "无",
        createTime: item.createTime,
        updateTime: item.updateTime
      };
    })
  );
};
getArticleCategoryList();

// 设置单元格的class和data-label
const setCellClass = ({ column }) => {
  if (!column) return "";

  switch (column.property) {
    case "name":
      return "cell-name";
    case "description":
      return "cell-description";
    case "createTime":
      return "cell-create-time";
    case "updateTime":
      return "cell-update-time";
    default:
      return "";
  }
};

// 新增分类
const dialogForAdd = ref(false);
const formDataForAdd = reactive({
  categoryName: "",
  categoryDescription: ""
});
const rulesForAdd = {
  categoryName: [
    { required: true, message: "分类名不能为空", trigger: "blur" },
    { min: 1, max: 10, message: "长度在 1 到 10 个字符", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        const isExist = tableData.some((item) => item.name === value);
        if (isExist) {
          callback(new Error("该分类名称已存在"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  categoryDescription: [
    { max: 30, message: "长度小于 30 个字符", trigger: "blur" }
  ]
};
const handleAdd = () => {
  dialogForAdd.value = true;
};
const closeAddDialog = () => {
  dialogForAdd.value = false;
  formDataForAdd.categoryName = "";
  formDataForAdd.categoryDescription = "";
};
const formRefForAdd = ref(null);
const submitForAddForm = async () => {
  if (!formRefForAdd.value) return;
  try {
    await formRefForAdd.value.validate();
    // 提交表单数据
    await addCategoryService(formDataForAdd);
    ElMessage.success("添加成功");
    await getArticleCategoryList();
    // 关闭对话框
    closeAddDialog();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 编辑分类
const dialogForEdit = ref(false);
const originalCategoryName = ref(""); // 添加存储原始分类名
const formDataForEdit = reactive({
  categoryId: "",
  categoryName: "",
  categoryDescription: ""
});

const rulesForEdit = {
  categoryName: [
    { required: true, message: "分类名不能为空", trigger: "blur" },
    { min: 1, max: 10, message: "长度在 1 到 10 个字符", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        // 如果名称没有改变，直接通过验证
        if (value === originalCategoryName.value) {
          callback();
          return;
        }
        // 检查是否与其他分类名重复
        const isExist = tableData.some((item) => item.name === value);
        if (isExist) {
          callback(new Error("该分类名称已存在"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  categoryDescription: [
    { max: 30, message: "长度小于 30 个字符", trigger: "blur" }
  ]
};

const handleEdit = (row) => {
  dialogForEdit.value = true;
  originalCategoryName.value = row.name; // 保存原始分类名
  formDataForEdit.categoryId = row.id;
  formDataForEdit.categoryName = row.name;
  formDataForEdit.categoryDescription = row.description;
};

const closeEditDialog = () => {
  dialogForEdit.value = false;
  formDataForEdit.categoryName = "";
  formDataForEdit.categoryDescription = "";
  originalCategoryName.value = ""; // 清除原始分类名
  formDataForEdit.categoryId = "";
};

const formRefForEdit = ref(null);

const submitForEditForm = async () => {
  if (!formRefForEdit.value) return;
  try {
    await formRefForEdit.value.validate();
    // 提交表单数据
    await updateCategoryService(formDataForEdit);
    ElMessage.success("更新成功");
    await getArticleCategoryList();
    // 关闭对话框
    closeEditDialog();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 删除分类
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteCategoryService({
          categoryId: row.id
        });
        ElMessage.success("删除成功");
        // 直接从tableData中移除被删除的项
        const index = tableData.findIndex((item) => item.id === row.id);
        if (index > -1) {
          tableData.splice(index, 1);
        }
        //await getArticleCategoryList();
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error("删除失败，请重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};

// 点击行事件
const handleRowClick = (rowData) => {
  // 可以在这里执行其他操作，比如跳转到详情页等
  router.push({
    name: "ArticleList",
    query: {
      categoryId: rowData.id
    }
  });
};
</script>

<template>
  <LeftMenu>
    <div class="category-header">
      <h2 class="page-title">文章分类</h2>
      <el-button type="primary" @click="handleAdd">添加分类</el-button>
    </div>
    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        @row-click="handleRowClick"
        :cell-class-name="setCellClass"
      >
        <el-table-column prop="name" label="分类名" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="300" />
        <el-table-column prop="createTime" label="创建时间" min-width="200" />
        <el-table-column prop="updateTime" label="修改时间" min-width="200" />
        <el-table-column label="操作" min-width="150">
          <template #default="scope">
            <el-button size="small" @click.stop="handleEdit(scope.row)"
              >编辑</el-button
            >
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

    <!-- 添加分类对话框 -->
    <el-dialog
      v-model="dialogForAdd"
      title="添加文章分类"
      width="40%"
      :modal="true"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRefForAdd"
        :model="formDataForAdd"
        :rules="rulesForAdd"
        label-width="80px"
      >
        <el-form-item label="分类名" prop="categoryName">
          <el-input v-model="formDataForAdd.categoryName"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="categoryDescription">
          <el-input
            v-model="formDataForAdd.categoryDescription"
            type="textarea"
            :rows="4"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeAddDialog">取消</el-button>
        <el-button type="primary" @click="submitForAddForm">提交</el-button>
      </template>
    </el-dialog>

    <!-- 编辑分类对话框 -->
    <el-dialog
      v-model="dialogForEdit"
      title="编辑"
      width="40%"
      :modal="true"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRefForEdit"
        :model="formDataForEdit"
        :rules="rulesForEdit"
        label-width="80px"
      >
        <el-form-item label="分类名" prop="categoryName">
          <el-input v-model="formDataForEdit.categoryName"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="categoryDescription">
          <el-input
            v-model="formDataForEdit.categoryDescription"
            type="textarea"
            :rows="4"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditDialog">取消</el-button>
        <el-button type="primary" @click="submitForEditForm">确定</el-button>
      </template>
    </el-dialog>
  </LeftMenu>
</template>

<style scoped>
.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 24px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
}

.page-title::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50px;
  height: 4px;
  background: linear-gradient(135deg, #3a8ee6 0%, #0056b3 100%);
  border-radius: 4px;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
}

:deep(.el-table) {
  --el-table-border-color: #e0e3e9;
  --el-table-header-bg-color: #f0f2f5;
  --el-table-row-hover-bg-color: #f0f7ff;
}

:deep(.el-table th) {
  font-weight: 600;
  color: #1a1a1a;
  background-color: #f0f2f5;
  padding: 14px 0;
}

:deep(.el-table td) {
  padding: 16px 0;
  color: #333333;
  font-weight: 500;
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table__row:hover) {
  background-color: #e6f0fc !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  margin-right: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  padding: 0 16px;
}

:deep(.el-input__inner) {
  height: 32px;
}

:deep(.el-textarea__inner) {
  padding: 8px 16px;
  border-radius: 6px;
}

@media screen and (max-width: 768px) {
  .table-container {
    width: 100%;
    overflow-x: hidden;
    position: relative;
    padding: 10px;
    margin: 0;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-table) {
    background: none;
  }

  :deep(.el-table__header-wrapper) {
    display: none;
  }

  :deep(.el-table__body-wrapper) {
    width: 100% !important;
    overflow: visible !important;
  }

  :deep(.el-table__row) {
    width: 200% !important;
    display: block !important;
    margin-bottom: 10px !important;
    padding: 12px !important;
    background: #fff !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    box-sizing: border-box !important;
    transform: none !important;
  }

  :deep(.el-table__cell) {
    display: flex !important;
    flex: 1 !important;
    padding: 8px !important;
    border: none !important;
    width: 100% !important;
  }

  :deep(.cell) {
    display: flex !important;
    width: 100% !important;
    align-items: center !important;
  }

  /* 标签样式 */
  :deep(.cell-name)::before,
  :deep(.cell-description)::before,
  :deep(.cell-create-time)::before,
  :deep(.cell-update-time)::before {
    flex: 0 0 85px !important;
    font-weight: 600 !important;
    color: #606266 !important;
  }

  :deep(.cell-name)::before {
    content: "分类名：";
  }
  :deep(.cell-description)::before {
    content: "描述：";
  }
  :deep(.cell-create-time)::before {
    content: "创建时间：";
  }
  :deep(.cell-update-time)::before {
    content: "更新时间：";
  }

  /* 内容样式 */
  :deep(.cell > span) {
    flex: 1 !important;
    min-width: 0 !important;
    word-break: break-all !important;
  }

  /* 操作按钮区域 */
  :deep(.el-table__cell:last-child) {
    border-top: 1px solid #ebeef5 !important;
    margin-top: 8px !important;
    padding-top: 12px !important;
  }

  :deep(.el-table__cell:last-child .cell) {
    justify-content: flex-end !important;
    gap: 8px !important;
  }
}

@media screen and (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }
}

:deep(.el-message-box) {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

:deep(.el-message-box__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-message-box__content) {
  padding: 24px;
}

:deep(.el-message-box__btns) {
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
}
</style>
