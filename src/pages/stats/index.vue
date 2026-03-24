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
        categories.value.expense.find((item) => item.name === name)?.icon ||
        "📦",
      color: categoryPalette[index % categoryPalette.length],
    }))
    .sort((a, b) => b.amount - a.amount);
});

const donutStyle = computed(() => {
  if (categoryStats.value.length === 0) {
    return {
      background:
        "conic-gradient(from -90deg, rgba(200, 200, 210, 0.18) 0deg 360deg)",
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
      ? expenseValues.reduce((sum, value) => sum + value, 0) /
        expenseValues.length
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

// ── 趋势图 ──
type TrendView = "expense" | "income" | "both";
const trendView = ref<TrendView>("expense");

const barChartData = computed(() => {
  const points = trendPoints.value;
  if (points.length === 0) return { bars: [], maxVal: 1 };

  let maxVal = 1;
  if (trendView.value === "expense") {
    maxVal = Math.max(...points.map((p) => p.expense), 1);
  } else if (trendView.value === "income") {
    maxVal = Math.max(...points.map((p) => p.income), 1);
  } else {
    maxVal = Math.max(...points.map((p) => Math.max(p.expense, p.income)), 1);
  }

  const bars = points.map((p) => ({
    key: p.key,
    label: p.label,
    expenseH: Math.round((p.expense / maxVal) * 100),
    incomeH: Math.round((p.income / maxVal) * 100),
    expense: p.expense,
    income: p.income,
    isEmpty: p.isEmpty,
  }));

  return { bars, maxVal };
});

// 按月视图时，仅展示月内每天数据（完整天数）
const fullMonthBars = computed(() => {
  if (periodMode.value !== "month") return barChartData.value.bars;
  const year = selectedDate.value.getFullYear();
  const month = selectedDate.value.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayBills = bills.value.filter(
      (b) => normalizeDateKey(String(b.date)) === key,
    );
    return {
      key,
      label: day % 5 === 1 || day === daysInMonth ? String(day) : "",
      expense: sumBills(dayBills, "expense"),
      income: sumBills(dayBills, "income"),
      isEmpty: dayBills.length === 0,
    };
  });
  const maxVal = Math.max(
    ...allDays.map((d) =>
      trendView.value === "income"
        ? d.income
        : trendView.value === "both"
          ? Math.max(d.expense, d.income)
          : d.expense,
    ),
    1,
  );
  return allDays.map((d) => ({
    ...d,
    expenseH: Math.round((d.expense / maxVal) * 100),
    incomeH: Math.round((d.income / maxVal) * 100),
  }));
});

const chartBars = computed(() =>
  periodMode.value === "month" ? fullMonthBars.value : barChartData.value.bars,
);

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
      const dayBills = bills.value.filter(
        (bill) => normalizeDateKey(String(bill.date)) === key,
      );
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
    const dayBills = bills.value.filter(
      (bill) => normalizeDateKey(String(bill.date)) === key,
    );
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
              <view class="period-nav" @click.stop="shiftPeriod(-1)">
                <text class="period-nav-arrow">←</text>
              </view>
              <text class="hero-title">{{ periodTitle }}</text>
              <view class="period-nav" @click.stop="shiftPeriod(1)">
                <text class="period-nav-arrow">→</text>
              </view>
            </view>
            <view class="hero-metric">
              <text class="metric-label">总支出</text>
              <text class="metric-value expense"
                >¥{{ totalExpense.toFixed(2) }}</text
              >
            </view>
            <view class="hero-metric">
              <text class="metric-label">总收入</text>
              <text class="metric-value income"
                >¥{{ totalIncome.toFixed(2) }}</text
              >
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
        <!-- 趋势图卡片 -->
        <view class="panel-card trend-card">
          <view class="trend-header">
            <text class="panel-title" style="margin-bottom: 0">收支趋势</text>
            <view class="trend-tabs">
              <view
                :class="[
                  'trend-tab',
                  trendView === 'expense'
                    ? 'trend-tab-active expense-active'
                    : '',
                ]"
                @click="trendView = 'expense'"
                >支出</view
              >
              <view
                :class="[
                  'trend-tab',
                  trendView === 'income'
                    ? 'trend-tab-active income-active'
                    : '',
                ]"
                @click="trendView = 'income'"
                >收入</view
              >
              <view
                :class="[
                  'trend-tab',
                  trendView === 'both' ? 'trend-tab-active both-active' : '',
                ]"
                @click="trendView = 'both'"
                >对比</view
              >
            </view>
          </view>

          <view class="bar-chart-wrap">
            <scroll-view class="bar-chart-scroll" scroll-x="true">
              <view
                class="bar-chart"
                :style="{ minWidth: chartBars.length * 28 + 'rpx' }"
              >
                <view v-for="bar in chartBars" :key="bar.key" class="bar-col">
                  <view class="bar-stacks">
                    <template v-if="trendView === 'both'">
                      <view class="bar-pair">
                        <view
                          v-if="bar.incomeH > 0"
                          class="bar-fill bar-income"
                          :style="{ height: bar.incomeH * 1.68 + 'rpx' }"
                        ></view>
                        <view
                          v-if="bar.expenseH > 0"
                          class="bar-fill bar-expense"
                          :style="{ height: bar.expenseH * 1.68 + 'rpx' }"
                        ></view>
                      </view>
                    </template>
                    <template v-else>
                      <view
                        v-if="
                          (trendView === 'income'
                            ? bar.incomeH
                            : bar.expenseH) > 0
                        "
                        :class="[
                          'bar-fill',
                          trendView === 'income' ? 'bar-income' : 'bar-expense',
                        ]"
                        :style="{
                          height:
                            (trendView === 'income'
                              ? bar.incomeH
                              : bar.expenseH) *
                              1.68 +
                            'rpx',
                        }"
                      ></view>
                    </template>
                  </view>
                  <text class="bar-label">{{ bar.label }}</text>
                </view>
              </view>
            </scroll-view>

            <view v-if="trendView === 'both'" class="bar-legend">
              <view class="bar-legend-item">
                <view class="bar-legend-dot bar-income"></view>
                <text class="bar-legend-label">收入</text>
              </view>
              <view class="bar-legend-item">
                <view class="bar-legend-dot bar-expense"></view>
                <text class="bar-legend-label">支出</text>
              </view>
            </view>
          </view>
        </view>

        <view class="panel-card">
          <view class="panel-title">支出占比</view>

          <!-- 环图 + 图例 左右并排 -->
          <view class="donut-row">
            <!-- 左侧环图 -->
            <view class="donut-chart-shell">
              <view class="donut-chart" :style="donutStyle"></view>
              <view class="donut-hole"></view>
              <view class="donut-center-text">
                <text class="donut-center-label">支出</text>
                <text class="donut-center-amount"
                  >¥{{ totalExpense.toFixed(0) }}</text
                >
              </view>
            </view>

            <!-- 右侧图例 -->
            <view class="donut-legend">
              <view
                v-for="item in categoryStats"
                :key="item.name"
                class="legend-item"
                @click="openCategoryDetail(item.name)"
              >
                <view class="legend-left">
                  <view
                    class="legend-dot"
                    :style="{ background: item.color }"
                  ></view>
                  <view class="legend-info">
                    <text class="legend-name"
                      >{{ item.icon }} {{ item.name }}</text
                    >
                    <text class="legend-amount"
                      >¥{{ item.amount.toFixed(0) }}</text
                    >
                  </view>
                </view>
                <view class="legend-right-group">
                  <text class="legend-percent"
                    >{{ item.percent.toFixed(0) }}%</text
                  >
                  <text class="legend-arrow">›</text>
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
        <text class="empty-subtitle"
          >先记录一笔，统计页就会自动生成趋势和占比。</text
        >
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
  background: var(--theme-page-bg);
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
  background: var(--theme-accent-ambient);
}

