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

const props = defineProps<{
  bills: Bill[];
  periodKey: string;
}>();

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
.stats-card { background: rgba(255, 255, 255, 0.82); border: 1rpx solid rgba(229, 234, 241, 0.95); border-radius: 36rpx; padding: 32rpx 28rpx; margin-bottom: 24rpx; box-shadow: 0 16rpx 36rpx rgba(47, 53, 66, 0.04); backdrop-filter: blur(18rpx); }
.card-head { font-size: 24rpx; font-weight: 700; color: #a4b0be; margin-bottom: 22rpx; letter-spacing: 0.02em; }
.stat-line { margin-bottom: 22rpx; padding: 14rpx 14rpx 16rpx; border-radius: 22rpx; }
.stat-line:last-child { margin-bottom: 0; }
.clickable { transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease; }
.clickable:active { transform: scale(0.995); opacity: 0.95; background: rgba(47, 53, 66, 0.02); }
.line-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.item-name { font-size: 28rpx; color: #2f3542; font-weight: 600; }
.item-amount { font-size: 28rpx; font-weight: 700; color: #2f3542; }
.progress-bar { height: 10rpx; background: #edf1f6; border-radius: 999rpx; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; transition: width 0.6s ease; }
.expense-bg { background: linear-gradient(90deg, #ff7675 0%, #ff9aa2 100%); }
.person-bg { background: linear-gradient(90deg, #55e6c1 0%, #74b9ff 100%); }
.empty-stats { text-align: center; padding: 34rpx 20rpx; color: #a4b0be; font-size: 26rpx; }
</style>