# 微信小程序 / uni-app 项目

基于 uni-app 开发的多端小程序项目，一套代码同时支持微信、支付宝等多个平台。

## 技术栈

- **框架**: uni-app (Vue 3 + TypeScript)
- **构建工具**: Vite
- **UI**: uView Plus / uni-ui

## 功能特性

- [ ] 页面结构
- [ ] API 封装
- [ ] 状态管理
- [ ] 权限控制

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发

```bash
# 微信小程序
npm run dev:mp-weixin

# 支付宝小程序
npm run dev:mp-alipay

# H5
npm run dev:h5

# App
npm run dev:app
```

### 构建

```bash
# 微信小程序
npm run build:mp-weixin

# 支付宝小程序
npm run build:mp-alipay

# H5
npm run build:h5
```

## 项目结构

```
├── src/
│   ├── pages/           # 页面
│   │   └── index/       # 首页
│   ├── components/      # 组件
│   ├── composables/     # 组合式 API
│   ├── utils/           # 工具函数
│   ├── api/             # API 接口
│   ├── store/           # 状态管理
│   ├── static/          # 静态资源
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   ├── manifest.json    # 应用配置
│   └── pages.json       # 页面配置
├── index.html           # H5 入口
├── vite.config.ts       # Vite 配置
└── package.json
```

## 配置

### 微信小程序 AppID

在 `src/manifest.json` 中配置：

```json
{
  "mp-weixin": {
    "appid": "你的AppID"
  }
}
```

### 支付宝小程序 AppID

在 `src/manifest.json` 中配置：

```json
{
  "mp-alipay": {
    "appid": "你的AppID"
  }
}
```

## 开发规范

- 使用 TypeScript
- 使用 ESLint + Prettier
- 遵循 Vue 3 Composition API 风格
- 组件命名使用 PascalCase

## VS Code 插件

打开项目后，VS Code 会提示安装以下插件：

- `uni-app-snippet` - uni-app 代码片段
- `vue.volar` - Vue 3 语言支持
- `uni-app.vue3-snippets` - Vue3 代码片段

## 注意事项

1. 所有页面必须在 `src/pages.json` 中注册
2. 图片资源放在 `src/static/` 目录
3. 使用 `uni.` API 进行平台兼容开发

## 相关文档

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/)
- [支付宝小程序文档](https://opendocs.alipay.com/mini/developer)

## 许可证

MIT