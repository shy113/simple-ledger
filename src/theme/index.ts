/**
 * 蜉蝣简账 - 全局主题配置系统
 */

export type ThemeId =
  | "fresh-green"
  | "macaron-blue"
  | "warm-peach"
  | "dreamy-purple";

export type ThemeVars = Record<string, string>;

export interface AppTheme {
  id: ThemeId;
  name: string;
  vars: ThemeVars;
}

// 基础功能色（全主题通用）
const baseText = "#1F2937"; // 深灰黑
const baseTextMuted = "#667085"; // 辅助灰
const baseExpense = "#FF5A5A"; // 支出红（稍微调亮了一点，更清爽）
const baseIncome = "#2ABF96"; // 收入绿

/**
 * 主题工厂函数
 * 确保所有颜色变量都根据传入参数动态生成，彻底告别“到处都是绿底”
 */
const makeTheme = (
  id: ThemeId,
  name: string,
  primary: string, // 主色
  primaryStrong: string, // 强调主色（按压/深色态）
  pageBg: string, // 页面整体背景色
  border: string, // 边框/分割线颜色
  shadowColor: string, // 投影颜色（带透明度）
  fabGradient: string, // 悬浮按钮渐变色
): AppTheme => ({
  id,
  name,
  vars: {
    // 页面背景
    "--theme-page-bg": pageBg,
    "--theme-page-bg-alt": pageBg,

    // 卡片/表面层
    "--theme-surface": "rgba(255, 255, 255, 0.94)",
    "--theme-surface-strong": "#FFFFFF",
    "--theme-surface-soft": "rgba(255, 255, 255, 0.6)",

    // 边框与阴影
    "--theme-border": border,
    "--theme-card-shadow": `0 18rpx 40rpx ${shadowColor}`,
    "--theme-card-gradient":
      "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.9) 100%)",

    // 文字颜色
    "--theme-text": baseText,
    "--theme-text-muted": baseTextMuted,

    // 品牌主色
    "--theme-primary": primary,
    "--theme-primary-strong": primaryStrong,
    "--theme-primary-soft": `${primary}20`, // 12% 不透明度的主色，用于标签背景
    "--theme-accent-ambient": `${primary}15`,

    // 悬浮按钮
    "--theme-fab-gradient": fabGradient,

    // 财务状态颜色
    "--theme-income": baseIncome,
    "--theme-expense": baseExpense,
    "--theme-income-soft": "rgba(42, 191, 150, 0.12)",
    "--theme-expense-soft": "rgba(255, 90, 90, 0.12)",
  },
});

/**
 * 主题选项定义
 */
export const themeOptions: AppTheme[] = [
  // 1. 🍵 抹茶森林 (比之前的清新绿更深邃、更有高级感)
  makeTheme(
    "fresh-green",
    "抹茶森林",
    "#41B883", // 更有质感的翡翠绿
    "#34495E", // 深色态改用深蓝灰，增加高级感
    "#F4F9F6", // 极淡的青磁底
    "#E1EBE5", // 边框
    "rgba(65, 184, 131, 0.15)",
    "linear-gradient(180deg, #6ED6A7 0%, #41B883 100%)",
  ),

  // 2. 🌊 迷雾之海 (把纯蓝改成带点青色的蓝，更通透)
  makeTheme(
    "macaron-blue",
    "迷雾之海",
    "#54a0ff", // 更明亮的湖蓝色
    "#2e86de", // 深蓝色
    "#F2F8FF", // 冰晶蓝底
    "#D9E8F5", // 边框
    "rgba(84, 160, 255, 0.18)",
    "linear-gradient(180deg, #82ccdd 0%, #54a0ff 100%)",
  ),

  // 3. 🍑 落日晚霞 (把橙色往粉色调一点，更有治愈感)
  makeTheme(
    "warm-peach",
    "落日晚霞",
    "#FF7675", // 珊瑚粉，比橙色更显精致
    "#D63031", // 深色态
    "#FFF9F9", // 极淡的樱花底
    "#F5E4E4", // 边框
    "rgba(255, 118, 117, 0.16)",
    "linear-gradient(180deg, #FAB1A0 0%, #FF7675 100%)",
  ),

  // 4. 🔮 薰衣草田 (新增：2024年最流行的丁香紫色调)
  makeTheme(
    "dreamy-purple",
    "薰衣草田",
    "#a29bfe", // 丁香紫
    "#6c5ce7", // 深紫色
    "#F8F7FF", // 极淡的紫底
    "#EBE9F5", // 边框
    "rgba(162, 155, 254, 0.18)",
    "linear-gradient(180deg, #D6D2FF 0%, #a29bfe 100%)",
  ),
];
/**
 * 导出默认主题与工具函数
 */
export const DEFAULT_THEME_ID: ThemeId = "fresh-green";
export const THEME_STORAGE_KEY = "mayfly-ledger-theme"; // 改为你的新名字

export const getThemeById = (id: ThemeId): AppTheme => {
  return themeOptions.find((theme) => theme.id === id) || themeOptions[0];
};
