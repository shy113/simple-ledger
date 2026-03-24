<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBills } from "../../composables/useBills";
import { useTheme } from "../../composables/useTheme";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthKeyFromDate,
} from "../../utils/dateHelper";

import BillHeader from "../../components/BillHeader.vue";
import StatsView from "../../views/Home/StatsView.vue";
import GlobalLoading from "../../components/GlobalLoading.vue";

const { bills, initData } = useBills();
const { themeVars } = useTheme();

const selectedMonth = ref(getCurrentMonthKey());
const statMode = ref<"month" | "year">("month");

onMounted(() => {
  initData();
});

const selectedMonthLabel = computed(() =>
  formatMonthLabel(selectedMonth.value),
);
const selectedMonthPickerValue = computed(() => `${selectedMonth.value}-01`);

const monthBills = computed(() =>
  bills.value.filter(
    (bill) => getMonthKeyFromDate(String(bill.date)) === selectedMonth.value,
  ),
);

const periodIncome = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === "income")
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodExpense = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === "expense")
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodBalance = computed(() => periodIncome.value - periodExpense.value);

const handleMonthChange = (event: any) => {
  const value = event?.detail?.value || "";
  if (value) selectedMonth.value = String(value).slice(0, 7);
};

const shiftMonth = (offset: number) => {
  const [yearStr, monthStr] = selectedMonth.value.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + offset, 1);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  selectedMonth.value = `${date.getFullYear()}-${nextMonth}`;
};

const handlePrevMonth = () => {
  if (statMode.value === "year") shiftMonth(-12);
  else shiftMonth(-1);
};

const handleNextMonth = () => {
  if (statMode.value === "year") shiftMonth(12);
  else shiftMonth(1);
};

const handleBack = () => {
  uni.navigateBack();
};

// 事件处理器 - 解决 TypeScript 隐式 any 类型问题
const onSelectMonth = (m: string) => {
  selectedMonth.value = m;
  statMode.value = "month";
};

const onShiftYear = (offset: number) => {
  shiftMonth(offset * 12);
};
</script>

<template>
  <view class="container" :style="themeVars">
    <view class="ambient ambient-a"></view>
    <view class="ambient ambient-b"></view>

    <view class="fixed-header">
      <view class="header-wrap">
        <view class="back-btn clickable" @click="handleBack">←</view>
        <BillHeader
          :period-label="selectedMonthLabel"
          :picker-value="selectedMonthPickerValue"
          :balance="periodBalance"
          :income="periodIncome"
          :expense="periodExpense"
          @prev-month="handlePrevMonth"
          @next-month="handleNextMonth"
          @pick-month="handleMonthChange"
        />
      </view>

      <view class="stat-type-switcher">
        <view
          :class="['type-item clickable', statMode === 'month' ? 'active' : '']"
          @click="statMode = 'month'"
          >月度(支出)</view
        >
        <view
          :class="['type-item clickable', statMode === 'year' ? 'active' : '']"
          @click="statMode = 'year'"
          >年度(支出)</view
        >
      </view>
    </view>

    <scroll-view class="scroll-content" scroll-y>
      <view class="view-content-wrap fade-in">
        <StatsView
          :all-bills="bills"
          :period-key="selectedMonth"
          :mode="statMode"
          @select-month="onSelectMonth"
          @shift-year="onShiftYear"
        />
      </view>
    </scroll-view>

    <GlobalLoading />
  </view>
</template>

<style>
page {
  height: 100%;
  background: var(--theme-page-bg);
}
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(
      circle at top left,
      var(--theme-accent-ambient) 0,
      rgba(255, 255, 255, 0) 42%
    ),
    linear-gradient(
      180deg,
      var(--theme-page-bg) 0%,
      var(--theme-page-bg-alt) 100%
    );
  overflow: hidden;
}
.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.5;
  pointer-events: none;
}
.ambient-a {
  width: 360rpx;
  height: 360rpx;
  right: -120rpx;
  top: -90rpx;
  background: rgba(255, 255, 255, 0.4);
}
.ambient-b {
  width: 420rpx;
  height: 420rpx;
  left: -180rpx;
  top: 460rpx;
  background: var(--theme-accent-ambient);
}

.fixed-header {
  flex-shrink: 0;
  padding: 24rpx 32rpx 0;
  position: relative;
  z-index: 100;
}
.header-wrap {
  position: relative;
  margin-bottom: 18rpx;
}

.back-btn {
  position: absolute;
  left: -10rpx;
  top: -10rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: var(--theme-text-muted);
  z-index: 10;
}

.stat-type-switcher {
  display: flex;
  gap: 16rpx;
  margin-bottom: 22rpx;
  height: 76rpx;
}
.type-item {
  flex: 1;
  text-align: center;
  line-height: 76rpx;
  font-size: 26rpx;
  color: var(--theme-text-muted);
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
}
.type-item:active {
  transform: scale(0.96);
}
.type-item.active {
  color: var(--theme-primary);
  font-weight: 800;
  background: var(--theme-surface-strong);
  border-color: var(--theme-primary);
  opacity: 1;
  box-shadow: 0 8rpx 20rpx var(--theme-accent-ambient);
}

.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}
.view-content-wrap {
  padding: 0 32rpx;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.fade-in {
  -webkit-animation: fadeInAnim 0.4s ease-out both;
  animation: fadeInAnim 0.4s ease-out both;
}

@-webkit-keyframes fadeInAnim {
  from {
    opacity: 0;
    -webkit-transform: translateY(16rpx);
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}

@keyframes fadeInAnim {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
