<template>
  <view class="list-content-card">
    <view class="list-content-wrap">
      <!-- 空白页占位 -->
      <view v-if="sortedBills.length === 0" class="empty-placeholder staggered-item" style="--delay: 1">
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

      <!-- 列表内容：增加 staggered-item 类用于动画 -->
      <view
        v-else
        v-for="(bill, index) in sortedBills"
        :key="bill.id"
        class="bill-swipe staggered-item"
        :style="{ '--delay': index }"
        :class="{ open: openBillId === bill.id }"
        @touchstart="handleTouchStart($event, bill.id)"
        @touchmove="handleTouchMove($event, bill.id)"
        @touchend="handleTouchEnd($event, bill.id)"
        @touchcancel="handleTouchCancel"
      >
        <view class="bill-swipe-inner" :style="getSwipeStyle(bill.id)">
          <view class="bill-item clickable" @tap="handleItemTap(bill)">
            <view class="bill-icon">
              {{ getIcon(bill.category) }}
              <view class="bill-avatar-badge">{{ bill.personAvatar }}</view>
            </view>
            <view class="bill-info">
              <view class="bill-main">
                <text class="bill-category">{{ bill.category }}</text>
                <text class="bill-person-name">{{ bill.personName }}</text>
              </view>
              <text class="bill-date">{{ bill.date }}{{ bill.note ? " · " + bill.note : "" }}</text>
            </view>
            <view :class="['bill-amount', bill.type]">
              {{ bill.type === "expense" ? "-" : "+" }}{{ bill.amount.toFixed(2) }}
            </view>
          </view>
          <view class="delete-panel clickable" @tap.stop="handleDelete(bill.id)">
            <text class="delete-text">删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useBills } from "../../composables/useBills";
import type { Bill } from "../../types";

const props = defineProps<{
  bills: Bill[];
  sortMode: "date" | "amount";
}>();

const emit = defineEmits<{ (e: "edit", bill: Bill): void }>();

const { categories, removeBill } = useBills();
const openBillId = ref<number | null>(null);
const touchState = ref({
  id: null as number | null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  swiping: false,
  locked: false,
});
const revealWidth = 168;
const swipeThreshold = 48;

const sortedBills = computed(() => {
  const list = [...props.bills];
  if (props.sortMode === "amount") {
    return list.sort((a, b) => b.amount - a.amount || String(b.date).localeCompare(String(a.date)));
  }
  return list.sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
});

const getIcon = (name: string) => {
  const all = [...categories.value.expense, ...categories.value.income];
  return all.find((cat) => cat.name === name)?.icon || "📒";
};

const resetTouch = () => {
  touchState.value = { id: null, startX: 0, startY: 0, offsetX: 0, swiping: false, locked: false };
};
const closeSwipe = () => {
  openBillId.value = null;
  resetTouch();
};
const handleItemTap = (bill: Bill) => {
  if (openBillId.value !== null) {
    closeSwipe();
    return;
  }
  emit("edit", bill);
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
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      touchState.value.locked = true;
      return;
    }
    touchState.value.swiping = true;
  }
  if (touchState.value.locked) return;
  touchState.value.offsetX = deltaX < 0 ? Math.max(deltaX, -revealWidth) : Math.min(deltaX, 0);
};
const handleTouchEnd = (_event: any, id: number) => {
  if (touchState.value.id !== id) return;
  if (touchState.value.offsetX <= -swipeThreshold) openBillId.value = id;
  else if (openBillId.value === id) openBillId.value = null;
  resetTouch();
};
const handleTouchCancel = () => resetTouch();
const getSwipeStyle = (id: number) => {
  if (touchState.value.id === id)
    return {
      transform: `translateX(${touchState.value.offsetX}px)`,
      transition: touchState.value.swiping ? "none" : "transform 0.22s ease",
    };
  return {
    transform: openBillId.value === id ? "translateX(-168rpx)" : "translateX(0)",
    transition: "transform 0.22s ease",
  };
};
const handleDelete = (id: number) => {
  removeBill(id);
  if (openBillId.value === id) openBillId.value = null;
};
</script>

<style scoped>
/* 内容卡片层：完全扁平化 */
.list-content-card {
  background: var(--theme-card-gradient);
  border: none;
  border-radius: 0;
  position: relative;
}

.list-content-wrap {
  padding: 48rpx 24rpx 32rpx;
}

/* 列表项入场动画：交错效果 */
.staggered-item {
  animation: itemFadeIn 0.45s ease-out both;
  animation-delay: calc(var(--delay) * 0.05s);
  will-change: opacity, transform;
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bill-swipe {
  position: relative;
  overflow: hidden;
  margin-bottom: 16rpx;
  border-radius: 32rpx;
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
  padding: 28rpx 24rpx;
  border: 1rpx solid var(--theme-border);
  border-radius: 32rpx;
  background: transparent;
}
.bill-item:active {
  background: rgba(0, 0, 0, 0.02);
}

.delete-panel {
  width: 168rpx;
  margin-left: 12rpx;
  border-radius: 32rpx;
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

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* 改为靠上，通过 padding 控制位置 */
  flex: 1;
  min-height: 800rpx;
  padding: 120rpx 0 40rpx; /* 增加顶部间距，使视觉中心上移 */
}
.empty-icon-wrap {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}
.empty-emoji {
  font-size: 80rpx;
  z-index: 2;
}
.empty-circle {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  background: var(--theme-primary-soft);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.2;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}
.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 12rpx;
}
.empty-tips {
  font-size: 26rpx;
  color: var(--theme-text-muted);
  margin-bottom: 60rpx;
}
.empty-footer {
  border-top: 1rpx dashed var(--theme-border);
  padding-top: 30rpx;
  width: 60%;
  text-align: center;
}
.empty-footer text {
  font-size: 22rpx;
  color: var(--theme-text-muted);
  font-style: italic;
}

.bill-icon {
  width: 92rpx;
  height: 92rpx;
  background: var(--theme-primary-soft);
  border: 1rpx solid var(--theme-border);
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42rpx;
  margin-right: 24rpx;
  position: relative;
  flex-shrink: 0;
}
.bill-avatar-badge {
  position: absolute;
  bottom: -6rpx;
  right: -6rpx;
  width: 38rpx;
  height: 38rpx;
  background: var(--theme-surface-strong);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  border: 2rpx solid var(--theme-surface-strong);
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}
.bill-info {
  flex: 1;
  min-width: 0;
}
.bill-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.bill-category {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text);
}
.bill-person-name {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--theme-primary-soft);
}
.bill-date {
  font-size: 24rpx;
  color: var(--theme-text-muted);
}
.bill-amount {
  font-size: 36rpx;
  font-weight: 700;
  text-align: right;
  min-width: 160rpx;
  margin-left: 14rpx;
}
.bill-amount.expense {
  color: var(--theme-text);
}
.bill-amount.income {
  color: var(--theme-income);
}
</style>
