export type ThemeId = 'fresh-green' | 'macaron-blue' | 'warm-peach';

export type ThemeVars = Record<string, string>;

export interface AppTheme {
  id: ThemeId;
  name: string;
  vars: ThemeVars;
}

const baseText = '#1F2937';
const baseTextMuted = '#667085';
const baseExpense = '#E85C5C';
const baseIncome = '#2ABF96';

const makeTheme = (
  id: ThemeId,
  name: string,
  primary: string,
  primaryStrong: string,
  primarySoft: string,
  accentAmbient: string,
  fabGradient: string,
): AppTheme => ({
  id,
  name,
  vars: {
    '--theme-page-bg': '#EEF7F0',
    '--theme-page-bg-alt': '#E7F2EB',
    '--theme-surface': 'rgba(248, 252, 249, 0.94)',
    '--theme-surface-strong': 'rgba(255, 255, 255, 0.98)',
    '--theme-surface-soft': 'rgba(240, 247, 242, 0.98)',
    '--theme-border': 'rgba(202, 222, 210, 0.98)',
    '--theme-text': baseText,
    '--theme-text-muted': baseTextMuted,
    '--theme-primary': primary,
    '--theme-primary-strong': primaryStrong,
    '--theme-primary-soft': primarySoft,
    '--theme-accent-ambient': accentAmbient,
    '--theme-fab-gradient': fabGradient,
    '--theme-card-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 248, 243, 0.98) 100%)',
    '--theme-card-shadow': '0 18rpx 40rpx rgba(52, 101, 65, 0.10)',
    '--theme-income': baseIncome,
    '--theme-expense': baseExpense,
    '--theme-income-soft': 'rgba(42, 191, 150, 0.16)',
    '--theme-expense-soft': 'rgba(232, 92, 92, 0.14)',
  },
});

export const themeOptions: AppTheme[] = [
  makeTheme(
    'fresh-green',
    '清新绿',
    '#32C26B',
    '#269A54',
    'rgba(50, 194, 107, 0.20)',
    'rgba(50, 194, 107, 0.18)',
    'linear-gradient(180deg, #8CE6A7 0%, #32C26B 100%)',
  ),
  makeTheme(
    'macaron-blue',
    '马卡龙蓝',
    '#74B9FF',
    '#4C95E8',
    'rgba(116, 185, 255, 0.14)',
    'rgba(116, 185, 255, 0.14)',
    'linear-gradient(180deg, #8CC8FF 0%, #74B9FF 100%)',
  ),
  makeTheme(
    'warm-peach',
    '暖桃橙',
    '#FFB86B',
    '#F28B3C',
    'rgba(255, 184, 107, 0.16)',
    'rgba(255, 184, 107, 0.16)',
    'linear-gradient(180deg, #FFC98A 0%, #FFB86B 100%)',
  ),
];

export const DEFAULT_THEME_ID: ThemeId = 'fresh-green';
export const THEME_STORAGE_KEY = 'simple-ledger-theme';

export const getThemeById = (id: ThemeId) => themeOptions.find((theme) => theme.id === id) || themeOptions[0];
