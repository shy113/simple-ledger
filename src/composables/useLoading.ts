import { ref } from 'vue';

const isLoading = ref(false);
const loadingText = ref('加载中...');
/** 骨架屏：数据首次载入中 */
const isSkeleton = ref(false);

/**
 * 全局加载控制 Hook
 */
export function useLoading() {
  /**
   * 显示全屏 loading（页面跳转等场景）
   * @param text 加载提示文字
   */
  const showLoading = (text = '加载中...') => {
    loadingText.value = text;
    isLoading.value = true;
  };

  /**
   * 隐藏全屏 loading
   */
  const hideLoading = () => {
    isLoading.value = false;
  };

  /** 显示骨架屏 */
  const showSkeleton = () => { isSkeleton.value = true; };
  /** 隐藏骨架屏 */
  const hideSkeleton = () => { isSkeleton.value = false; };

  return {
    isLoading,
    loadingText,
    isSkeleton,
    showLoading,
    hideLoading,
    showSkeleton,
    hideSkeleton,
  };
}
