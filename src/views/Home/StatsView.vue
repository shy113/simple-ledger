<template>
  <view class="stats-container">
    <view class="stats-card">
      <view class="card-head">按分类排行（支出）</view>
      <view v-if="categoryStats.length === 0" class="empty-stats">暂无支出数据</view>
      <view
        v-for="item in categoryStats"
        :key="item.name"
        class="stat-line clickable"
        @click="openDetail('category', item.name)"
      >
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
      <view
        v-for="item in personStats"
        :key="item.name"
        class="stat-line clickable"
        @click="openDetail('person', item.name)"
      >
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

const props = defineProps<{ bills: Bill[]; periodKey: string }>();

const { categories, persons } = useBills();

const expenseBills = computed(() => props.bills.filter((bill) => bill.type === 'expense'));
const totalExpense = computed(() => expenseBills.value.reduce((sum, bill) => sum + bill.amount, 0));

const categoryStats = computed(() => {
  if (totalExpense.value === 0) return [];
  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => {
    statsMap[bill.category] = (statsMap[bill.category] || 0) + bill.amount;
  });
  return Object.keys(statsMap)
    .map((name) => ({
      name,
      icon: categories.value.expense.find((cat) => cat.name === name)?.icon || '📒',
      amount: statsMap[name],
      percent: (statsMap[name] / totalExpense.value) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
});

const personStats = computed(() => {
  if (totalExpense.value === 0) return [];
  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => {
    statsMap[bill.personName] = (statsMap[bill.personName] || 0) + bill.amount;
  });
  return Object.keys(statsMap)
    .map((name) => ({
      name,
      avatar: persons.value.find((person) => person.name === name)?.avatar || '👤',
      amount: statsMap[name],
      percent: (statsMap[name] / totalExpense.value) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
});

const openDetail = (kind: 'category' | 'person', name: string) => {
  const query = `kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}&month=${encodeURIComponent(props.periodKey)}`;
  uni.navigateTo({ url: `/pages/stats-detail/index?${query}` });
};
</script>

<style scoped>
.stats-container { padding-bottom: 40rpx; }
.stats-card { background: var(--theme-card-gradient); border: 1rpx solid var(--theme-border); border-radius: 36rpx; padding: 34rpx 30rpx; margin-bottom: 24rpx; box-shadow: var(--theme-card-shadow); backdrop-filter: blur(18rpx); }
.card-head { font-size: 28rpx; font-weight: 700; color: var(--theme-text-muted); margin-bottom: 24rpx; letter-spacing: 0.02em; }
.stat-line { margin-bottom: 24rpx; padding: 14rpx 14rpx 16rpx; border-radius: 22rpx; }
.stat-line:last-child { margin-bottom: 0; }
.clickable { transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease; }
.clickable:active { transform: scale(0.995); opacity: 0.95; background: var(--theme-primary-soft); }
.line-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.item-name { font-size: 30rpx; color: var(--theme-text); font-weight: 700; }
.item-amount { font-size: 30rpx; font-weight: 700; color: var(--theme-text); }
.progress-bar { height: 10rpx; background: var(--theme-surface-soft); border-radius: 999rpx; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; transition: width 0.6s ease; }
.expense-bg { background: linear-gradient(90deg, var(--theme-expense) 0%, var(--theme-expense-soft) 100%); }
.person-bg { background: linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-primary-soft) 100%); }
.empty-stats { text-align: center; padding: 36rpx 22rpx; color: var(--theme-text-muted); font-size: 28rpx; }
</style>


