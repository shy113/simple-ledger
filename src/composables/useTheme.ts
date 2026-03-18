import { computed, ref } from 'vue';
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, getThemeById, themeOptions, type ThemeId } from '../theme';

const currentThemeId = ref<ThemeId>(DEFAULT_THEME_ID);
let initialized = false;

const ensureThemeLoaded = () => {
  if (initialized) return;
  initialized = true;

  const stored = uni.getStorageSync(THEME_STORAGE_KEY);
  if (stored && themeOptions.some((theme) => theme.id === stored)) {
    currentThemeId.value = stored as ThemeId;
  }
};

export function useTheme() {
  ensureThemeLoaded();

  const theme = computed(() => getThemeById(currentThemeId.value));
  const themeVars = computed(() => theme.value.vars);

  const setTheme = (id: ThemeId) => {
    currentThemeId.value = id;
    uni.setStorageSync(THEME_STORAGE_KEY, id);
  };

  return {
    currentThemeId,
    theme,
    themeVars,
    themeOptions,
    setTheme,
  };
}
