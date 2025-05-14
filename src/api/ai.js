import request from "../utils/request";
import { useTokenStore } from "../store/token";
import { getBaseURL } from "../utils/request";
export function chatService(data) {
  return request({
    url: "/ai/chat",
    method: "post",
    data,
    headers: {
      ContentType: "application/json"
    }
  });
}
