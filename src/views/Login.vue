<script setup>
import { reactive, ref } from "vue";
import {
  loginService,
  registerService,
  getUserInfoService,
  sendEmailCaptchaService,
  checkEmailCaptchaService
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
  confirmPassword: "",
  email: "",
  captcha: ""
});
const islogin = ref(true);
const formRef = ref(null);
const captchaLoading = ref(false);
const countdown = ref(0);
const timer = ref(null);

const rules = reactive({
  username: [
    { required: true, message: "用户名/邮箱不能为空", trigger: "blur" },
    { 
      validator: (rule, value, callback) => {
        // 邮箱格式正则
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        // 用户名格式：5-16个字符
        const usernamePattern = /^.{5,16}$/;
        
        if (islogin.value) {
          // 登录时允许使用邮箱或用户名
          if (emailPattern.test(value) || usernamePattern.test(value)) {
            callback();
          } else {
            callback(new Error("请输入正确的用户名(5-16个字符)或邮箱格式"));
          }
        } else {
          // 注册时用户名不能包含@
          if (value.includes('@')) {
            callback(new Error("用户名不能包含@"));
          } else if (usernamePattern.test(value)) {
            callback();
          } else {
            callback(new Error("用户名长度必须在5-16个字符之间"));
          }
        }
      },
      trigger: "blur"
    }
  ],
  email: [
    { required: true, message: "邮箱不能为空", trigger: "blur" },
    { 
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, 
      message: "请输入正确的邮箱格式", 
      trigger: "blur" 
    }
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
    usernameOrEmail: formData.username,
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
  const isvalid = await checkEmailCaptchaService({
    email: formData.email,
    captcha: formData.captcha
  });
  if (!isvalid.data) {
    ElMessage.error("验证码错误或已过期，请重新获取");
    return;
  }

  const result = await registerService({
    username: formData.username,
    password: formData.password,
    email: formData.email,
  });
  if (result.code == 0) {
    ElMessage.success("注册成功");
    changeToLogin();
  } else {
    ElMessage.error(result.msg);
  }
};
const sendCaptcha = async () => {
  if (countdown.value > 0) return;
  if (!formData.email) {
    ElMessage.warning('请先输入邮箱');
    return;
  }
  captchaLoading.value = true;
  try {
    await sendEmailCaptchaService({
      email:formData.email
    });
    ElMessage.success('验证码已发送');
    countdown.value = 60;
    timer.value = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer.value);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error('验证码发送失败');
  } finally {
    captchaLoading.value = false;
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
        <el-form-item :label="islogin ? '用户名/邮箱' : '用户名'" prop="username">
          <el-input v-model="formData.username" :placeholder="islogin ? '请输入用户名或邮箱' : '请输入用户名'" />
        </el-form-item>
        <el-form-item v-if="!islogin" label="邮箱" prop="email">
          <el-input v-model="formData.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item v-if="!islogin" label="验证码" prop="captcha">
          <div class="captcha-container">
            <el-input v-model="formData.captcha" placeholder="请输入验证码" />
            <el-button 
              type="primary" 
              :loading="captchaLoading"
              :disabled="countdown > 0"
              @click="sendCaptcha"
            >
              {{ countdown > 0 ? `${countdown}s后重试` : '获取验证码' }}
            </el-button>
          </div>
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
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  padding: 20px;
  transition: all 0.3s ease;
}

.login-box {
  width: 480px;
  padding: 45px 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.login-title {
  text-align: center;
  margin-bottom: 35px;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
}

.login-form {
  .el-form-item {
    margin-bottom: 28px;
  }

  :deep(.el-input__wrapper) {
    padding: 2px 15px;
    border-radius: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    
    &:hover {
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
    }
    
    &.is-focus {
      box-shadow: 0 0 0 1px #409eff inset, 0 4px 12px rgba(64, 158, 255, 0.2);
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
    font-size: 15px;
  }
}

.btn-container {
  margin-top: 30px;

  .submit-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    background: linear-gradient(45deg, #409eff, #36cf9f);
    border: none;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.switch-container {
  margin-top: 20px;
  text-align: center;

  .el-button {
    font-size: 15px;
    color: #409eff;
    transition: all 0.3s ease;
    
    &:hover {
      color: #36cf9f;
      transform: translateY(-1px);
    }
  }
}

.captcha-container {
  display: flex;
  gap: 12px;

  .el-input {
    flex: 1;
  }

  .el-button {
    width: 130px;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
  font-size: 15px;
  padding-bottom: 8px;
}

@media screen and (max-width: 768px) {
  .login-box {
    width: 100%;
    padding: 30px 20px;
    margin: 15px;
  }

  .login-title {
    font-size: 24px;
    margin-bottom: 25px;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
    line-height: 20px;
  }

  :deep(.el-form) {
    padding: 0 5px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    padding: 0 12px;
  }

  .btn-container .submit-btn {
    height: 40px;
    font-size: 15px;
  }

  .captcha-container {
    .el-button {
      width: 110px;
      font-size: 13px;
    }
  }
}
</style>
