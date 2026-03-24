<template>
  <view class="skeleton-wrap">
    <!-- 模拟 3 张账单卡片骨架 -->
    <view v-for="i in count" :key="i" class="skeleton-item">
      <view class="sk-icon"></view>
      <view class="sk-body">
        <view class="sk-line sk-line-title"></view>
        <view class="sk-line sk-line-sub"></view>
      </view>
      <view class="sk-amount"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
const { count = 5 } = defineProps<{ count?: number }>();
</script>

<style scoped>
.skeleton-wrap {
  padding: 48rpx 24rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border: 1rpx solid var(--theme-border);
  border-radius: 32rpx;
  background: transparent;
}

/* 图标占位 */
.sk-icon {
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
  background: var(--theme-surface-soft);
  animation: shimmer 1.4s ease-in-out infinite;
}

/* 文字区占位 */
.sk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.sk-line {
  border-radius: 999rpx;
  background: var(--theme-surface-soft);
  animation: shimmer 1.4s ease-in-out infinite;
}

.sk-line-title {
  width: 55%;
  height: 28rpx;
}

.sk-line-sub {
  width: 35%;
  height: 22rpx;
  animation-delay: 0.15s;
}

/* 金额占位 */
.sk-amount {
  width: 120rpx;
  height: 32rpx;
  border-radius: 999rpx;
  background: var(--theme-surface-soft);
  margin-left: 14rpx;
  flex-shrink: 0;
  animation: shimmer 1.4s ease-in-out infinite;
  animation-delay: 0.1s;
}

@keyframes shimmer {
  0%   { opacity: 1; }
  50%  { opacity: 0.35; }
  100% { opacity: 1; }
}
</style>
