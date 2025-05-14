<script setup>
import { reactive, ref } from "vue";
import {
  loginService,
  registerService,
  getUserInfoService
} from "../api/user.js";
import { useTokenStore } from "../store/token.js";
import { useUserInfoStore } from "../store/userInfo.js";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
const router = useRouter();
const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const formData = reactive({
  username: "",
  password: "",
  confirmPassword: ""
});
const islogin = ref(true);
const formRef = ref(null);

const rules = reactive({
  username: [
    { required: true, message: "用户名不能为空", trigger: "blur" },
    { min: 5, max: 16, message: "长度在 5 到 16 个字符", trigger: "blur" }
  ],
  password: [
    { required: true, message: "密码不能为空", trigger: "blur" },
    { min: 5, max: 16, message: "长度在 5 到 16 个字符", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "确认密码不能为空", trigger: "blur" },
    { min: 5, max: 16, message: "长度在 5 到 16 个字符", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});
const changeToRegister = () => {
  islogin.value = false;
  formData.username = "";
  formData.password = "";
  formData.confirmPassword = "";
};
const changeToLogin = () => {
  islogin.value = true;
  formData.username = "";
  formData.password = "";
  formData.confirmPassword = "";
};

const submitLoginForm = async () => {
  try {
    await formRef.value.validate();
    console.log("验证通过，提交数据:", formData);
  } catch (error) {
    ElMessage.error("表单验证失败，请检查输入");
    return;
  }
  const result = await loginService({
    username: formData.username,
    password: formData.password
  });
  tokenStore.setToken(result.data);
  const res = await getUserInfoService();
  const userInfo = res.data;
  userInfoStore.setUserInfo(userInfo);
  ElMessage.success("登录成功");
  // 跳转到原页面或首页
  const redirect = router.currentRoute.value.query.redirect || "/home";
  router.push(redirect);
};
const submitRegisterForm = async () => {
  try {
    await formRef.value.validate();
    console.log("验证通过，提交数据:", formData);
  } catch (error) {
    ElMessage.error("表单验证失败，请检查输入");
    return;
  }
  const result = await registerService({
    username: formData.username,
    password: formData.password
  });
  if (result.code == 0) {
    ElMessage.success("注册成功");
    changeToLogin();
  } else {
    ElMessage.error(result.msg);
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">{{ islogin ? "欢迎登录" : "用户注册" }}</h2>
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="120px"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" />
        </el-form-item>
        <el-form-item v-if="!islogin" label="确认密码" prop="confirmPassword">
          <el-input v-model="formData.confirmPassword" type="password" />
        </el-form-item>
        <div class="btn-container">
          <el-form-item v-if="islogin">
            <el-button
              type="primary"
              @click="submitLoginForm"
              class="submit-btn"
              >登录</el-button
            >
          </el-form-item>
          <el-form-item v-if="!islogin">
            <el-button
              type="primary"
              @click="submitRegisterForm"
              class="submit-btn"
              >注册</el-button
            >
          </el-form-item>
        </div>
        <div class="switch-container">
          <el-form-item v-if="islogin">
            <el-button link type="primary" @click="changeToRegister"
              >没有账号？立即注册</el-button
            >
          </el-form-item>
          <el-form-item v-if="!islogin">
            <el-button link type="primary" @click="changeToLogin"
              >返回登录</el-button
            >
          </el-form-item>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  padding: 20px;
}

.login-box {
  width: 460px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #409eff;
  font-weight: 600;
}

.login-form {
  .el-form-item {
    margin-bottom: 25px;
  }

  .el-input {
    --el-input-hover-border: #409eff;
  }
}

.btn-container {
  margin-top: 20px;

  .submit-btn {
    width: 100%;
    padding: 12px 0;
  }
}

.switch-container {
  margin-top: 15px;
  text-align: center;

  .el-button {
    font-size: 14px;
    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;

  &:hover {
    box-shadow: 0 0 0 1px #409eff inset;
  }
}

@media screen and (max-width: 768px) {
  .login-box {
    width: 100%;
    padding: 20px;
    margin: 0 10px;
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
    line-height: 20px;
  }

  :deep(.el-form) {
    padding: 0 10px;
  }

  :deep(.el-form-item) {
    margin-bottom: 15px;
  }

  :deep(.el-input__wrapper) {
    padding: 0 10px;
  }

  .btn-container .submit-btn {
    padding: 10px 0;
  }
}
</style>
