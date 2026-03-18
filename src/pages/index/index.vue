<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBills } from '../../composables/useBills';
import type { Bill } from '../../types';
import { formatMonthLabel, getCurrentMonthKey, getMonthKeyFromDate } from '../../utils/dateHelper';

import BillHeader from '../../components/BillHeader.vue';
import BillList from '../../views/Home/BillList.vue';
import StatsView from '../../views/Home/StatsView.vue';
import AddBillModal from '../../views/Home/AddBillModal.vue';
import ManagementModals from '../../views/Home/ManagementModals.vue';

const { bills, initData } = useBills();

const activeTab = ref<'list' | 'stats'>('list');
const selectedMonth = ref(getCurrentMonthKey());
const selectedType = ref<'expense' | 'income' | 'all'>('expense');
const showAddModal = ref(false);
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
  <view class="container">
    <view class="ambient ambient-a"></view>
    <view class="ambient ambient-b"></view>

    <view class="fixed-header">
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
  background: #f9fafc;
}

.container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.75) 0, rgba(255, 255, 255, 0) 38%),
    linear-gradient(180deg, #f9fafc 0%, #f2f5f9 100%);
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
  background: rgba(255, 255, 255, 0.9);
}

.ambient-b {
  width: 420rpx;
  height: 420rpx;
  left: -180rpx;
  top: 460rpx;
  background: rgba(116, 185, 255, 0.12);
}

.fixed-header {
  flex-shrink: 0;
  padding: 24rpx 24rpx 0;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.view-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(229, 234, 241, 0.95);
  border-radius: 999rpx;
  padding: 6rpx;
  margin-bottom: 18rpx;
  width: 300rpx;
  box-shadow: 0 10rpx 24rpx rgba(47, 53, 66, 0.04);
  backdrop-filter: blur(18rpx);
}

.switch-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #a4b0be;
  border-radius: 999rpx;
  transition: all 0.24s ease;
}

.switch-item.active {
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  color: #2f3542;
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
  color: #a4b0be;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(229, 234, 241, 0.95);
  box-shadow: 0 8rpx 18rpx rgba(47, 53, 66, 0.03);
  backdrop-filter: blur(18rpx);
}

.type-item.active {
  background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
  color: #2f3542;
  font-weight: 700;
}

.scroll-content {
  flex: 1;
  min-height: 0;
  padding: 24rpx;
  padding-top: 0;
  padding-bottom: 24rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.add-fab {
  position: fixed;
  right: 50rpx;
  bottom: 60rpx;
  width: 110rpx;
  height: 110rpx;
  background: linear-gradient(180deg, #8cc8ff 0%, #74b9ff 100%);
  color: white;
  border-radius: 55rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  box-shadow: 0 18rpx 34rpx rgba(116, 185, 255, 0.3);
  z-index: 100;
}
</style>
