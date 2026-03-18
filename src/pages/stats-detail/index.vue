<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-kicker">统计明细</view>
      <view class="hero-title">{{ title }}</view>
      <view class="hero-subtitle">{{ monthText }}</view>
    </view>

    <view class="summary-card">
      <view class="summary-item">
        <text class="summary-label">账单数</text>
        <text class="summary-value">{{ detailBills.length }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">总金额</text>
        <text class="summary-value">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
    </view>

    <view class="list-card">
      <view v-if="detailBills.length === 0" class="empty-state">没有找到匹配的账单</view>
      <view v-else class="bill-list">
        <view v-for="bill in detailBills" :key="bill.id" class="bill-item">
          <view class="bill-main">
            <view class="bill-name-row">
              <text class="bill-name">{{ bill.category }}</text>
              <text class="bill-person">{{ bill.personName }}</text>
            </view>
            <text class="bill-meta">{{ bill.date }}{{ bill.note ? ' · ' + bill.note : '' }}</text>
          </view>
          <text class="bill-amount">-{{ bill.amount.toFixed(2) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useBills } from '../../composables/useBills';
import { formatMonthLabel } from '../../utils/dateHelper';
import type { Bill } from '../../types';

const { bills: allBills } = useBills();

const kind = ref<'category' | 'person'>('category');
const name = ref('');
const monthKey = ref('');

onLoad((query) => {
  const params = query || {};
  kind.value = params.kind === 'person' ? 'person' : 'category';
  name.value = typeof params.name === 'string' ? decodeURIComponent(params.name) : '';
  monthKey.value = typeof params.month === 'string' ? decodeURIComponent(params.month) : '';
});

const detailBills = computed<Bill[]>(() => {
  if (!name.value) return [];

  const matched = allBills.value.filter((bill) => {
    const billMonth = String(bill.date).slice(0, 7);
    if (monthKey.value && billMonth !== monthKey.value) return false;
    return kind.value === 'category'
      ? bill.category === name.value
      : bill.personName === name.value;
  });

  return [...matched].sort((a, b) => b.amount - a.amount);
});

const title = computed(() => {
  if (!name.value) return '明细';
  return kind.value === 'category' ? `${name.value} 分类明细` : `${name.value} 人物明细`;
});

const monthText = computed(() => (monthKey.value ? formatMonthLabel(monthKey.value) : '全部月份'));
const totalAmount = computed(() => detailBills.value.reduce((sum, bill) => sum + bill.amount, 0));
</script>

<style scoped>
.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.9) 0, rgba(255, 255, 255, 0) 34%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
  padding: 24rpx;
  box-sizing: border-box;
}

.hero-card,
.summary-card,
.list-card {
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(229, 234, 241, 0.9);
  border-radius: 36rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 36rpx rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(18rpx);
}

.hero-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 249, 252, 0.96) 100%);
}

.hero-kicker {
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 10rpx;
}

.hero-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10rpx;
}

.hero-subtitle {
  font-size: 24rpx;
  color: #64748b;
}

.summary-card {
  display: flex;
  justify-content: space-between;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 8rpx;
}

.summary-value {
  font-size: 34rpx;
  font-weight: 700;
  color: #0f172a;
}

.bill-list {
  display: flex;
  flex-direction: column;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eef2f7;
}

.bill-item:last-child {
  border-bottom: none;
}

.bill-main {
  flex: 1;
  min-width: 0;
}

.bill-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}

.bill-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.bill-person {
  font-size: 20rpx;
  color: #64748b;
  padding: 6rpx 10rpx;
  border-radius: 999rpx;
  background: #f3f6fb;
}

.bill-meta {
  font-size: 22rpx;
  color: #94a3b8;
}

.bill-amount {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
  margin-left: 20rpx;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 60rpx 20rpx;
  font-size: 26rpx;
}
</style>