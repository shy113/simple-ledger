<template>
  <view
    v-if="modelValue"
    class="modal-mask"
    @click="$emit('update:modelValue', false)"
  >
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">支持项目</text>
        <text class="close-btn" @click="$emit('update:modelValue', false)"
          >×</text
        >
      </view>

      <text class="modal-desc">若对你有帮助，欢迎请我喝杯咖啡 ☕</text>

      <view class="qr-card">
        <image class="qr-image" :src="qrImage" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import qrImage from "../../static/donate-qr.png";

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(47, 53, 66, 0.56);
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(241, 249, 243, 0.98) 100%
  );
  border-radius: 42rpx 42rpx 0 0;
  padding: 34rpx 34rpx 40rpx;
  box-shadow: 0 -14rpx 40rpx rgba(47, 53, 66, 0.12);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.modal-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--theme-text);
}

.close-btn {
  font-size: 40rpx;
  color: var(--theme-text-muted);
  padding: 8rpx 12rpx;
}

.modal-desc {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--theme-text-muted);
  margin-bottom: 22rpx;
}

.qr-card {
  background: white;
  border-radius: 36rpx;
  padding: 22rpx;
  border: 1rpx solid rgba(215, 232, 221, 0.95);
  box-shadow: 0 18rpx 40rpx rgba(52, 101, 65, 0.08);
}

.qr-image {
  width: 100%;
  height: 620rpx;
  border-radius: 28rpx;
}
</style>
