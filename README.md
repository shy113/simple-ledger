# 蜉蝣简账

> 轻记录，慢生活

一款基于 `uni-app + Vue 3 + TypeScript` 的极简微信小程序记账工具，专注快速录入、清晰统计与本地隐私优先。

---

## 特性一览

- 📝 **快速记账** — 浮动按钮一键唤起，支持金额、日期、分类、成员、备注录入
- 📊 **多维统计** — 按周 / 月 / 年切换，折线趋势 + 分类排行 + 成员排行
- 🏷️ **分类管理** — 自定义支出 / 收入分类，增删编辑图标与名称
- 👥 **成员管理** — 自定义记账成员，支持头像与姓名编辑
- 💾 **数据备份** — 一键导出 JSON 到剪贴板，支持从剪贴板恢复
- 🎨 **多套主题** — 内置多种配色方案，CSS 变量驱动全局切换
- 🔒 **完全本地** — 所有数据仅存储在本机，零服务器，无追踪，无需注册

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | uni-app + Vue 3 Composition API |
| 语言 | TypeScript |
| 构建 | Vite |
| 样式 | CSS Variables + rpx |
| 存储 | uni.setStorageSync / getStorageSync |

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5
```

### 构建

```bash
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5
```

### 类型检查

```bash
npm run type-check
```

> 微信小程序需用微信开发者工具导入 `dist/dev/mp-weixin` 目录进行预览。

---

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── BillHeader.vue   # 首页头部汇总卡片
│   ├── BillSkeleton.vue # 账单骨架屏
│   └── GlobalLoading.vue
├── composables/
│   ├── useBills.ts      # 核心状态：账单、分类、成员的增删改查
│   ├── useLoading.ts    # 全局加载状态
│   └── useTheme.ts      # 主题变量注入
├── pages/
│   ├── index/           # 首页（明细 + 统计视图入口）
│   ├── stats/           # 统计中心（周 / 月 / 年趋势）
│   ├── stats-detail/    # 统计明细（分类 / 成员下钻）
│   └── profile/         # 我的（分类管理、成员管理、关于）
├── views/Home/
│   ├── AddBillModal.vue      # 新增 / 编辑账单弹窗
│   ├── BackupModal.vue       # 数据备份 / 恢复弹窗
│   ├── BillList.vue          # 账单列表
│   ├── ManagementModals.vue  # 分类 / 成员管理弹窗
│   └── StatsView.vue         # 首页统计视图
├── types/               # TypeScript 类型定义
├── utils/
│   └── dateHelper.ts    # 日期解析与格式化工具
└── theme/
    └── index.ts         # 主题配色配置
```

---

## 本地存储结构

项目不依赖后端，数据存储在微信小程序本地 Storage：

| Key | 内容 |
|-----|------|
| `my_bills` | 账单列表 JSON |
| `my_categories` | 分类配置 JSON |
| `my_persons` | 成员配置 JSON |

备份格式（导出 JSON）：

```json
{
  "version": 1,
  "exportedAt": "ISO 时间戳",
  "bills": [...],
  "categories": { "expense": [...], "income": [...] },
  "persons": [...]
}
```

---

## 功能说明

### 账单录入

- 点击右下角浮动按钮快速新增
- 支持简化日期输入（如 `3-18`、`0318`、`20260318`）自动识别
- 新增模式下草稿自动保留，误触关闭不丢失

### 统计中心

- 顶部切换「按周 / 按月 / 按年」三种统计周期
- Hero 卡片展示总支出 / 总收入 / 环比变化
- 散点图展示趋势，颜色跟随主题色
- 分类排行、成员排行下钻至明细

### 分类 / 成员管理

- 在「我的」页面进入管理面板
- 默认分类 / 成员不可删除，已有账单的自定义项不可删除
- 编辑时名称和图标（emoji）均可修改，关联账单自动同步

### 数据备份与恢复

- 在「明细」页面右上角操作
- 导出：将全量数据复制为 JSON 到剪贴板
- 导入：从剪贴板读取 JSON，校验格式后覆盖恢复

---

## 后续可扩展方向

- 预算设定与超支提醒
- 图表可视化增强（饼图、柱状图）
- 云端同步 / 多设备账号体系
- 定期账单（房租、订阅等）
- CSV 导出支持

---

## License

MIT