.page-bg-bottom {
  width: 500rpx;
  height: 500rpx;
  left: -200rpx;
  bottom: 120rpx;
  background: var(--theme-primary-soft);
}

.content {
  position: relative;
  z-index: 1;
  overflow-x: hidden;
  padding: 22rpx 24rpx 132rpx;
}

/* ── 趋势图卡片 ── */
.trend-card {
  padding: 24rpx 20rpx 20rpx;
  margin-bottom: 20rpx;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.trend-tabs {
  display: flex;
  gap: 6rpx;
  background: rgba(240, 241, 245, 0.8);
  border-radius: 999rpx;
  padding: 4rpx;
}

.trend-tab {
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #7d8796;
  font-weight: 500;
}

.trend-tab-active {
  color: #fff;
  font-weight: 700;
}

.expense-active {
  background: var(--theme-expense);
}

.income-active {
  background: var(--theme-income);
}

.both-active {
  background: var(--theme-primary);
}

.bar-chart-wrap {
  width: 100%;
}

.bar-chart-scroll {
  width: 100%;
  white-space: nowrap;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0;
  height: 200rpx;
  padding-bottom: 28rpx;
  box-sizing: border-box;
}

.bar-col {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 20rpx;
  height: 100%;
  position: relative;
}

.bar-stacks {
  width: 100%;
  height: 168rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-pair {
  display: flex;
  align-items: flex-end;
  gap: 2rpx;
  width: 100%;
  justify-content: center;
  height: 168rpx;
}

.bar-fill {
  width: 12rpx;
  border-radius: 6rpx 6rpx 0 0;
  transition: height 0.3s ease;
}

.bar-expense {
  background: var(--theme-expense);
  opacity: 0.85;
}

.bar-income {
  background: var(--theme-income);
  opacity: 0.85;
}

.bar-label {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18rpx;
  color: #b0b8c8;
  white-space: nowrap;
  line-height: 1;
}

.bar-legend {
  display: flex;
  justify-content: center;
  gap: 28rpx;
  margin-top: 16rpx;
}

.bar-legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.bar-legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.bar-legend-label {
  font-size: 24rpx;
  color: #7d8796;
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
  box-shadow: 0 12rpx 22rpx var(--theme-accent-ambient);
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
  /* background: linear-gradient(
    135deg,
    var(--theme-accent-ambient) 0%,
    var(--theme-primary-soft) 100%
  ); */
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
  justify-content: space-between;
  margin-bottom: 18rpx;
  width: 360rpx;
}

.period-nav {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-primary-soft);
  color: var(--theme-primary-strong);
  margin: -14rpx -4rpx;
  transition: opacity 0.15s;
}

.period-nav:active {
  opacity: 0.6;
}

.period-nav-arrow {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1;
  color: var(--theme-primary-strong);
}

.hero-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
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
  /* background: linear-gradient(
    180deg,
    var(--theme-accent-ambient) 0%,
    rgba(0, 0, 0, 0.01) 100%
  ); */
}

