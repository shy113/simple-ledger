<template>
  <view class="stats-container">
    <view class="stats-header">
      <view>
        <text class="stats-title">收支分析</text>
        <view class="stats-subtitle">{{ periodLabel }}</view>
      </view>
      <view class="month-selector">支出占比</view>
    </view>

    <view class="stats-card">
      <view class="card-head">按分类排行（支出）</view>
      <view v-if="categoryStats.length === 0" class="empty-stats">暂无支出数据</view>
      <view v-for="item in categoryStats" :key="item.name" class="stat-line">
        <view class="line-info">
          <text class="item-name">{{ item.icon }} {{ item.name }}</text>
          <text class="item-amount">¥{{ item.amount.toFixed(2) }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill expense-bg" :style="{ width: item.percent + '%' }"></view>
        </view>
      </view>
    </view>

    <view class="stats-card">
      <view class="card-head">按人物排行（支出）</view>
      <view v-if="personStats.length === 0" class="empty-stats">暂无支出数据</view>
      <view v-for="item in personStats" :key="item.name" class="stat-line">
        <view class="line-info">
          <text class="item-name">{{ item.avatar }} {{ item.name }}</text>
          <text class="item-amount">¥{{ item.amount.toFixed(2) }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill person-bg" :style="{ width: item.percent + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBills } from '../../composables/useBills';
import type { Bill } from '../../types';

const props = defineProps<{
  bills: Bill[];
  periodLabel: string;
}>();

const { categories, persons } = useBills();

const expenseBills = computed(() => props.bills.filter((bill) => bill.type === 'expense'));
const totalExpense = computed(() =>
  expenseBills.value.reduce((sum, bill) => sum + bill.amount, 0),
);

const categoryStats = computed(() => {
  if (totalExpense.value === 0) return [];

  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => {
    statsMap[bill.category] = (statsMap[bill.category] || 0) + bill.amount;
  });

  return Object.keys(statsMap)
    .map((name) => {
      const icon = categories.value.expense.find((cat) => cat.name === name)?.icon || '📒';
      return {
        name,
        icon,
        amount: statsMap[name],
        percent: (statsMap[name] / totalExpense.value) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);
});

const personStats = computed(() => {
  if (totalExpense.value === 0) return [];

  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => {
    statsMap[bill.personName] = (statsMap[bill.personName] || 0) + bill.amount;
  });

  return Object.keys(statsMap)
    .map((name) => {
      const avatar = persons.value.find((person) => person.name === name)?.avatar || '👤';
      return {
        name,
        avatar,
        amount: statsMap[name],
        percent: (statsMap[name] / totalExpense.value) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);
});
</script>

<style scoped>
.stats-container {
  padding-bottom: 40rpx;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 40rpx 0 30rpx;
}

.stats-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #333;
}

.stats-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.month-selector {
  font-size: 24rpx;
  color: #666;
  background: #eee;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
}

.stats-card {
  background: white;
  border-radius: 40rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
}

.card-head {
  font-size: 28rpx;
  font-weight: 600;
  color: #999;
  margin-bottom: 30rpx;
}

.stat-line {
  margin-bottom: 30rpx;
}

.line-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.item-name {
  font-size: 28rpx;
  color: #333;
}

.item-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.progress-bar {
  height: 12rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

.expense-bg {
  background: #ff7f50;
}

.person-bg {
  background: #007aff;
}

.empty-stats {
  text-align: center;
  padding: 40rpx;
  color: #ccc;
  font-size: 26rpx;
}
</style>
