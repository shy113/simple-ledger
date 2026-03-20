# 项目数据结构文档

本文档详细描述了本微信小程序项目中的核心数据结构和存储方案。

## 1. 核心实体模型

### 账单 (Bill)
用于记录每一笔收入或支出。
```typescript
export interface Bill {
  id: number;           // 唯一标识符 (通常使用 Date.now())
  amount: number;       // 金额
  type: "expense" | "income"; // 类型：支出 (expense) 或 收入 (income)
  category: string;     // 分类名称 (如：餐饮、交通)
  personName: string;   // 成员姓名
  personAvatar: string; // 成员头像 (通常是 Emoji)
  date: string;         // 日期 (格式：YYYY-MM-DD)
  note: string;         // 备注
}
```

### 成员 (Person)
记录参与记账的家庭成员或个人。
```typescript
export interface Person {
  name: string;   // 成员姓名
  avatar: string; // 成员头像 (Emoji)
}
```

### 分类 (Category)
账单的分类。
```typescript
export interface Category {
  name: string; // 分类名称
  icon: string; // 分类图标 (Emoji)
}
```

---

## 2. 存储与状态管理

项目使用 `uni.setStorageSync` 进行本地持久化存储，并在 `useBills.ts` 中通过 Vue 3 的 `ref` 进行响应式管理。

### 本地存储键名
- `my_bills`: 存储账单列表 (`Bill[]`)
- `my_categories`: 存储分类配置 (`Record<'expense' | 'income', Category[]>`)
- `my_persons`: 存储成员列表 (`Person[]`)

### 默认数据
- **默认分类 (expense)**: 餐饮 (🍜), 交通 (🚗), 购物 (🛍️), 养车 (🛞), 娱乐 (🎮), 其他 (📦)
- **默认分类 (income)**: 工资 (💼), 兼职 (🧾), 其他 (✅)
- **默认成员**: 本人 (😊), 家人 (👨‍👩‍👧‍👦), 朋友 (🤝)

---

## 3. 备份与还原结构 (BackupSnapshot)

数据导出和恢复时使用的标准格式。
```typescript
type BackupSnapshot = {
  version: 1;           // 数据版本号
  exportedAt: string;   // 导出时间 (ISO String)
  bills: Bill[];        // 所有账单数据
  categories: Record<'expense' | 'income', Category[]>; // 所有分类配置
  persons: Person[];    // 所有成员数据
};
```

---

## 4. 负责人
- **负责人**: guzhaoheng
