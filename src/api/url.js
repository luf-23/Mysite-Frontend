import request from "../utils/request.js";
// 获取头像列表
export function getAvatarListService() {
  return request({
    url: "/url/avatarList",
    method: "get"
  });
}

// 获取背景图片列表
export function getBackgroundListService() {
  return request({
    url: "/url/backgroundList",
    method: "get"
  });
}
