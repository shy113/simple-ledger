<template>
  <view class="list-section">
    <view class="section-header">
      <text class="title">账单记录</text>
      <text class="count">{{ bills.length }} 笔记录</text>
    </view>

    <view v-if="bills.length === 0" class="empty-state">
      <text class="empty-icon">💸</text>
      <text class="empty-text">记录从这里开始</text>
    </view>

    <!-- 点击触发编辑，长按触发删除 -->
    <view 
      v-for="bill in sortedBills" 
      :key="bill.id" 
      class="bill-item" 
      @click="$emit('edit', bill)"
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
        <text class="bill-date">{{ bill.date }} {{ bill.note ? '· ' + bill.note : '' }}</text>
      </view>
      <view :class="['bill-amount', bill.type]">
        {{ bill.type === 'expense' ? '-' : '+' }}{{ bill.amount.toFixed(2) }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useBills } from '../../composables/useBills';
import type { Bill } from '../../types';

const { bills, sortedBills, categories, removeBill } = useBills();

defineEmits(['edit']);

const getIcon = (name: string) => {
  const all = [...categories.value.expense, ...categories.value.income];
  return all.find(c => c.name === name)?.icon || '📦';
};

const onDelete = (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条账单吗？',
    confirmColor: '#FF3B30',
    success: (res) => { if (res.confirm) removeBill(id); }
  });
};
</script>

<style scoped>
/* 保持原有样式不变 */
.list-section { background: white; border-radius: 40rpx; padding: 40rpx 30rpx; }
.section-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; }
.title { font-size: 34rpx; font-weight: 600; color: #333; }
.count { font-size: 24rpx; color: #999; }
.bill-item { display: flex; align-items: center; padding: 30rpx 0; border-bottom: 1rpx solid #F5F5F5; transition: background 0.2s; }
.bill-item:active { background: #FAFAFA; }
.bill-icon { width: 90rpx; height: 90rpx; background: #F8F9FB; border-radius: 25rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 25rpx; position: relative; }
.bill-avatar-badge { position: absolute; bottom: -5rpx; right: -5rpx; width: 40rpx; height: 40rpx; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; border: 2rpx solid #FFF; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1); }
.bill-main { display: flex; align-items: center; gap: 10rpx; }
.bill-category { font-size: 30rpx; font-weight: 500; color: #333; }
.bill-person-name { font-size: 20rpx; color: #999; }
.bill-date { font-size: 24rpx; color: #BBB; }
.bill-amount { font-size: 34rpx; font-weight: 700; text-align: right; min-width: 180rpx; }
.bill-amount.expense { color: #333; }
.bill-amount.income { color: #2ECC71; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { color: #BBB; font-size: 28rpx; }
</style>
