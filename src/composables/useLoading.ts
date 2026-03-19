import { ref } from 'vue';

const isLoading = ref(false);
const loadingText = ref('加载中...');

/**
 * 全局加载控制 Hook
 */
export function useLoading() {
  /**
   * 显示加载
   * @param text 加载提示文字
   */
  const showLoading = (text = '加载中...') => {
    loadingText.value = text;
    isLoading.value = true;
  };

  /**
   * 隐藏加载
   */
  const hideLoading = () => {
    isLoading.value = false;
  };

  return {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
  };
}
