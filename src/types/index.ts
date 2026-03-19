// 账单记录类型定义
export interface Bill {
  id: number;
  amount: number;
  type: "expense" | "income";
  category: string;
  personName: string; // 成员姓名
  personAvatar: string; // 成员头像 (Emoji)
  date: string;
  note: string;
}

// 成员类型定义
export interface Person {
  name: string;
  avatar: string;
}

// 分类类型定义
export interface Category {
  name: string;
  icon: string;
}
