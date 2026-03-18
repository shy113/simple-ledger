<template>
  <view class="list-section">
    <view class="list-toolbar">
      <view class="toolbar-labels">
        <text class="toolbar-title">排序方式</text>
        <text class="toolbar-hint">当前：{{ sortMode === 'date' ? '按日期' : '按金额' }}</text>
      </view>
      <view class="sort-toggle">
        <view :class="['sort-pill', sortMode === 'date' ? 'active' : '']" @click="sortMode = 'date'">按日期</view>
        <view :class="['sort-pill', sortMode === 'amount' ? 'active' : '']" @click="sortMode = 'amount'">按金额</view>
      </view>
    </view>

    <view v-if="sortedBills.length === 0" class="empty-state">
      <text class="empty-icon">🫧</text>
      <text class="empty-text">当前筛选范围内暂无记录</text>
    </view>

    <view
      v-for="bill in sortedBills"
      :key="bill.id"
      class="bill-item"
      @click="emit('edit', bill)"
      @longpress="onDelete(bill.id)"
    >
      <view class="bill-icon">
        {{ getIcon(bill.category) }}
        <view class="bill-avatar-badge">{{ bill.personAvatar }}</view>
      </view>
      <view class="bill-info">
        <view class="bill-main">
          <text class="bill-category">{{ bill.category }}</text>
          <text class="bill-person-name">{{ bill.personName }}</text>
        </view>
        <text class="bill-date">{{ bill.date }}{{ bill.note ? ' · ' + bill.note : '' }}</text>
      </view>
      <view :class="['bill-amount', bill.type]">
        {{ bill.type === 'expense' ? '-' : '+' }}{{ bill.amount.toFixed(2) }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBills } from '../../composables/useBills';
import type { Bill } from '../../types';

const props = defineProps<{ bills: Bill[] }>();

const emit = defineEmits<{ (e: 'edit', bill: Bill): void }>();

const { categories, removeBill } = useBills();
const sortMode = ref<'date' | 'amount'>('date');

const sortedBills = computed(() => {
  const list = [...props.bills];
  if (sortMode.value === 'amount') {
    return list.sort((a, b) => {
      const amountDiff = b.amount - a.amount;
      if (amountDiff !== 0) return amountDiff;
      return String(b.date).localeCompare(String(a.date));
    });
  }

  return list.sort((a, b) => {
    const dateDiff = String(b.date).localeCompare(String(a.date));
    if (dateDiff !== 0) return dateDiff;
    return b.id - a.id;
  });
});

const getIcon = (name: string) => {
  const all = [...categories.value.expense, ...categories.value.income];
  return all.find((cat) => cat.name === name)?.icon || '📒';
};

const onDelete = (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条账单吗？',
    confirmColor: '#FF7675',
    success: (res) => {
      if (res.confirm) {
        removeBill(id);
      }
    },
  });
};
</script>

<style scoped>
.list-section {
  background: rgba(249, 250, 252, 0.95);
  border: 1rpx solid rgba(229, 234, 241, 0.95);
  border-radius: 36rpx;
  padding: 20rpx 18rpx 10rpx;
  box-shadow: 0 16rpx 36rpx rgba(47, 53, 66, 0.05);
  backdrop-filter: blur(18rpx);
  overflow: hidden;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 4rpx 0 16rpx;
}

.toolbar-labels { display: flex; flex-direction: column; }
.toolbar-title { font-size: 28rpx; font-weight: 700; color: #2f3542; }
.toolbar-hint { font-size: 20rpx; color: #a4b0be; margin-top: 4rpx; }

.sort-toggle {
  display: inline-flex;
  padding: 6rpx;
  border-radius: 999rpx;
  background: rgba(240, 243, 247, 0.96);
  border: 1rpx solid #e5eaf1;
}

.sort-pill {
  min-width: 112rpx;
  text-align: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #a4b0be;
}

.sort-pill.active {
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  color: #2f3542;
  font-weight: 700;
  box-shadow: 0 8rpx 20rpx rgba(47, 53, 66, 0.12);
}

.bill-item {
  display: flex;
  align-items: center;
  padding: 22rpx 18rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid #edf2f7;
  border-radius: 28rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
  box-shadow: 0 10rpx 22rpx rgba(47, 53, 66, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bill-item:last-child { margin-bottom: 10rpx; }
.bill-item:active { transform: scale(0.995); box-shadow: 0 8rpx 16rpx rgba(47, 53, 66, 0.05); }

.bill-icon {
  width: 84rpx;
  height: 84rpx;
  background: linear-gradient(180deg, rgba(116, 185, 255, 0.1) 0%, rgba(116, 185, 255, 0.06) 100%);
  border: 1rpx solid rgba(116, 185, 255, 0.18);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
  margin-right: 20rpx;
  position: relative;
  flex-shrink: 0;
}

.bill-avatar-badge {
  position: absolute;
  bottom: -5rpx;
  right: -5rpx;
  width: 36rpx;
  height: 36rpx;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  border: 2rpx solid #fff;
  box-shadow: 0 4rpx 10rpx rgba(47, 53, 66, 0.1);
}

.bill-info { flex: 1; min-width: 0; }
.bill-main { display: flex; align-items: center; gap: 10rpx; margin-bottom: 6rpx; }
.bill-category { font-size: 30rpx; font-weight: 650; color: #2f3542; }
.bill-person-name { font-size: 20rpx; color: #a4b0be; padding: 6rpx 10rpx; border-radius: 999rpx; background: #f3f6fb; }
.bill-date { font-size: 22rpx; color: #a4b0be; }
.bill-amount { font-size: 32rpx; font-weight: 700; text-align: right; min-width: 160rpx; margin-left: 14rpx; }
.bill-amount.expense { color: #2f3542; }
.bill-amount.income { color: #55e6c1; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 92rpx 0 78rpx; }
.empty-icon { font-size: 76rpx; margin-bottom: 18rpx; }
.empty-text { color: #a4b0be; font-size: 26rpx; }
</style>