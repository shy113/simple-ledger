/**
 * 蜉蝣简账 - 全局主题配置系统
 */

export type ThemeId = "fresh-green" | "macaron-blue" | "warm-peach";

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
  // 1. 清新绿主题 - 森林氧气感
  makeTheme(
    "fresh-green",
    "清新绿",
    "#32C26B", // 主色
    "#269A54", // 深色态
    "#F0FDF4", // 浅绿底（解决了之前绿底太重的问题）
    "#DCF2E3", // 绿调边框（不脏，很清透）
    "rgba(50, 194, 107, 0.12)", // 绿色投影
    "linear-gradient(180deg, #8CE6A7 0%, #32C26B 100%)",
  ),

  // 2. 马卡龙蓝主题 - 纯净天空感
  makeTheme(
    "macaron-blue",
    "马卡龙蓝",
    "#74B9FF", // 主色
    "#4C95E8", // 深色态
    "#F0F7FF", // 纯净蓝底
    "#D6E9FF", // 蓝调边框
    "rgba(116, 185, 255, 0.15)", // 蓝色投影（会有淡淡的发光感）
    "linear-gradient(180deg, #A8D5FF 0%, #74B9FF 100%)",
  ),

  // 3. 暖桃橙主题 - 治愈夕阳感
  makeTheme(
    "warm-peach",
    "暖桃橙",
    "#FFB86B", // 主色
    "#F28B3C", // 深色态
    "#FFF7ED", // 暖橙底
    "#FFEDD5", // 橙调边框
    "rgba(255, 184, 107, 0.15)", // 橙色投影
    "linear-gradient(180deg, #FFD1A1 0%, #FFB86B 100%)",
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
