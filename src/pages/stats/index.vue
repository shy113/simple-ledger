<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useBills } from "../../composables/useBills";
import { useTheme } from "../../composables/useTheme";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthKeyFromDate,
} from "../../utils/dateHelper";
import { useLoading } from "../../composables/useLoading";
import GlobalLoading from "../../components/GlobalLoading.vue";

type PeriodMode = "week" | "month" | "year";
type TrendPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  averageExpense: number;
  isEmpty: boolean;
};

const { bills, categories, initData } = useBills();
const { themeVars } = useTheme();
const { showLoading } = useLoading();
const now = new Date();

const periodMode = ref<PeriodMode>("month");
const selectedWeekDate = ref(normalizeDateKey(now.toISOString().slice(0, 10)));
const selectedMonth = ref(getCurrentMonthKey());
const selectedYear = ref(now.getFullYear());

onMounted(() => {
  initData();
});

const selectedDate = computed(() => {
  if (periodMode.value === "year") {
    return new Date(selectedYear.value, 0, 1);
  }

  if (periodMode.value === "week") {
    return new Date(selectedWeekDate.value);
  }

  const [yearStr, monthStr] = selectedMonth.value.split("-");
  return new Date(Number(yearStr), Number(monthStr) - 1, 1);
});

const periodTitle = computed(() => {
  if (periodMode.value === "year") {
    return `${selectedDate.value.getFullYear()}年`;
  }
  if (periodMode.value === "week") {
    const range = getWeekRange(selectedDate.value);
    return `${range.startLabel} - ${range.endLabel}`;
  }
  return formatMonthLabel(selectedMonth.value);
});

const currentPeriodBills = computed(() => {
  if (periodMode.value === "year") {
    const year = String(selectedDate.value.getFullYear());
    return bills.value.filter((bill) => String(bill.date).startsWith(year));
  }

  if (periodMode.value === "week") {
    const range = getWeekRange(selectedDate.value);
    return bills.value.filter((bill) => {
      const dateKey = normalizeDateKey(String(bill.date));
      return dateKey >= range.startKey && dateKey <= range.endKey;
    });
  }

  return bills.value.filter(
    (bill) => getMonthKeyFromDate(String(bill.date)) === selectedMonth.value,
  );
});

const expenseBills = computed(() =>
  currentPeriodBills.value.filter((bill) => bill.type === "expense"),
);

const totalExpense = computed(() =>
  expenseBills.value.reduce((sum, bill) => sum + bill.amount, 0),
);

