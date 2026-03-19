<template>
  <view class="stats-container">
    <view class="stats-content-wrap">
      <block v-if="totalExpense > 0">
        <!-- A. 年度特有视图 -->
        <view v-if="mode === 'year'">
          <!-- 专属年份选择器 -->
          <view class="year-nav-bar staggered-item" style="--delay: 0">
            <view class="year-nav-btn clickable" @click="$emit('shift-year', -1)">
              <text class="nav-arrow">◀</text>
              <text class="nav-text">上一年</text>
            </view>
            <view class="year-display">
              <text class="year-num">{{ currentYear }}</text>
              <text class="year-unit">年度统计</text>
            </view>
            <view class="year-nav-btn clickable" @click="$emit('shift-year', 1)">
              <text class="nav-text">下一年</text>
              <text class="nav-arrow">▶</text>
            </view>
          </view>

          <!-- ① 年度关键词看板 -->
          <view class="insights-grid staggered-item" style="--delay: 1">
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

          <!-- ② 年度趋势图 -->
          <view class="stats-card staggered-item" style="--delay: 2">
            <view class="card-head">年度趋势 (点击柱形可跳转)</view>
            <view class="chart-container">
              <view
                v-for="item in monthlyTrend"
                :key="item.month"
                class="chart-bar-wrap clickable"
                @click="item.amount > 0 && $emit('select-month', `${currentYear}-${String(item.month).padStart(2, '0')}`)"
              >
                <view class="bar-outer">
                  <view class="bar-inner" :class="{ 'is-max': item.isMax }" :style="{ height: item.height + '%' }">
                    <text v-if="item.isMax && item.amount > 0" class="bar-tooltip">¥{{ item.amount.toFixed(0) }}</text>
                  </view>
                </view>
                <text class="bar-label">{{ item.month }}月</text>
              </view>
            </view>
          </view>
        </view>

        <!-- B. 通用排行视图 -->
        <view class="stats-card staggered-item" :style="{ '--delay': mode === 'year' ? 3 : 1 }">
          <view class="card-head">分类排行</view>
          <view
            v-for="(item, index) in categoryStats"
            :key="item.name"
            class="stat-line staggered-item clickable"
            :style="{ '--delay': (mode === 'year' ? 3 : 1) + index * 0.1 }"
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

        <view class="stats-card staggered-item" :style="{ '--delay': mode === 'year' ? 4 : 2 }">
          <view class="card-head">成员排行</view>
          <view
            v-for="(item, index) in memberStats"
            :key="item.name"
            class="stat-line staggered-item clickable"
            :style="{ '--delay': (mode === 'year' ? 4 : 2) + index * 0.1 }"
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
      </block>

      <!-- 空白页占位 -->
      <view v-else class="empty-placeholder-card staggered-item" style="--delay: 1">
        <view class="empty-icon-wrap">
          <text class="empty-emoji">📝</text>
          <view class="empty-circle"></view>
        </view>
        <text class="empty-title">暂无支出记录</text>
        <text class="empty-tips">在这个{{ mode === 'year' ? '年' : '月' }}份，你还没有记过账呢</text>
        <view class="empty-footer">
          <text>保持记录，是为了更好地生活</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBills } from '../../composables/useBills';
import { useLoading } from '../../composables/useLoading';
import { getMonthKeyFromDate } from '../../utils/dateHelper';
import type { Bill } from '../../types';

const props = defineProps<{ allBills: Bill[]; periodKey: string; mode: 'month' | 'year' }>();
const { categories, persons } = useBills();
const { showLoading, hideLoading } = useLoading();

const currentYear = computed(() => props.periodKey.split('-')[0]);
const yearBills = computed(() => props.allBills.filter(bill => String(bill.date).startsWith(currentYear.value)));
const monthBills = computed(() => props.allBills.filter(bill => getMonthKeyFromDate(String(bill.date)) === props.periodKey));
const currentBills = computed(() => props.mode === 'month' ? monthBills.value : yearBills.value);
const expenseBills = computed(() => currentBills.value.filter((bill) => bill.type === 'expense'));
const totalExpense = computed(() => expenseBills.value.reduce((sum, bill) => sum + bill.amount, 0));

