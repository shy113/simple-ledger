<template>
  <view class="list-section">
    <view class="list-toolbar">
      <view class="toolbar-labels">
        <text class="toolbar-title">排序方式</text>
        <text class="toolbar-hint">当前：{{ sortMode === 'date' ? '按日期' : '按金额' }}</text>
      </view>
      <view class="sort-toggle">
        <view :class="['sort-pill', sortMode === 'date' ? 'active' : '']" @tap="sortMode = 'date'">按日期</view>
        <view :class="['sort-pill', sortMode === 'amount' ? 'active' : '']" @tap="sortMode = 'amount'">按金额</view>
      </view>
    </view>

    <!-- 空白页占位 (到底设计) -->
    <view v-if="sortedBills.length === 0" class="empty-placeholder fade-in">
      <view class="empty-icon-wrap">
        <text class="empty-emoji">🫧</text>
        <view class="empty-circle"></view>
      </view>
      <text class="empty-title">明细空空如也</text>
      <text class="empty-tips">暂时没有找到任何账单记录</text>
      <view class="empty-footer">
        <text>点击右下角按钮，记下第一笔吧</text>
      </view>
    </view>

    <view
      v-else
      v-for="bill in sortedBills"
      :key="bill.id"
      class="bill-swipe fade-in"
      :class="{ open: openBillId === bill.id }"
      @touchstart="handleTouchStart($event, bill.id)"
      @touchmove="handleTouchMove($event, bill.id)"
      @touchend="handleTouchEnd($event, bill.id)"
      @touchcancel="handleTouchCancel"
    >
      <view class="bill-swipe-inner" :style="getSwipeStyle(bill.id)">
        <view class="bill-item" @tap="handleItemTap(bill)">
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

        <view class="delete-panel" @tap.stop="handleDelete(bill.id)">
          <text class="delete-text">删除</text>
        </view>
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
const openBillId = ref<number | null>(null);
const touchState = ref({
  id: null as number | null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  swiping: false,
  locked: false,
});
const swipeThreshold = 48;
const revealWidth = 168;

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

const resetTouch = () => {
  touchState.value = { id: null, startX: 0, startY: 0, offsetX: 0, swiping: false, locked: false };
};

const closeSwipe = () => {
  openBillId.value = null;
  resetTouch();
};

const handleItemTap = (bill: Bill) => {
  if (openBillId.value === bill.id) {
    closeSwipe();
    return;
  }
  if (openBillId.value !== null) {
    closeSwipe();
    return;
  }
  emit('edit', bill);
};

const handleTouchStart = (event: any, id: number) => {
  const touch = event?.touches?.[0];
  if (!touch) return;
  if (openBillId.value !== null && openBillId.value !== id) closeSwipe();
  touchState.value = { id, startX: touch.clientX, startY: touch.clientY, offsetX: 0, swiping: false, locked: false };
};

const handleTouchMove = (event: any, id: number) => {
  if (touchState.value.id !== id) return;
  const touch = event?.touches?.[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchState.value.startX;
  const deltaY = touch.clientY - touchState.value.startY;
  if (!touchState.value.swiping) {
    if (Math.abs(deltaX) < 14) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) { touchState.value.locked = true; return; }
    touchState.value.swiping = true;
  }
  if (touchState.value.locked) return;
  if (deltaX < 0) touchState.value.offsetX = Math.max(deltaX, -revealWidth);
  else touchState.value.offsetX = Math.min(deltaX, 0);
};

const handleTouchEnd = (_event: any, id: number) => {
  if (touchState.value.id !== id) return;
  const offsetX = touchState.value.offsetX;
  if (offsetX <= -swipeThreshold) openBillId.value = id;
  else if (openBillId.value === id) openBillId.value = null;
  resetTouch();
};

const handleTouchCancel = () => resetTouch();

const getSwipeStyle = (id: number) => {
  if (touchState.value.id === id) {
    return { transform: `translateX(${touchState.value.offsetX}px)`, transition: touchState.value.swiping ? 'none' : 'transform 0.22s ease' };
  }
  if (openBillId.value === id) return { transform: 'translateX(-168rpx)', transition: 'transform 0.22s ease' };
  return { transform: 'translateX(0)', transition: 'transform 0.22s ease' };
};

