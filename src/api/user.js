import request from "../utils/request.js";
export function loginService(data) {
  return request({
    url: "/user/login",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

export function registerService(data) {
  return request({
    url: "/user/register",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

export function getUserInfoService() {
  return request({
    url: "/user/getInfo",
    method: "get",
    headers: {
      //Authorization: token
    }
  });
}

export function updateUserInfoService(data) {
  console.log(data);
  return request({
    url: "/user/update",
    method: "post",
    data,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
