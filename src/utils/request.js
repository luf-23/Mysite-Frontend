import axios from "axios";
import { ElMessage } from "element-plus";
import { useTokenStore } from "../store/token.js";
import router from "../router/index.js";
//const baseURL = "http://luf.woyioii.cn:8080/";
const baseURL = "http://localhost:8080/";
const request = axios.create({
  baseURL,
  timeout: 6000
});

//响应拦截器
request.interceptors.response.use(
  (result) => {
    if (result.data.code == 0) {
      return result.data;
    }

    ElMessage.error(result.data.message ? result.data.message : "请求失败");
    return Promise.reject(result.data);
  },
  (error) => {
    ElMessage.error(error.message || "未知错误");
    console.error("未授权，请登录");
    if (error.response?.status === 401) {
      // 获取当前路由路径
      const currentPath = router.currentRoute.value.fullPath;
      // 跳转到登录页面并携带重定向地址
      router.push({
        path: "/login",
        query: {
          redirect: currentPath
        }
      });
    }
    return Promise.reject(error);
  }
);
//请求拦截器
request.interceptors.request.use(
  (config) => {
    const tokenStore = useTokenStore();
    const token = tokenStore.token; // 获取 token
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

export default request;

export const getBaseURL = () => {
  return baseURL;
};
