import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const md = new MarkdownIt({
  html: true, // 启用 HTML 标签解析
  breaks: true, // 转换段落里的 '\n' 到 <br>
  linkify: true, // 将URL 转换为链接
  xhtmlOut: true, // 使用 '/' 闭合单标签 (<br />)
  typographer: true // 启用一些语言中性的替换 + 引号美化
});

// 将 Markdown 转换为 HTML
export const renderMarkdown = (content) => {
  const html = md.render(content);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "script",
      "style",
      "div",
      "span",
      "p",
      "a",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "br"
    ],
    ALLOWED_ATTR: ["href", "target", "class", "id", "style"]
  });
};
