<template>
  <view class="page" :style="themeVars">
    <view :class="['page-content', pageReady ? 'page-ready' : '']">
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
          <text class="summary-label">{{ totalAmountLabel }}</text>
          <text class="summary-value">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
      </view>

      <view class="list-card">
        <view v-if="detailBills.length === 0" class="empty-state"
          >没有找到匹配的账单</view
        >
        <view v-else class="bill-list">
          <view v-for="bill in detailBills" :key="bill.id" class="bill-item">
            <view class="bill-main">
              <view class="bill-name-row">
                <text class="bill-name">{{ bill.category }}</text>
                <text class="bill-person">{{ bill.personName }}</text>
              </view>
              <text class="bill-meta"
                >{{ bill.date }}{{ bill.note ? " · " + bill.note : "" }}</text
              >
            </view>
            <text :class="['bill-amount', bill.type]">
              {{ bill.type === "expense" ? "-" : "+" }}{{ bill.amount.toFixed(2) }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <GlobalLoading />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBills } from "../../composables/useBills";
import { useTheme } from "../../composables/useTheme";
import { useLoading } from "../../composables/useLoading";
import { formatMonthLabel } from "../../utils/dateHelper";
import GlobalLoading from "../../components/GlobalLoading.vue";
import type { Bill } from "../../types";

const { bills: allBills } = useBills();
const { themeVars } = useTheme();
const { hideLoading } = useLoading();

const kind = ref<"category" | "person" | "date">("category");
const name = ref("");
const period = ref("");
const mode = ref<"month" | "year" | "week" | "day">("month");
const pageReady = ref(false);

onLoad((query) => {
  const params = query || {};
  kind.value =
    params.kind === "person"
      ? "person"
      : params.kind === "date"
        ? "date"
        : "category";
  name.value =
    typeof params.name === "string" ? decodeURIComponent(params.name) : "";
  period.value =
    typeof params.period === "string"
      ? decodeURIComponent(params.period)
      : typeof params.month === "string"
        ? decodeURIComponent(params.month)
        : "";
  mode.value =
    params.mode === "year" || params.mode === "week" || params.mode === "day"
      ? params.mode
      : "month";
});

onMounted(() => {
  setTimeout(() => {
    hideLoading();
    setTimeout(() => {
      pageReady.value = true;
    }, 30);
  }, 120);
});

const detailBills = computed<Bill[]>(() => {
  const matched = allBills.value.filter((bill) => {
    if (kind.value !== "date" && bill.type !== "expense") return false;

    const billDateStr = String(bill.date);
    if (period.value) {
      if (mode.value === "week" && period.value.includes("|")) {
        const [start, end] = period.value.split("|");
        if (billDateStr < start || billDateStr > end) return false;
      } else if (!billDateStr.startsWith(period.value)) {
        return false;
      }
    }

    if (!name.value) return true;

    if (kind.value === "date") {
      return billDateStr === name.value;
    }

    return kind.value === "person"
      ? bill.personName === name.value
      : bill.category === name.value;
  });
  return [...matched].sort((a, b) => {
    if (kind.value === "date") return b.amount - a.amount;
    return b.amount - a.amount;
  });
});

const title = computed(() => {
  if (!name.value) return "支出总览";
  if (kind.value === "date") return `${name.value} 收支明细`;
  return kind.value === "category"
    ? `${name.value} 分类明细`
    : `${name.value} 成员明细`;
});

const monthText = computed(() =>
  formatPeriodLabel(period.value, mode.value),
);
const totalAmount = computed(() =>
  detailBills.value.reduce((sum, bill) => sum + bill.amount, 0),
);

const totalAmountLabel = computed(() =>
  kind.value === "date" ? "总收支" : "总金额",
);

function formatPeriodLabel(
  raw: string,
  currentMode: "month" | "year" | "week" | "day",
) {
  if (!raw) return "全部周期";
  if (currentMode === "week" && raw.includes("|")) {
    const [start, end] = raw.split("|");
    return `${start} 至 ${end}`;
  }
  if (currentMode === "day") return raw;
  return formatMonthLabel(raw);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    var(--theme-page-bg) 0%,
    var(--theme-page-bg-alt) 100%
  );
  padding: 24rpx;
  box-sizing: border-box;
}
.page-content {
  opacity: 0;
  transform: translateY(16rpx);
  transition: opacity 220ms ease, transform 220ms ease;
}
.page-ready {
  opacity: 1;
  transform: translateY(0);
}
.hero-card,
.summary-card,
.list-card {
  background: var(--theme-card-gradient);
  border: 1rpx solid var(--theme-border);
  border-radius: 36rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--theme-card-shadow);
  backdrop-filter: blur(18rpx);
}
.hero-card {
  background: var(--theme-card-gradient);
}
.hero-kicker {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  margin-bottom: 10rpx;
}
.hero-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 10rpx;
}
.hero-subtitle {
  font-size: 26rpx;
  color: var(--theme-text-muted);
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
  font-size: 24rpx;
  color: var(--theme-text-muted);
  margin-bottom: 8rpx;
}
.summary-value {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--theme-text);
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
  border-bottom: 1rpx solid var(--theme-border);
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
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-text);
}
.bill-person {
  font-size: 22rpx;
  color: var(--theme-text-muted);
  padding: 6rpx 10rpx;
  border-radius: 999rpx;
  background: var(--theme-primary-soft);
}
.bill-meta {
  font-size: 24rpx;
  color: var(--theme-text-muted);
}
.bill-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-left: 20rpx;
}
.bill-amount.expense {
  color: var(--theme-expense);
}
.bill-amount.income {
  color: var(--theme-income);
}
.empty-state {
  text-align: center;
  color: var(--theme-text-muted);
  padding: 60rpx 20rpx;
  font-size: 28rpx;
}
</style>
