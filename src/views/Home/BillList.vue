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

    <view v-if="sortedBills.length === 0" class="empty-state">
      <text class="empty-icon">🫧</text>
      <text class="empty-text">当前筛选范围内暂无记录</text>
    </view>

    <view
      v-for="bill in sortedBills"
      :key="bill.id"
      class="bill-swipe"
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
  touchState.value = {
    id: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    swiping: false,
    locked: false,
  };
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
  if (openBillId.value !== null && openBillId.value !== id) {
    closeSwipe();
  }
  touchState.value = {
    id,
    startX: touch.clientX,
    startY: touch.clientY,
    offsetX: 0,
    swiping: false,
    locked: false,
  };
};

const handleTouchMove = (event: any, id: number) => {
  if (touchState.value.id !== id) return;
  const touch = event?.touches?.[0];
  if (!touch) return;

  const deltaX = touch.clientX - touchState.value.startX;
  const deltaY = touch.clientY - touchState.value.startY;

  if (!touchState.value.swiping) {
    if (Math.abs(deltaX) < 14) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      touchState.value.locked = true;
      return;
    }
    touchState.value.swiping = true;
  }

  if (touchState.value.locked) return;

  if (deltaX < 0) {
    touchState.value.offsetX = Math.max(deltaX, -revealWidth);
  } else {
    touchState.value.offsetX = Math.min(deltaX, 0);
  }
};

const handleTouchEnd = (_event: any, id: number) => {
  if (touchState.value.id !== id) return;
  const offsetX = touchState.value.offsetX;

  if (offsetX <= -swipeThreshold) {
    openBillId.value = id;
  } else if (openBillId.value === id) {
    openBillId.value = null;
  }

  resetTouch();
};

const handleTouchCancel = () => {
  resetTouch();
};

const getSwipeStyle = (id: number) => {
  if (touchState.value.id === id) {
    return {
      transform: `translateX(${touchState.value.offsetX}px)`,
      transition: touchState.value.swiping ? 'none' : 'transform 0.22s ease',
    };
  }
  if (openBillId.value === id) {
    return {
      transform: 'translateX(-168rpx)',
      transition: 'transform 0.22s ease',
    };
  }
  return {
    transform: 'translateX(0)',
    transition: 'transform 0.22s ease',
  };
};

const handleDelete = (id: number) => {
  removeBill(id);
  if (openBillId.value === id) {
    openBillId.value = null;
  }
};
</script>

<style scoped>
.list-section {
  background: var(--theme-card-gradient);
  border: 1rpx solid var(--theme-border);
  border-radius: 36rpx;
  padding: 24rpx 20rpx 12rpx;
  box-shadow: var(--theme-card-shadow);
  backdrop-filter: blur(18rpx);
  overflow: hidden;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 6rpx 0 18rpx;
}

.toolbar-labels { display: flex; flex-direction: column; }
.toolbar-title { font-size: 30rpx; font-weight: 700; color: var(--theme-text); }
.toolbar-hint { font-size: 24rpx; color: var(--theme-text-muted); margin-top: 4rpx; }

.sort-toggle {
  display: inline-flex;
  padding: 6rpx;
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
}

.sort-pill {
  min-width: 120rpx;
  text-align: center;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-muted);
}

.sort-pill.active {
  background: var(--theme-surface-strong);
  color: var(--theme-text);
  font-weight: 700;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
}

.bill-swipe {
  position: relative;
  overflow: hidden;
  margin-bottom: 12rpx;
  border-radius: 28rpx;
  touch-action: pan-y;
}

.bill-swipe-inner {
  display: flex;
  width: calc(100% + 168rpx);
  will-change: transform;
}

.bill-item {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border: 1rpx solid var(--theme-border);
  border-radius: 28rpx;
  background: var(--theme-surface-strong);
  box-shadow: 0 10rpx 22rpx rgba(0, 0, 0, 0.02);
}

.bill-item:active { transform: scale(0.995); box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05); }

.delete-panel {
  width: 168rpx;
  margin-left: 12rpx;
  border-radius: 28rpx;
  background: var(--theme-expense);
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
}

.bill-icon {
  width: 88rpx;
  height: 88rpx;
  background: var(--theme-primary-soft);
  border: 1rpx solid var(--theme-border);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
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
  background: var(--theme-surface-strong);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  border: 2rpx solid var(--theme-surface-strong);
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}

.bill-info { flex: 1; min-width: 0; }
.bill-main { display: flex; align-items: center; gap: 10rpx; margin-bottom: 6rpx; }
.bill-category { font-size: 34rpx; font-weight: 700; color: var(--theme-text); }
.bill-person-name { font-size: 24rpx; color: var(--theme-text-muted); padding: 6rpx 10rpx; border-radius: 999rpx; background: var(--theme-primary-soft); }
.bill-date { font-size: 24rpx; color: var(--theme-text-muted); }
.bill-amount { font-size: 34rpx; font-weight: 700; text-align: right; min-width: 160rpx; margin-left: 14rpx; }
.bill-amount.expense { color: var(--theme-text); }
.bill-amount.income { color: var(--theme-income); }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 92rpx 0 78rpx; }
.empty-icon { font-size: 76rpx; margin-bottom: 18rpx; }
.empty-text { color: var(--theme-text-muted); font-size: 28rpx; }
</style>
