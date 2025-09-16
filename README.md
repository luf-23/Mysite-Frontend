# Mysite-Frontend

本项目是 Mysite 的前端部分，基于 Vue 3 + Vite 构建，旨在为用户提供现代化、响应式的网站前端体验。项目采用模块化开发，便于扩展和维护，适合个人或团队进行前后端分离项目实践。

## 主要功能

- 基于 Vue 3 组件化开发，支持响应式界面
- Vite 极速开发及构建体验
- 清晰的目录结构，便于扩展
- 与后端 API 对接，实现数据动态展示
- 便于自定义和二次开发

## 技术栈

- [Vue 3](https://vuejs.org/)：主流渐进式前端框架
- [Vite](https://vitejs.dev/)：下一代前端构建工具
- JavaScript
- 其他依赖详见 `package.json`

## 安装与启动

请确保已安装 [Node.js](https://nodejs.org/) 16 及以上版本。

```bash
# 克隆仓库
git clone https://github.com/luf-23/Mysite-Frontend.git
cd Mysite-Frontend

# 安装依赖
npm install

# 本地开发启动
npm run dev

# 构建生产环境
npm run build

# 预览生产环境构建
npm run preview
```

## 目录结构

```text
├── .VSCodeCounter/       # VSCode 插件文件统计目录
├── .vscode/              # VSCode 编辑器配置
├── public/               # 公共静态资源
├── src/                  # 源码目录
├── index.html            # 主页面模板
├── package.json          # 项目依赖及脚本
├── package-lock.json     # 依赖锁定文件
├── vite.config.js        # Vite 配置
└── README.md             # 项目说明文档
```

> 具体业务代码请见 `src/` 目录。

## 贡献指南

欢迎感兴趣的同学提交 Issue 或 Pull Request，参与项目建设。

1. Fork 本仓库并创建新分支
2. 提交代码并确保通过测试
3. 发起 Pull Request 并描述你的修改内容

## License

本项目尚未声明 License。如需商用或二次开发请联系作者。

## 联系方式

- 作者: [luf-23](https://github.com/luf-23)
- 项目地址: [https://github.com/luf-23/Mysite-Frontend](https://github.com/luf-23/Mysite-Frontend)