const monthlyTrend = computed(() => {
  const year = currentYear.value;
  const trend = [];
  let maxAmount = 0;
  for (let m = 1; m <= 12; m++) {
    const monthStr = `${year}-${String(m).padStart(2, '0')}`;
    const amount = yearBills.value.filter(bill => {
      const bDate = String(bill.date || '').trim();
      return bill.type === 'expense' && bDate.startsWith(monthStr);
    }).reduce((sum, bill) => sum + bill.amount, 0);
    if (amount > maxAmount) maxAmount = amount;
    trend.push({ month: m, amount });
  }
  return trend.map(item => {
    let height = 0;
    if (maxAmount > 0 && item.amount > 0) height = Math.max(4, (item.amount / maxAmount) * 100);
    return { ...item, height, isMax: maxAmount > 0 && item.amount === maxAmount };
  });
});

const insights = computed(() => {
  const trend = monthlyTrend.value;
  const totalYearExpense = trend.reduce((sum, item) => sum + item.amount, 0);
  const maxMonth = [...trend].sort((a, b) => b.amount - a.amount)[0];
  const activeMonths = trend.filter(item => item.amount > 0);
  const minMonth = activeMonths.length > 0 ? [...activeMonths].sort((a, b) => a.amount - b.amount)[0] : trend[0];
  const catMap: Record<string, number> = {};
  yearBills.value.filter(b => b.type === 'expense').forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + b.amount; });
  const topCatName = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || '无';
  const topCatAmount = catMap[topCatName] || 0;
  return { totalYearExpense, maxMonth, minMonth, topCategory: { name: topCatName, percent: totalYearExpense > 0 ? (topCatAmount / totalYearExpense) * 100 : 0 } };
});

const categoryStats = computed(() => {
  if (totalExpense.value === 0) return [];
  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => { statsMap[bill.category] = (statsMap[bill.category] || 0) + bill.amount; });
  return Object.keys(statsMap).map((name) => ({
    name,
    icon: categories.value.expense.find((cat) => cat.name === name)?.icon || '📒',
    amount: statsMap[name],
    percent: (statsMap[name] / totalExpense.value) * 100,
  })).sort((a, b) => b.amount - a.amount);
});

const memberStats = computed(() => {
  if (totalExpense.value === 0) return [];
  const statsMap: Record<string, number> = {};
  expenseBills.value.forEach((bill) => { statsMap[bill.personName] = (statsMap[bill.personName] || 0) + bill.amount; });
  return Object.keys(statsMap).map((name) => ({
    name,
    avatar: persons.value.find((p) => p.name === name)?.avatar || '👤',
    amount: statsMap[name],
    percent: (statsMap[name] / totalExpense.value) * 100,
  })).sort((a, b) => b.amount - a.amount);
});

const openDetail = (kind: 'category' | 'person', name: string) => {
  showLoading('请稍候...');
  // 如果是年度模式，传递年份(YYYY)；如果是月度模式，传递月份(YYYY-MM)
  const timeFilter = props.mode === 'year' ? currentYear.value : props.periodKey;
  const query = `kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}&month=${encodeURIComponent(timeFilter)}`;
  // 给一帧的时间让 loading 渲染
  setTimeout(() => {
    uni.navigateTo({
      url: `/pages/stats-detail/index?${query}`,
      complete: () => {
        // 跳转完成后的逻辑交给详情页处理
      }
    });
  }, 50);
};
</script>

<style scoped>
.stats-container { padding-bottom: 40rpx; }
.stats-content-wrap { display: flex; flex-direction: column; }

/* 年份导航样式 */
.year-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme-surface-strong);
  border: 1rpx solid var(--theme-border);
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.04);
}

.year-nav-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: var(--theme-surface);
  border-radius: 20rpx;
  border: 1rpx solid var(--theme-border);
}

.nav-arrow {
  font-size: 20rpx;
  color: var(--theme-primary);
}

.nav-text {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  font-weight: 700;
}

.year-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.year-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--theme-text);
  line-height: 1.1;
}

.year-unit {
  font-size: 20rpx;
  color: var(--theme-text-muted);
  letter-spacing: 2rpx;
}

