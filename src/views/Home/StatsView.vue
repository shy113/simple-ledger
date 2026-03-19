<template>
  <view class="stats-container">
    <!-- 1. 统计维度切换 -->
    <view class="mode-toggle">
      <view
        :class="['mode-item', statMode === 'month' ? 'active' : '']"
        @click="statMode = 'month'"
      >
        月度(支出)
      </view>
      <view
        :class="['mode-item', statMode === 'year' ? 'active' : '']"
        @click="statMode = 'year'"
      >
        年度(支出)
      </view>
    </view>

    <!-- 2. 年度特有视图 -->
    <view v-if="statMode === 'year'">
      <!-- ① 年度关键词看板 (Annual Insights) -->
      <view class="insights-grid">
        <view class="insight-card">
          <view class="insight-icon">🔥</view>
          <view class="insight-content">
            <text class="insight-label">月度最高</text>
            <text class="insight-value">{{ insights.maxMonth.month }}月</text>
            <text class="insight-desc">¥{{ insights.maxMonth.amount.toFixed(0) }}</text>
          </view>
        </view>
        <view class="insight-card">
          <view class="insight-icon">🎯</view>
          <view class="insight-content">
            <text class="insight-label">最常消费</text>
            <text class="insight-value">{{ insights.topCategory.name }}</text>
            <text class="insight-desc">占比 {{ insights.topCategory.percent.toFixed(0) }}%</text>
          </view>
        </view>
        <view class="insight-card">
          <view class="insight-icon">🍃</view>
          <view class="insight-content">
            <text class="insight-label">勤俭节约</text>
            <text class="insight-value">{{ insights.minMonth.month }}月</text>
            <text class="insight-desc">¥{{ insights.minMonth.amount.toFixed(0) }}</text>
          </view>
        </view>
      </view>

      <!-- ② 年度趋势图 (Trend Chart) -->
      <view class="stats-card">
        <view class="card-head">年度趋势</view>
        <view class="chart-container">
          <view
            v-for="item in monthlyTrend"
            :key="item.month"
            class="chart-bar-wrap"
          >
            <view class="bar-outer">
              <view
                class="bar-inner"
                :class="{ 'is-max': item.isMax }"
                :style="{ height: item.height + '%' }"
              >
                <text v-if="item.isMax && item.amount > 0" class="bar-tooltip">¥{{ item.amount.toFixed(0) }}</text>
              </view>
            </view>
            <text class="bar-label">{{ item.month }}月</text>
          </view>
        </view>
      </view>

      <!-- ③ 月度摘要列表 (Monthly Summary List) -->
      <view class="stats-card">
        <view class="card-head">月度摘要</view>
        <view v-if="monthlyTrend.filter(i => i.amount > 0).length === 0" class="empty-stats">暂无年度数据</view>
        <view
          v-for="item in monthlyTrend.filter(i => i.amount > 0).slice().reverse()"
          :key="item.month"
          class="stat-line"
        >
          <view class="line-info">
            <text class="item-name">{{ item.month }}月</text>
            <text class="item-amount">¥{{ item.amount.toFixed(2) }}</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill expense-bg" :style="{ width: (item.amount / insights.totalYearExpense * 100) + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 3. 通用排行视图 (自动适配月/年) -->
    <view class="stats-card">
      <view class="card-head">分类排行</view>
      <view v-if="categoryStats.length === 0" class="empty-stats">暂无数据</view>
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
      <view class="card-head">成员排行</view>
      <view v-if="memberStats.length === 0" class="empty-stats">暂无数据</view>
      <view
        v-for="item in memberStats"
        :key="item.name"
        class="stat-line clickable"
        @click="openDetail('person', item.name)"
      >
        <view class="line-info">
          <text class="item-name">{{ item.avatar }} {{ item.name }}</text>
          <text class="item-amount">¥{{ item.amount.toFixed(2) }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill member-bg" :style="{ width: item.percent + '%' }"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBills } from '../../composables/useBills';
import { getMonthKeyFromDate } from '../../utils/dateHelper';
import type { Bill } from '../../types';

const props = defineProps<{ allBills: Bill[]; periodKey: string }>();

const { categories, persons } = useBills();

// 统计维度状态：'month' | 'year'
const statMode = ref<'month' | 'year'>('month');

// 计算当前选择的年份
const currentYear = computed(() => props.periodKey.split('-')[0]);

// 过滤出当前年份的所有账单
const yearBills = computed(() => {
  return props.allBills.filter(bill => String(bill.date).startsWith(currentYear.value));
});

// 过滤出当前月份的所有账单
const monthBills = computed(() => {
  return props.allBills.filter(bill => getMonthKeyFromDate(String(bill.date)) === props.periodKey);
});

// 根据模式选择账单数据
const currentBills = computed(() => {
  return statMode.value === 'month' ? monthBills.value : yearBills.value;
});

// 账单过滤 (由于统计聚焦在支出，这里默认处理支出类型)
const expenseBills = computed(() => currentBills.value.filter((bill) => bill.type === 'expense'));
const totalExpense = computed(() => expenseBills.value.reduce((sum, bill) => sum + bill.amount, 0));

// 12 个月的趋势计算
const monthlyTrend = computed(() => {
  const year = currentYear.value;
  const trend = [];
  let maxAmount = 0;

  for (let m = 1; m <= 12; m++) {
    const monthStr = `${year}-${String(m).padStart(2, '0')}`;
    const amount = yearBills.value
      .filter(bill => {
        const bDate = String(bill.date || '').trim();
        return bill.type === 'expense' && bDate.startsWith(monthStr);
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    if (amount > maxAmount) maxAmount = amount;
    trend.push({ month: m, amount });
  }

  return trend.map(item => {
    let height = 0;
    if (maxAmount > 0 && item.amount > 0) {
      height = Math.max(4, (item.amount / maxAmount) * 100);
    }
    return {
      ...item,
      height,
      isMax: maxAmount > 0 && item.amount === maxAmount
    };
  });
});

// 年度看板数据
const insights = computed(() => {
  const trend = monthlyTrend.value;
  const totalYearExpense = trend.reduce((sum, item) => sum + item.amount, 0);
  
  // 支出最高月
  const maxMonth = [...trend].sort((a, b) => b.amount - a.amount)[0];
  
  // 支出最低月 (有支出的月份中)
  const activeMonths = trend.filter(item => item.amount > 0);
  const minMonth = activeMonths.length > 0 
    ? [...activeMonths].sort((a, b) => a.amount - b.amount)[0] 
    : trend[0];

  // 最常消费分类
  const catMap: Record<string, number> = {};
  yearBills.value.filter(b => b.type === 'expense').forEach(b => {
    catMap[b.category] = (catMap[b.category] || 0) + b.amount;
  });
  const topCatName = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || '无';
  const topCatAmount = catMap[topCatName] || 0;

  return {
    totalYearExpense,
    maxMonth,
    minMonth,
    topCategory: {
      name: topCatName,
      percent: totalYearExpense > 0 ? (topCatAmount / totalYearExpense) * 100 : 0
    }
  };
});

// 分类排行
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

// 成员排行
const memberStats = computed(() => {
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

/* 维度切换 */
.mode-toggle {
  display: flex;
  gap: 12rpx;
  margin-bottom: 30rpx;
}
.mode-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: var(--theme-text-muted);
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  transition: all 0.24s ease;
}
.mode-item.active {
  color: var(--theme-primary);
  font-weight: 700;
  background: var(--theme-surface-strong);
  border-color: var(--theme-primary);
  box-shadow: 0 6rpx 16rpx rgba(52, 101, 65, 0.08);
}

/* 年度看板 */
.insights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 30rpx;
}
.insight-card {
  background: var(--theme-insight-card-bg);
  border: 1rpx solid var(--theme-border);
  border-radius: 28rpx;
  padding: 20rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
}
.insight-icon {
  width: 64rpx;
  height: 64rpx;
  background: var(--theme-insight-icon-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-bottom: 12rpx;
}
.insight-content {
  text-align: center;
  display: flex;
  flex-direction: column;
}
.insight-label { font-size: 20rpx; color: var(--theme-text-muted); margin-bottom: 4rpx; }
.insight-value { font-size: 26rpx; font-weight: 700; color: var(--theme-text); }
.insight-desc { font-size: 20rpx; color: var(--theme-text-muted); margin-top: 2rpx; }

/* 趋势图 */
.chart-container {
  height: 240rpx;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 40rpx 10rpx 10rpx;
}
.chart-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar-outer {
  width: 24rpx;
  height: 160rpx;
  background: #f0f2f5;
  border-radius: 999rpx;
  display: flex;
  align-items: flex-end;
  position: relative;
  overflow: visible;
}
.bar-inner {
  width: 100%;
  background-color: var(--theme-primary);
  border-radius: 999rpx;
  transition: height 1s cubic-bezier(0.165, 0.84, 0.44, 1);
  position: relative;
  opacity: 0.3;
}
.bar-inner.is-max {
  opacity: 1;
  background-color: var(--theme-primary);
}
.bar-tooltip {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20rpx;
  color: var(--theme-primary);
  white-space: nowrap;
  font-weight: 700;
  z-index: 5;
}
.bar-label {
  font-size: 18rpx;
  color: var(--theme-text-muted);
  margin-top: 12rpx;
}

/* 通用卡片与排行 */
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
.member-bg { background: linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-primary-soft) 100%); }
.empty-stats { text-align: center; padding: 36rpx 22rpx; color: var(--theme-text-muted); font-size: 28rpx; }
</style>