const handleDelete = (id: number) => {
  removeBill(id);
  if (openBillId.value === id) openBillId.value = null;
};
</script>

<style scoped>
.list-section {
  background: var(--theme-card-gradient);
  border: 1rpx solid var(--theme-border);
  border-radius: 42rpx;
  padding: 24rpx 20rpx 20rpx;
  box-shadow: var(--theme-card-shadow);
  backdrop-filter: blur(18rpx);
  overflow: hidden;
}

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.list-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16rpx; padding: 6rpx 0 24rpx; }
.toolbar-labels { display: flex; flex-direction: column; }
.toolbar-title { font-size: 30rpx; font-weight: 700; color: var(--theme-text); }
.toolbar-hint { font-size: 24rpx; color: var(--theme-text-muted); margin-top: 4rpx; }

.sort-toggle { display: inline-flex; padding: 6rpx; border-radius: 999rpx; background: var(--theme-surface); border: 1rpx solid var(--theme-border); }
.sort-pill { min-width: 120rpx; text-align: center; padding: 12rpx 18rpx; border-radius: 999rpx; font-size: 24rpx; color: var(--theme-text-muted); }
.sort-pill.active { background: var(--theme-surface-strong); color: var(--theme-text); font-weight: 700; box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05); }

/* 空白占位 */
.empty-placeholder {
  flex: 1;
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}
.empty-icon-wrap { position: relative; width: 180rpx; height: 180rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 30rpx; }
.empty-emoji { font-size: 80rpx; z-index: 2; }
.empty-circle { position: absolute; width: 120rpx; height: 120rpx; background: var(--theme-primary-soft); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.2; }
  100% { transform: scale(0.95); opacity: 0.5; }
}
.empty-title { font-size: 34rpx; font-weight: 700; color: var(--theme-text); margin-bottom: 12rpx; }
.empty-tips { font-size: 26rpx; color: var(--theme-text-muted); margin-bottom: 60rpx; }
.empty-footer { border-top: 1rpx dashed var(--theme-border); padding-top: 30rpx; width: 60%; text-align: center; }
.empty-footer text { font-size: 22rpx; color: var(--theme-text-muted); font-style: italic; }

.bill-swipe { position: relative; overflow: hidden; margin-bottom: 16rpx; border-radius: 32rpx; touch-action: pan-y; }
.bill-swipe-inner { display: flex; width: calc(100% + 168rpx); will-change: transform; }
.bill-item { flex: 1; display: flex; align-items: center; padding: 28rpx 24rpx; border: 1rpx solid var(--theme-border); border-radius: 32rpx; background: var(--theme-surface-strong); box-shadow: 0 10rpx 22rpx rgba(0, 0, 0, 0.02); }
.bill-item:active { transform: scale(0.995); }
.delete-panel { width: 168rpx; margin-left: 12rpx; border-radius: 32rpx; background: var(--theme-expense); display: flex; align-items: center; justify-content: center; }
.delete-text { color: #ffffff; font-size: 28rpx; font-weight: 700; }

.bill-icon { width: 92rpx; height: 92rpx; background: var(--theme-primary-soft); border: 1rpx solid var(--theme-border); border-radius: 28rpx; display: flex; align-items: center; justify-content: center; font-size: 42rpx; margin-right: 24rpx; position: relative; flex-shrink: 0; }
.bill-avatar-badge { position: absolute; bottom: -6rpx; right: -6rpx; width: 38rpx; height: 38rpx; background: var(--theme-surface-strong); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; border: 2rpx solid var(--theme-surface-strong); box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1); }
.bill-info { flex: 1; min-width: 0; }
.bill-main { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.bill-category { font-size: 34rpx; font-weight: 700; color: var(--theme-text); }
.bill-person-name { font-size: 24rpx; color: var(--theme-text-muted); padding: 4rpx 12rpx; border-radius: 999rpx; background: var(--theme-primary-soft); }
.bill-date { font-size: 24rpx; color: var(--theme-text-muted); }
.bill-amount { font-size: 36rpx; font-weight: 700; text-align: right; min-width: 160rpx; margin-left: 14rpx; }
.bill-amount.expense { color: var(--theme-text); }
.bill-amount.income { color: var(--theme-income); }
</style>
