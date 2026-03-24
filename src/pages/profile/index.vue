<script setup lang="ts">
import { useTheme } from "../../composables/useTheme";

const { themeVars } = useTheme();
</script>

<template>
  <view class="page" :style="themeVars">
    <view class="ambient ambient-a"></view>
    <view class="ambient ambient-b"></view>

    <view class="content-card">
      <text class="title">TODO</text>
    </view>
  </view>
</template>

<style>
page {
  height: 100%;
  background: var(--theme-page-bg);
}

.page {
  position: relative;
  min-height: 100%;
  padding: 32rpx;
  box-sizing: border-box;
  background:
    radial-gradient(
      circle at top right,
      rgba(162, 155, 254, 0.16) 0,
      rgba(255, 255, 255, 0) 36%
    ),
    linear-gradient(
      180deg,
      var(--theme-page-bg) 0%,
      var(--theme-page-bg-alt) 100%
    );
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(24rpx);
  pointer-events: none;
}

.ambient-a {
  width: 300rpx;
  height: 300rpx;
  top: 80rpx;
  right: -80rpx;
  background: rgba(65, 184, 131, 0.12);
}

.ambient-b {
  width: 360rpx;
  height: 360rpx;
  left: -120rpx;
  bottom: 160rpx;
  background: rgba(162, 155, 254, 0.12);
}

.content-card {
  position: relative;
  z-index: 1;
  margin-top: 48rpx;
  padding: 40rpx 36rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.94);
  box-shadow: 0 18rpx 36rpx rgba(109, 120, 139, 0.12);
  backdrop-filter: blur(16rpx);
}

.title {
  display: block;
  font-size: 42rpx;
  font-weight: 800;
  color: var(--theme-text);
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--theme-text-muted);
}
</style>
