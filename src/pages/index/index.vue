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
          <text class="filter-label">月份</text>
          <picker mode="date" fields="month" :value="selectedMonthPickerValue" @change="handleMonthChange">
            <view class="period-picker">{{ selectedMonthLabel }}</view>
          </picker>
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
  font-size: 26rpx;
  color: #666;
}

.period-picker {
  min-width: 180rpx;
  text-align: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #f5f6f8;
  color: #111;
  font-size: 26rpx;
  font-weight: 600;
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
