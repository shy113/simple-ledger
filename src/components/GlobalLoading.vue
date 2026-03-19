<script setup lang="ts">
import { useLoading } from '../composables/useLoading';

const { isLoading, loadingText } = useLoading();
</script>

<template>
  <view v-if="isLoading" class="global-loading-mask" @touchmove.stop.prevent>
    <view class="loading-content">
      <view class="spinner"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.global-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 50rpx;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 20rpx;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  color: #ffffff;
  font-size: 28rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