const totalIncome = computed(() =>
  currentPeriodBills.value
    .filter((bill) => bill.type === "income")
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const categoryPalette = ["#FFC978", "#A29BFE", "#FF8A8A", "#8EC9FF", "#C8B6E8"];

const categoryStats = computed(() => {
  if (totalExpense.value <= 0) return [];

  const totals = new Map<string, number>();
  expenseBills.value.forEach((bill) => {
    totals.set(bill.category, (totals.get(bill.category) || 0) + bill.amount);
  });

  return [...totals.entries()]
    .map(([name, amount], index) => ({
      name,
      amount,
      percent: (amount / totalExpense.value) * 100,
      icon:
        categories.value.expense.find((item) => item.name === name)?.icon || "📦",
      color: categoryPalette[index % categoryPalette.length],
    }))
    .sort((a, b) => b.amount - a.amount);
});

const donutStyle = computed(() => {
  if (categoryStats.value.length === 0) {
    return {
      background:
        "conic-gradient(from -90deg, rgba(162, 155, 254, 0.18) 0deg 360deg)",
    };
  }

  let currentDeg = -90;
  const segments = categoryStats.value.map((item) => {
    const start = currentDeg;
    const end = start + (item.percent / 100) * 360;
    currentDeg = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return {
    background: `conic-gradient(${segments.join(", ")})`,
  };
});

const trendPoints = computed<TrendPoint[]>(() => {
  const buckets = buildTrendBuckets(periodMode.value, selectedDate.value);
  const expenseValues = buckets.map((item) => item.expense);
  const incomeValues = buckets.map((item) => item.income);
  const averageExpense =
    expenseValues.length > 0
      ? expenseValues.reduce((sum, value) => sum + value, 0) / expenseValues.length
      : 0;

  return buckets.map((item) => ({
    ...item,
    averageExpense,
    isEmpty: item.expense <= 0 && item.income <= 0,
  }));
});

const sparklineNodes = computed(() => {
  const points = trendPoints.value;
  if (points.length === 0) return [];

  const maxValue = Math.max(
    ...points.map((item) => Math.max(item.expense, item.income)),
    1,
  );

  return points.map((item, index) => {
    const left = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const value = Math.max(item.expense, item.income);
    const top = 56 - (value / maxValue) * 38;
    const next = points[index + 1];

    if (!next) {
      return {
        id: item.key,
        left,
        top,
        segment: null,
      };
    }

    const nextLeft =
      points.length === 1 ? 50 : ((index + 1) / (points.length - 1)) * 100;
    const nextValue = Math.max(next.expense, next.income);
    const nextTop = 56 - (nextValue / maxValue) * 38;
    const dx = nextLeft - left;
    const dy = nextTop - top;
    const width = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      id: item.key,
      left,
      top,
      segment: {
        width,
        angle,
      },
    };
  });
});

const hasAnyData = computed(() => currentPeriodBills.value.length > 0);

const setMode = (mode: PeriodMode) => {
  periodMode.value = mode;
};

const shiftPeriod = (offset: number) => {
  if (periodMode.value === "year") {
    selectedYear.value += offset;
    return;
  }

  if (periodMode.value === "week") {
    const next = new Date(selectedWeekDate.value);
    next.setDate(next.getDate() + offset * 7);
    selectedWeekDate.value = normalizeDateKey(next.toISOString().slice(0, 10));
    return;
  }

  {
    const [yearStr, monthStr] = selectedMonth.value.split("-");
    const next = new Date(Number(yearStr), Number(monthStr) - 1, 1);
    next.setMonth(next.getMonth() + offset);
    selectedMonth.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }
};

const openCategoryDetail = (name: string) => {
  const periodValue = getPeriodQueryValue();
  showLoading("请稍候...");
  setTimeout(() => {
    uni.navigateTo({
      url: `/pages/stats-detail/index?kind=category&name=${encodeURIComponent(name)}&period=${encodeURIComponent(periodValue)}&mode=${periodMode.value}`,
    });
  }, 50);
};

function getPeriodQueryValue() {
  if (periodMode.value === "year") {
    return String(selectedDate.value.getFullYear());
  }
  if (periodMode.value === "week") {
    const range = getWeekRange(selectedDate.value);
    return `${range.startKey}|${range.endKey}`;
  }
  return selectedMonth.value;
}

function normalizeDateKey(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekRange(seedDate: Date) {
  const start = new Date(seedDate);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startKey: normalizeDateKey(start.toISOString().slice(0, 10)),
    endKey: normalizeDateKey(end.toISOString().slice(0, 10)),
    startLabel: `${start.getMonth() + 1}/${start.getDate()}`,
    endLabel: `${end.getMonth() + 1}/${end.getDate()}`,
  };
}

function buildTrendBuckets(mode: PeriodMode, seedDate: Date) {
  if (mode === "year") {
    const year = seedDate.getFullYear();
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const monthBills = bills.value.filter(
        (bill) => getMonthKeyFromDate(String(bill.date)) === key,
      );
      return {
        key,
        label: String(month).padStart(2, "0"),
        income: sumBills(monthBills, "income"),
        expense: sumBills(monthBills, "expense"),
      };
    });
  }

  if (mode === "week") {
    const range = getWeekRange(seedDate);
    const start = new Date(range.startKey);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = normalizeDateKey(date.toISOString().slice(0, 10));
      const dayBills = bills.value.filter((bill) => normalizeDateKey(String(bill.date)) === key);
      return {
        key,
        label: String(date.getDate()).padStart(2, "0"),
        income: sumBills(dayBills, "income"),
        expense: sumBills(dayBills, "expense"),
      };
    });
  }

  const year = seedDate.getFullYear();
  const month = seedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const sampleIndexes = [1, 5, 10, 15, 20, 25, daysInMonth];

  return sampleIndexes.map((day) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayBills = bills.value.filter((bill) => normalizeDateKey(String(bill.date)) === key);
    return {
      key,
      label: String(day).padStart(2, "0"),
      income: sumBills(dayBills, "income"),
      expense: sumBills(dayBills, "expense"),
    };
  });
}

