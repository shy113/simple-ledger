<template>
  <view class="header-card">
    <view class="balance-amount">¥ {{ (balance ?? 0).toFixed(2) }}</view>

    <view class="summary-row">
      <view class="summary-item">
        <text class="label">收入</text>
        <text class="value income">+{{ (income ?? 0).toFixed(2) }}</text>
      </view>
      <view class="summary-item">
        <text class="label">支出</text>
        <text class="value expense">-{{ (expense ?? 0).toFixed(2) }}</text>
      </view>
    </view>

    <view class="month-controls">
      <view class="month-nav-btn" @click="$emit('prev-month')">上一月</view>
      <picker mode="date" fields="month" :value="pickerValue" @change="$emit('pick-month', $event)">
        <view class="month-selector">
          <text class="month-selector-text">{{ periodLabel }}</text>
          <text class="month-selector-icon">▾</text>
        </view>
      </picker>
      <view class="month-nav-btn" @click="$emit('next-month')">下一月</view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  periodLabel: string;
  pickerValue: string;
  balance: number;
  income: number;
  expense: number;
}>();

defineEmits<{
  (e: 'prev-month'): void;
  (e: 'next-month'): void;
  (e: 'pick-month', event: any): void;
}>();
</script>

<style scoped>
.header-card { background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 252, 0.96) 100%); border: 1rpx solid rgba(229, 234, 241, 0.95); border-radius: 40rpx; padding: 36rpx 32rpx 28rpx; color: #2f3542; box-shadow: 0 18rpx 36rpx rgba(47, 53, 66, 0.06); margin-bottom: 24rpx; backdrop-filter: blur(20rpx); }
.balance-amount { font-size: 64rpx; font-weight: 700; color: #2f3542; margin-bottom: 22rpx; }
.summary-row { display: flex; justify-content: space-between; border-top: 1rpx solid #eef2f7; padding-top: 24rpx; margin-bottom: 18rpx; }
.summary-item { display: flex; flex-direction: column; }
.label { font-size: 24rpx; color: #a4b0be; margin-bottom: 8rpx; }
.value { font-size: 32rpx; font-weight: 600; }
.value.income { color: #55e6c1; }
.value.expense { color: #ff7675; }
.month-controls { display: flex; align-items: center; gap: 12rpx; justify-content: space-between; }
.month-nav-btn { flex: 0 0 auto; min-width: 112rpx; height: 66rpx; padding: 0 18rpx; border-radius: 20rpx; background: #eef2f7; color: #2f3542; font-size: 24rpx; line-height: 66rpx; text-align: center; font-weight: 600; }
.month-selector { min-width: 220rpx; height: 66rpx; display: flex; align-items: center; justify-content: center; gap: 8rpx; padding: 0 18rpx; border-radius: 20rpx; background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%); border: 1rpx solid #e8edf4; box-shadow: 0 8rpx 18rpx rgba(47, 53, 66, 0.04); }
.month-selector-text { font-size: 28rpx; font-weight: 700; color: #2f3542; line-height: 1; }
.month-selector-icon { font-size: 18rpx; color: #a4b0be; transform: translateY(2rpx); }
</style>