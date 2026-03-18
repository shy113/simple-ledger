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

const { bills, initData, inject50MockData } = useBills();

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

const handleAddNew = () => {
  editingBill.value = null;
  showAddModal.value = true;
};

const handleEdit = (bill: Bill) => {
  editingBill.value = bill;
  showAddModal.value = true;
};

const handleRegenerateMock = () => {
  inject50MockData();
  scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;
  uni.showToast({ title: '已重新生成50条测试数据', icon: 'none' });
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
    <view class="fixed-header">
      <BillHeader
        title="当前月份"
        :period-label="selectedMonthLabel"
        :balance="periodBalance"
        :income="periodIncome"
        :expense="periodExpense"
      />

      <view class="filter-card">
        <view class="filter-row">
          <text class="filter-label">账期筛选</text>
          <text class="filter-hint">默认当前月，可切换到任意年月</text>
        </view>

        <view class="month-action-row">
          <view class="month-nav-btn" @click="shiftMonth(-1)">上一月</view>
          <picker mode="date" fields="month" :value="selectedMonthPickerValue" @change="handleMonthChange">
            <view class="period-picker">
              <text class="picker-label">选择月份</text>
              <text class="picker-value">{{ selectedMonthLabel }}</text>
            </view>
          </picker>
          <view class="month-nav-btn" @click="shiftMonth(1)">下一月</view>
        </view>

        <view class="type-switcher">
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
          分析
        </view>
      </view>
    </view>

    <scroll-view
      class="scroll-content"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="false"
    >
      <view v-show="activeTab === 'list'">
        <BillList :bills="displayedBills" @edit="handleEdit" />
        <view class="refresh-entry" @click="handleRegenerateMock">
          <text>刷新测试数据</text>
        </view>
      </view>

      <view v-show="activeTab === 'stats'">
        <StatsView :bills="monthBills" :period-label="selectedMonthLabel" />
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
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f9fb;
}

.fixed-header {
  flex-shrink: 0;
  padding: 30rpx;
  padding-bottom: 0;
  background-color: #f8f9fb;
}

.filter-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.filter-label {
  font-size: 28rpx;
  color: #111;
  font-weight: 700;
}

.filter-hint {
  font-size: 22rpx;
  color: #999;
}

.month-action-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.month-nav-btn {
  flex: 0 0 auto;
  padding: 16rpx 20rpx;
  border-radius: 999rpx;
  background: #f5f6f8;
  color: #333;
  font-size: 24rpx;
  font-weight: 600;
}

.period-picker {
  min-width: 220rpx;
  text-align: center;
  padding: 16rpx 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #111 0%, #333 100%);
  color: #fff;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.12);
}

.picker-label {
  display: block;
  font-size: 20rpx;
  opacity: 0.7;
  margin-bottom: 4rpx;
}

.picker-value {
  display: block;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.type-switcher {
  display: flex;
  gap: 12rpx;
}

.type-item {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 24rpx;
  color: #666;
  border-radius: 999rpx;
  background: #f5f6f8;
}

.type-item.active {
  background: #111;
  color: #fff;
  font-weight: 600;
}

.scroll-content {
  flex: 1;
  height: calc(100vh - 380px);
  padding: 30rpx;
  padding-top: 0;
  padding-bottom: 150rpx;
  box-sizing: border-box;
}

.view-switcher {
  display: flex;
  background: #eee;
  border-radius: 40rpx;
  padding: 6rpx;
  margin-bottom: 30rpx;
  width: 300rpx;
}

.switch-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #666;
  border-radius: 35rpx;
  transition: all 0.3s;
}

.switch-item.active {
  background: white;
  color: #000;
  font-weight: 700;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.add-fab {
  position: fixed;
  right: 50rpx;
  bottom: 60rpx;
  width: 110rpx;
  height: 110rpx;
  background: #000;
  color: white;
  border-radius: 55rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.refresh-entry {
  text-align: center;
  padding: 30rpx;
  margin-top: 20rpx;
}

.refresh-entry text {
  font-size: 24rpx;
  color: #999;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}
</style>