.spark-node {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  margin-left: -8rpx;
  margin-top: -8rpx;
  border-radius: 50%;
  background: var(--theme-primary);
  box-shadow: 0 0 0 8rpx var(--theme-accent-ambient);
}

.spark-segment {
  position: absolute;
  left: 8rpx;
  top: 50%;
  height: 6rpx;
  margin-top: -3rpx;
  transform-origin: left center;
  border-radius: 999rpx;
  background: linear-gradient(
    90deg,
    var(--theme-primary) 0%,
    var(--theme-accent-ambient) 100%
  );
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

/* ── 环图 + 图例 左右并排行 ── */
.donut-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 8rpx 0 20rpx;
}

.donut-chart-shell {
  position: relative;
  width: 220rpx;
  height: 220rpx;
  flex-shrink: 0;
}

.donut-chart {
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(104, 118, 146, 0.12);
}

.donut-hole {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.99) 0%,
    rgba(249, 250, 252, 0.96) 100%
  );
  transform: translate(-50%, -50%);
  box-shadow: inset 0 0 0 2rpx rgba(239, 241, 245, 0.8);
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
  width: 120rpx;
}

.donut-center-label {
  font-size: 18rpx;
  color: #9aa0ab;
  margin-bottom: 2rpx;
}

.donut-center-amount {
  font-size: 24rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
  color: #20232d;
  word-break: break-all;
}

/* ── 右侧图例列表 ── */
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  padding: 12rpx 14rpx;
  border-radius: 16rpx;
  background: rgba(249, 250, 252, 0.8);
  transition: background 0.15s ease;
}

.legend-item:active {
  background: rgba(235, 237, 242, 0.95);
}

.legend-right-group {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.legend-arrow {
  font-size: 24rpx;
  color: #c0c6d0;
  line-height: 1;
  margin-top: 1rpx;
}

.legend-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
}

.legend-name {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend-amount {
  font-size: 20rpx;
  color: #8f98a8;
}

.legend-percent {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--theme-text);
  flex-shrink: 0;
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
  background: var(--theme-primary-soft);
}

.orbit-b {
  width: 120rpx;
  height: 120rpx;
  background: var(--theme-accent-ambient);
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
