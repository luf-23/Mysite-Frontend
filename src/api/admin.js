import request from "../utils/request";

export function getPendingArticleListService() {
  return request({
    url: "/admin/pendingList",
    method: "get",
    headers: {
      ContentType: "application/xxx-www-form-urlencoded"
    }
  });
}

export function getPublishedArticleListService() {
  return request({
    url: "/admin/publishedList",
    method: "get",
    headers: {
      ContentType: "application/xxx-www-form-urlencoded"
    }
  });
}

export function acceptArticleService(params) {
  return request({
    url: "/admin/accept",
    method: "post",
    params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

export function rejectArticleService(params) {
  return request({
    url: "/admin/reject",
    method: "post",
    params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

export function dropArticleService(params) {
  return request({
    url: "/admin/drop",
    method: "post",
    params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}

export function getArticleDetailService(params) {
  return request({
    url: "/admin/articleDetail",
    method: "get",
    params,
    headers: {
      ContentType: "application/xxx-www-form-urlencoded"
    }
  });
}
