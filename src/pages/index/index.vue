<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBills } from '../../composables/useBills';
import { useTheme } from '../../composables/useTheme';
import type { Bill } from '../../types';
import { formatMonthLabel, getCurrentMonthKey, getMonthKeyFromDate } from '../../utils/dateHelper';

import BillHeader from '../../components/BillHeader.vue';
import BillList from '../../views/Home/BillList.vue';
import StatsView from '../../views/Home/StatsView.vue';
import AddBillModal from '../../views/Home/AddBillModal.vue';
import DonateModal from '../../views/Home/DonateModal.vue';
import ManagementModals from '../../views/Home/ManagementModals.vue';

const { bills, initData } = useBills();
const { themeVars } = useTheme();

const activeTab = ref<'list' | 'stats'>('list');
const selectedMonth = ref(getCurrentMonthKey());
const selectedType = ref<'expense' | 'income' | 'all'>('expense');
const showAddModal = ref(false);
const showDonateModal = ref(false);
const showCatManager = ref(false);
const showPersonManager = ref(false);
const scrollTop = ref(0);
const editingBill = ref<Bill | null>(null);

onMounted(() => {
  initData();
});

const selectedMonthLabel = computed(() => formatMonthLabel(selectedMonth.value));
const selectedMonthPickerValue = computed(() => `${selectedMonth.value}-01`);

const monthBills = computed(() =>
  bills.value.filter((bill) => getMonthKeyFromDate(String(bill.date)) === selectedMonth.value),
);

const periodIncome = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === 'income')
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodExpense = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === 'expense')
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodBalance = computed(() => periodIncome.value - periodExpense.value);

const displayedBills = computed(() => {
  if (selectedType.value === 'all') {
    return monthBills.value;
  }
  return monthBills.value.filter((bill) => bill.type === selectedType.value);
});

const showTypeSwitcher = computed(() => activeTab.value === 'list');

const handleAddNew = () => {
  editingBill.value = null;
  showAddModal.value = true;
};

const handleEdit = (bill: Bill) => {
  editingBill.value = bill;
  showAddModal.value = true;
};

const handleMonthChange = (event: any) => {
  const value = event?.detail?.value || '';
  if (value) {
    selectedMonth.value = String(value).slice(0, 7);
  }
};

const shiftMonth = (offset: number) => {
  const [yearStr, monthStr] = selectedMonth.value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const next = new Date(year, month + offset, 1);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, '0');
  selectedMonth.value = `${nextYear}-${nextMonth}`;
};
</script>

<template>
  <view class="container" :style="themeVars">
    <view class="ambient ambient-a"></view>
    <view class="ambient ambient-b"></view>

    <view class="fixed-header">
      <view class="header-wrap">
        <BillHeader
          :period-label="selectedMonthLabel"
          :picker-value="selectedMonthPickerValue"
          :balance="periodBalance"
          :income="periodIncome"
          :expense="periodExpense"
          @prev-month="shiftMonth(-1)"
          @next-month="shiftMonth(1)"
          @pick-month="handleMonthChange"
        />
        <view class="heart-donate" @click="showDonateModal = true">❤</view>
      </view>

      <view class="view-switcher">
        <view
          :class="['switch-item', activeTab === 'list' ? 'active' : '']"
          @click="activeTab = 'list'"
        >
          明细
        </view>
        <view
          :class="['switch-item', activeTab === 'stats' ? 'active' : '']"
          @click="activeTab = 'stats'"
        >
          统计
        </view>
      </view>

      <view v-if="showTypeSwitcher" class="type-switcher">
        <view
          :class="['type-item', selectedType === 'expense' ? 'active' : '']"
          @click="selectedType = 'expense'"
        >
          支出
        </view>
        <view
          :class="['type-item', selectedType === 'income' ? 'active' : '']"
          @click="selectedType = 'income'"
        >
          收入
        </view>
        <view
          :class="['type-item', selectedType === 'all' ? 'active' : '']"
          @click="selectedType = 'all'"
        >
          全部
        </view>
      </view>
    </view>

    <scroll-view class="scroll-content" scroll-y :scroll-top="scrollTop" :scroll-with-animation="false">
      <view v-if="activeTab === 'list'" key="list-tab">
        <BillList :bills="displayedBills" @edit="handleEdit" />
      </view>

      <view v-else key="stats-tab">
        <StatsView :bills="monthBills" :period-key="selectedMonth" />
      </view>
    </scroll-view>

    <view class="add-fab" @click="handleAddNew">+</view>

    <AddBillModal
      v-model="showAddModal"
      :editData="editingBill"
      @manage-cat="showCatManager = true"
      @manage-person="showPersonManager = true"
    />

    <DonateModal v-model="showDonateModal" />

    <ManagementModals
      v-model:showCat="showCatManager"
      v-model:showPerson="showPersonManager"
      type="expense"
    />
  </view>
</template>

<style>
page {
  height: 100%;
  background: linear-gradient(180deg, #eef7f0 0%, #e7f2eb 100%);
}

.container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(circle at top left, var(--theme-accent-ambient) 0, rgba(255, 255, 255, 0) 42%),
    linear-gradient(180deg, var(--theme-page-bg) 0%, var(--theme-page-bg-alt) 100%);
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
  background: rgba(255, 255, 255, 0.40);
}

.ambient-b {
  width: 420rpx;
  height: 420rpx;
  left: -180rpx;
  top: 460rpx;
  background: rgba(52, 194, 107, 0.22);
}

.fixed-header {
  flex-shrink: 0;
  padding: 24rpx 24rpx 0;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.header-wrap {
  position: relative;
  margin-bottom: 18rpx;
}

.heart-donate {
  position: absolute;
  right: 14rpx;
  top: 18rpx;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 248, 239, 0.98) 100%);
  border: 1rpx solid rgba(133, 214, 158, 0.42);
  color: #ff6b8b;
  font-size: 32rpx;
  box-shadow: 0 10rpx 20rpx rgba(52, 101, 65, 0.08);
  z-index: 2;
}

.view-switcher {
  display: flex;
  flex: 1;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  border-radius: 999rpx;
  padding: 6rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 10rpx 24rpx rgba(47, 53, 66, 0.04);
  backdrop-filter: blur(18rpx);
}

.switch-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: var(--theme-text-muted);
  border-radius: 999rpx;
  transition: all 0.24s ease;
}

.switch-item.active {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 248, 239, 0.98) 100%);
  color: var(--theme-text);
  font-weight: 700;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.type-switcher {
  display: flex;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.type-item {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 24rpx;
  color: var(--theme-text-muted);
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
}

.type-item.active {
  color: var(--theme-text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 248, 239, 0.98) 100%);
  border-color: rgba(52, 194, 107, 0.18);
  box-shadow: 0 6rpx 16rpx rgba(52, 101, 65, 0.08);
}

.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.add-fab {
  position: fixed;
  right: 28rpx;
  bottom: 34rpx;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  background: var(--theme-fab-gradient);
  color: white;
  text-align: center;
  line-height: 108rpx;
  font-size: 68rpx;
  box-shadow: 0 18rpx 30rpx rgba(71, 126, 88, 0.25);
  z-index: 20;
}
</style>
