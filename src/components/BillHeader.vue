<template>
  <view class="header-card">
    <view class="card-title">当前结余</view>
    <view class="balance-amount">¥ {{ (balance ?? 0).toFixed(2) }}</view>
    <view class="summary-row">
      <view class="summary-item">
        <text class="label">本月收入</text>
        <text class="value income">+{{ (income ?? 0).toFixed(2) }}</text>
      </view>
      <view class="summary-item">
        <text class="label">本月支出</text>
        <text class="value expense">-{{ (expense ?? 0).toFixed(2) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 头部总览卡片组件
 */
defineProps<{
  balance: number;
  income: number;
  expense: number;
}>();
</script>

<style scoped>
.header-card {
  background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
  border-radius: 40rpx;
  padding: 50rpx 40rpx;
  color: white;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
  margin-bottom: 50rpx;
}

.card-title {
  font-size: 28rpx;
  opacity: 0.7;
  margin-bottom: 10rpx;
}
.balance-amount {
  font-size: 64rpx;
  font-weight: 700;
  margin-bottom: 40rpx;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
  padding-top: 30rpx;
}
.summary-item {
  display: flex;
  flex-direction: column;
}
.label {
  font-size: 24rpx;
  opacity: 0.6;
  margin-bottom: 8rpx;
}
.value {
  font-size: 32rpx;
  font-weight: 600;
}
.value.income {
  color: #2ecc71;
}
.value.expense {
  color: #ff7f50;
}
</style>
