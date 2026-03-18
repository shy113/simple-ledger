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
.header-card {
  background: var(--theme-card-gradient);
  border: 1rpx solid var(--theme-border);
  border-radius: 40rpx;
  padding: 36rpx 32rpx 28rpx;
  color: var(--theme-text);
  box-shadow: var(--theme-card-shadow);
  margin-bottom: 24rpx;
  backdrop-filter: blur(20rpx);
}

.balance-amount {
  font-size: 70rpx;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: var(--theme-text);
  margin-bottom: 22rpx;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid rgba(215, 232, 221, 0.95);
  padding-top: 26rpx;
  margin-bottom: 18rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 26rpx;
  color: var(--theme-text-muted);
  margin-bottom: 8rpx;
}

.value {
  font-size: 34rpx;
  font-weight: 600;
}

.value.income {
  color: var(--theme-income);
}

.value.expense {
  color: var(--theme-expense);
}

.month-controls {
  display: flex;
  align-items: center;
  gap: 12rpx;
  justify-content: space-between;
}

.month-nav-btn {
  flex: 0 0 auto;
  min-width: 112rpx;
  height: 66rpx;
  padding: 0 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(180deg, rgba(240, 247, 242, 0.98) 0%, rgba(234, 244, 236, 0.98) 100%);
  color: var(--theme-text);
  font-size: 26rpx;
  line-height: 66rpx;
  text-align: center;
  font-weight: 600;
  border: 1rpx solid var(--theme-border);
}

.month-selector {
  min-width: 240rpx;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 248, 239, 0.98) 100%);
  border: 1rpx solid rgba(215, 232, 221, 0.95);
  box-shadow: 0 10rpx 22rpx rgba(52, 101, 65, 0.06);
}

.month-selector-text {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-text);
  line-height: 1;
}

.month-selector-icon {
  font-size: 20rpx;
  color: var(--theme-text-muted);
  transform: translateY(2rpx);
}
</style>