/* 交错入场动画 */
.staggered-item {
  animation: itemFadeIn 0.45s ease-out both;
  animation-delay: calc(var(--delay) * 0.1s);
  will-change: opacity, transform;
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-placeholder-card { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; min-height: 800rpx; background: var(--theme-card-gradient); border: 1rpx solid var(--theme-border); border-radius: 42rpx; padding: 60rpx 40rpx; box-shadow: var(--theme-card-shadow); backdrop-filter: blur(20rpx); margin: 0 4rpx; }
.empty-icon-wrap { position: relative; width: 200rpx; height: 200rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 40rpx; }
.empty-emoji { font-size: 100rpx; z-index: 2; }
.empty-circle { position: absolute; width: 140rpx; height: 140rpx; background: var(--theme-primary-soft); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.2; } 100% { transform: scale(0.95); opacity: 0.5; } }
.empty-title { font-size: 36rpx; font-weight: 700; color: var(--theme-text); margin-bottom: 16rpx; }
.empty-tips { font-size: 26rpx; color: var(--theme-text-muted); margin-bottom: 80rpx; }
.empty-footer { border-top: 1rpx solid var(--theme-border); padding-top: 40rpx; width: 80%; text-align: center; }
.empty-footer text { font-size: 22rpx; color: var(--theme-text-muted); letter-spacing: 2rpx; font-style: italic; }

.insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 30rpx; }
.insight-card { background: var(--theme-insight-card-bg); border: 1rpx solid var(--theme-border); border-radius: 28rpx; padding: 20rpx 10rpx; display: flex; flex-direction: column; align-items: center; backdrop-filter: blur(10px); }
.insight-icon { width: 64rpx; height: 64rpx; background: var(--theme-insight-icon-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32rpx; margin-bottom: 12rpx; }
.insight-content { text-align: center; }
.insight-label { font-size: 20rpx; color: var(--theme-text-muted); margin-bottom: 4rpx; display: block; }
.insight-value { font-size: 26rpx; font-weight: 700; color: var(--theme-text); }
.insight-desc { font-size: 20rpx; color: var(--theme-text-muted); margin-top: 2rpx; display: block; }

.chart-container { height: 240rpx; display: flex; align-items: flex-end; justify-content: space-between; padding: 40rpx 10rpx 10rpx; }
.chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.bar-outer { width: 24rpx; height: 160rpx; background: #f0f2f5; border-radius: 999rpx; display: flex; align-items: flex-end; position: relative; }
.bar-inner { width: 100%; background-color: var(--theme-primary); border-radius: 999rpx; transition: height 1s cubic-bezier(0.165, 0.84, 0.44, 1); position: relative; opacity: 0.3; }
.bar-inner.is-max { opacity: 1; background-color: var(--theme-primary); }
.bar-tooltip { position: absolute; top: -40rpx; left: 50%; transform: translateX(-50%); font-size: 20rpx; color: var(--theme-primary); white-space: nowrap; font-weight: 700; z-index: 5; }
.bar-label { font-size: 18rpx; color: var(--theme-text-muted); margin-top: 12rpx; }

.stats-card { background: var(--theme-card-gradient); border: 1rpx solid var(--theme-border); border-radius: 36rpx; padding: 34rpx 30rpx; margin-bottom: 24rpx; box-shadow: var(--theme-card-shadow); backdrop-filter: blur(18rpx); }
.card-head { font-size: 28rpx; font-weight: 700; color: var(--theme-text-muted); margin-bottom: 24rpx; letter-spacing: 0.02em; }
.stat-line { margin-bottom: 24rpx; padding: 14rpx 14rpx 16rpx; border-radius: 22rpx; }
.clickable:active { transform: scale(0.995); opacity: 0.95; background: var(--theme-primary-soft); }
.line-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.item-name { font-size: 30rpx; color: var(--theme-text); font-weight: 700; }
.item-amount { font-size: 30rpx; font-weight: 700; color: var(--theme-text); }
.progress-bar { height: 10rpx; background: var(--theme-surface-soft); border-radius: 999rpx; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; transition: width 0.6s ease; }
.expense-bg { background: linear-gradient(90deg, var(--theme-expense) 0%, var(--theme-expense-soft) 100%); }
.member-bg { background: linear-gradient(90deg, var(--theme-primary) 0%, var(--theme-primary-soft) 100%); }
</style>
