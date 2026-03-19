<template>
  <view class="header-card">
    <view class="balance-area clickable" @click="$emit('click-balance')">
      <view class="balance-label">本月结余</view>
      <view class="balance-amount">¥ {{ (balance ?? 0).toFixed(2) }}</view>
    </view>

    <view class="summary-row">
      <view class="summary-item clickable" @click="$emit('click-income')">
        <text class="label">收入</text>
        <text class="value income">+{{ (income ?? 0).toFixed(2) }}</text>
      </view>
      <view class="summary-item clickable" @click="$emit('click-expense')">
        <text class="label">支出</text>
        <text class="value expense">-{{ (expense ?? 0).toFixed(2) }}</text>
      </view>
    </view>

    <view class="month-controls">
      <view class="month-nav-btn clickable" @click.stop="$emit('prev-month')">上一月</view>
      <picker
        mode="date"
        fields="month"
        :value="pickerValue"
        @change="$emit('pick-month', $event)"
      >
        <view class="month-selector clickable">
          <text class="month-selector-text">{{ periodLabel }}</text>
          <text class="month-selector-icon">▾</text>
        </view>
      </picker>
      <view class="month-nav-btn clickable" @click.stop="$emit('next-month')">下一月</view>
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
  (e: "prev-month"): void;
  (e: "next-month"): void;
  (e: "pick-month", event: any): void;
  (e: "click-balance"): void;
  (e: "click-income"): void;
  (e: "click-expense"): void;
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

.balance-area {
  margin-bottom: 22rpx;
  padding: 10rpx;
  margin: -10rpx -10rpx 12rpx -10rpx;
  border-radius: 20rpx;
}

.balance-label {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  margin-bottom: 4rpx;
}

.balance-amount {
  font-size: 70rpx;
  font-weight: bold;
  letter-spacing: 0.01em;
  color: var(--theme-text);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid rgba(215, 232, 221, 0.95);
  padding-top: 20rpx;
  margin-bottom: 18rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 12rpx 24rpx;
  margin: -12rpx;
  border-radius: 20rpx;
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
  background: var(--theme-fab-gradient);
  color: rgba(255, 255, 255, 0.94);
  font-size: 26rpx;
  line-height: 66rpx;
  text-align: center;
  font-weight: 600;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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
  background: var(--theme-fab-gradient);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.05);
}

.month-selector-text {
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.96);
  line-height: 1;
}

.month-selector-icon {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  transform: translateY(2rpx);
}
</style>