function sumBills(items: typeof bills.value, type: "expense" | "income") {
  return items
    .filter((bill) => bill.type === type)
    .reduce((sum, bill) => sum + bill.amount, 0);
}
</script>

<template>
  <view class="page" :style="themeVars">
    <view class="page-bg page-bg-top"></view>
    <view class="page-bg page-bg-bottom"></view>

    <view class="content">
        <view class="mode-switch">
          <view
            v-for="item in ['week', 'month', 'year']"
            :key="item"
            :class="['mode-item', periodMode === item ? 'active' : '']"
            @click="setMode(item as PeriodMode)"
          >
            {{ item === "week" ? "按周" : item === "month" ? "按月" : "按年" }}
          </view>
        </view>

        <view class="hero-card">
          <view class="hero-content">
            <view class="hero-copy">
              <view class="hero-head">
                <view class="period-nav" @click="shiftPeriod(-1)">‹</view>
                <text class="hero-title">{{ periodTitle }}</text>
                <view class="period-nav" @click="shiftPeriod(1)">›</view>
              </view>
              <view class="hero-metric">
                <text class="metric-label">总支出</text>
                <text class="metric-value expense">¥{{ totalExpense.toFixed(2) }}</text>
              </view>
              <view class="hero-metric">
                <text class="metric-label">总收入</text>
                <text class="metric-value income">¥{{ totalIncome.toFixed(2) }}</text>
              </view>
            </view>

            <view class="hero-chart">
              <view class="sparkline-surface"></view>
              <view
                v-for="node in sparklineNodes"
                :key="node.id"
                class="spark-node"
                :style="{ left: `${node.left}%`, top: `${node.top}%` }"
              >
                <view
                  v-if="node.segment"
                  class="spark-segment"
                  :style="{
                    width: `${node.segment.width}%`,
                    transform: `rotate(${node.segment.angle}deg)`,
                  }"
                ></view>
              </view>
            </view>
          </view>
        </view>

        <block v-if="hasAnyData">
          <view class="panel-card">
            <view class="panel-title">分类支出占比</view>
            <view class="donut-section">
            <view class="donut-wrap">
              <view class="donut-stage">
                <view class="donut-chart-shell">
                  <view class="donut-chart" :style="donutStyle"></view>
                  <view class="donut-hole"></view>
                  <view class="donut-center-text">
                    <text class="donut-center-label">总支出</text>
                    <text class="donut-center-amount">¥{{ totalExpense.toFixed(2) }}</text>
                  </view>
                </view>
                </view>
              </view>

              <view class="donut-legend">
                <view
                  v-for="item in categoryStats"
                  :key="item.name"
                  class="legend-item"
                  @click="openCategoryDetail(item.name)"
                >
                  <view class="legend-info">
                    <view class="legend-dot" :style="{ background: item.color }"></view>
                    <text class="legend-name">{{ item.icon }} {{ item.name }}</text>
                  </view>
                  <view class="legend-right">
                    <text class="legend-amount">¥{{ item.amount.toFixed(0) }}</text>
                    <text class="legend-value">{{ item.percent.toFixed(0) }}%</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

        </block>

        <view v-else class="empty-card">
          <view class="empty-illustration">
            <view class="empty-orbit orbit-a"></view>
            <view class="empty-orbit orbit-b"></view>
            <text class="empty-icon">🫧</text>
          </view>
          <text class="empty-title">暂无统计数据，快去记账吧</text>
          <text class="empty-subtitle">先记录一笔，统计页就会自动生成趋势和占比。</text>
        </view>
    </view>

    <GlobalLoading />
  </view>
</template>

<style>
page {
  height: 100%;
  background: var(--theme-page-bg);
}

.page {
  position: relative;
  height: 100%;
  overflow-x: hidden;
  overflow-y: visible;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 249, 246, 0.98) 100%),
    var(--theme-page-bg);
}

.page-bg {
  position: absolute;
  border-radius: 999rpx;
  filter: blur(30rpx);
  pointer-events: none;
}

.page-bg-top {
  width: 420rpx;
  height: 420rpx;
  top: -140rpx;
  right: -120rpx;
  background: rgba(162, 155, 254, 0.16);
}

.page-bg-bottom {
  width: 500rpx;
  height: 500rpx;
  left: -200rpx;
  bottom: 120rpx;
  background: rgba(65, 184, 131, 0.12);
}

