# Simple Ledger

一个基于 `uni-app + Vue 3 + TypeScript` 的极简记账应用，主打快速录入、清晰统计和本地优先。

## 项目简介

这个项目聚焦“轻量记账”这一个核心场景，尽量减少复杂流程：

- 打开即可查看总收入、总支出和当前结余
- 支持新增、编辑、删除账单
- 支持收入 / 支出两种账单类型
- 支持分类管理和人物管理
- 提供明细视图与统计视图切换
- 首次进入会自动注入一批演示数据，方便直接预览效果

## 功能特性

### 1. 账单管理

- 浮动按钮快速记一笔
- 支持金额、日期、分类、人物、备注录入
- 点击账单可编辑，长按账单可删除

### 2. 数据统计

- 头部卡片展示收入、支出、结余汇总
- 按分类统计支出占比
- 按人物统计支出占比

### 3. 本地存储

项目当前不依赖后端，账单数据直接保存在本地 `Storage` 中，主要使用以下 key：

- `my_bills`
- `my_categories`
- `my_persons`

这意味着项目开箱即用，适合快速原型、课程作业、uni-app 练手项目或后续继续扩展。

## 技术栈

- `uni-app`
- `Vue 3`
- `TypeScript`
- `Vite`

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

启动 H5：

```bash
npm run dev:h5
```

启动微信小程序：

```bash
npm run dev:mp-weixin
```

### 构建产物

构建 H5：

```bash
npm run build:h5
```

构建微信小程序：

```bash
npm run build:mp-weixin
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```text
src
├─ components          # 通用组件
├─ composables         # 组合式逻辑
├─ pages               # uni-app 页面入口
├─ types               # TypeScript 类型定义
├─ utils               # 工具函数
└─ views/Home          # 首页相关视图模块
```

核心文件说明：

- `src/composables/useBills.ts`：账单、分类、人物的核心状态与增删改逻辑
- `src/pages/index/index.vue`：首页入口，负责视图切换和弹窗控制
- `src/views/Home/AddBillModal.vue`：新增 / 编辑账单弹窗
- `src/views/Home/BillList.vue`：账单列表
- `src/views/Home/StatsView.vue`：统计视图
- `src/views/Home/ManagementModals.vue`：分类 / 人物管理弹窗

## 当前实现说明

- 默认内置常用收入、支出分类
- 默认内置几位常用人物
- 首次无数据时会自动生成 50 条模拟账单
- 日期支持简化输入后再格式化处理

## 后续可扩展方向

- 月度筛选与年度汇总
- 分类图表可视化
- 数据导入导出
- 云端同步 / 账号体系
- 预算与超支提醒

## 适合谁

- 想快速做一个 uni-app 记账 demo 的同学
- 想练习 `Vue 3 + TypeScript + composables` 组织方式的开发者
- 想在这个基础上继续接入后端、数据库或小程序能力的项目维护者