.content {
  position: relative;
  z-index: 1;
  overflow-x: hidden;
  padding: 22rpx 24rpx 132rpx;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  padding: 8rpx;
  margin-bottom: 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 10rpx 24rpx rgba(126, 136, 155, 0.08);
}

.mode-item {
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #7d8796;
  background: #ffffff;
}

.mode-item.active {
  background: var(--theme-fab-gradient);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 12rpx 22rpx rgba(65, 184, 131, 0.22);
}

.hero-card,
.panel-card,
.empty-card {
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 16rpx 36rpx rgba(110, 123, 144, 0.1);
  backdrop-filter: blur(16rpx);
}

.hero-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  background:
    linear-gradient(135deg, rgba(242, 239, 255, 0.92) 0%, rgba(229, 247, 237, 0.92) 100%);
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hero-copy {
  flex: 1;
}

.hero-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.period-nav {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.62);
  color: var(--theme-primary-strong);
  font-size: 30rpx;
}

.hero-title {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--theme-text);
}

.hero-metric {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 10rpx;
}

.metric-label {
  font-size: 26rpx;
  color: #6d7280;
}

.metric-value {
  font-size: 38rpx;
  font-weight: 800;
}

.metric-value.expense {
  color: var(--theme-expense);
}

.metric-value.income {
  color: var(--theme-income);
}

.hero-chart {
  position: relative;
  width: 220rpx;
  height: 160rpx;
  padding: 16rpx 8rpx;
}

.sparkline-surface {
  position: absolute;
  inset: 18rpx 10rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(180deg, rgba(162, 155, 254, 0.12) 0%, rgba(162, 155, 254, 0.03) 100%);
}

.spark-node {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  margin-left: -8rpx;
  margin-top: -8rpx;
  border-radius: 50%;
  background: #a29bfe;
  box-shadow: 0 0 0 8rpx rgba(162, 155, 254, 0.12);
}

.spark-segment {
  position: absolute;
  left: 8rpx;
  top: 50%;
  height: 6rpx;
  margin-top: -3rpx;
  transform-origin: left center;
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(162, 155, 254, 0.95) 0%, rgba(162, 155, 254, 0.65) 100%);
}

.panel-card {
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 16rpx;
}

.panel-head .panel-title {
  margin-bottom: 0;
}

.donut-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-wrap {
  width: 100%;
  padding: 12rpx 0 28rpx;
  display: flex;
  justify-content: center;
  overflow: visible;
}

.donut-stage {
  position: relative;
  width: 100%;
  max-width: 520rpx;
  height: 340rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.donut-chart-shell {
  position: relative;
  width: 340rpx;
  height: 340rpx;
}

.donut-chart {
  position: relative;
  width: 340rpx;
  height: 340rpx;
  border-radius: 50%;
  box-shadow: 0 12rpx 24rpx rgba(104, 118, 146, 0.06);
}

.donut-hole {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 224rpx;
  height: 224rpx;
  border-radius: 50%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(249, 250, 252, 0.96) 100%);
  transform: translate(-50%, -50%);
  box-shadow: inset 0 0 0 2rpx rgba(239, 241, 245, 0.9);
}

.donut-center-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.donut-center-label {
  font-size: 20rpx;
  color: #9aa0ab;
}

.donut-center-amount {
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: -0.3rpx;
  color: #20232d;
}

.donut-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(249, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text);
}

.legend-value {
  min-width: 64rpx;
  font-size: 28rpx;
  text-align: right;
  color: #778092;
}

.legend-right {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
}

.legend-amount {
  font-size: 24rpx;
  color: #8f98a8;
}

.empty-card {
  min-height: 540rpx;
  padding: 70rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-illustration {
  position: relative;
  width: 220rpx;
  height: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.empty-icon {
  font-size: 96rpx;
  position: relative;
  z-index: 1;
}

.empty-orbit {
  position: absolute;
  border-radius: 50%;
}

.orbit-a {
  width: 180rpx;
  height: 180rpx;
  background: rgba(65, 184, 131, 0.12);
}

.orbit-b {
  width: 120rpx;
  height: 120rpx;
  background: rgba(162, 155, 254, 0.14);
}

.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 12rpx;
}

.empty-subtitle {
  font-size: 26rpx;
  line-height: 1.7;
  color: #7e8796;
}

</style>
