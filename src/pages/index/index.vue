<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBills } from "../../composables/useBills";
import { useTheme } from "../../composables/useTheme";
import { useLoading } from "../../composables/useLoading";
import type { Bill } from "../../types";
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthKeyFromDate,
} from "../../utils/dateHelper";

import BillHeader from "../../components/BillHeader.vue";
import BillList from "../../views/Home/BillList.vue";
import StatsView from "../../views/Home/StatsView.vue";
import AddBillModal from "../../views/Home/AddBillModal.vue";
import ManagementModals from "../../views/Home/ManagementModals.vue";
import GlobalLoading from "../../components/GlobalLoading.vue";
import BillSkeleton from "../../components/BillSkeleton.vue";

const { bills, initData, exportBackupData, restoreBackupData } = useBills();
const { isSkeleton } = useLoading();
const { themeVars, currentThemeId, themeOptions, setTheme } = useTheme();

const toggleTheme = () => {
  const currentIndex = themeOptions.findIndex(
    (t) => t.id === currentThemeId.value,
  );
  const nextIndex = (currentIndex + 1) % themeOptions.length;
  setTheme(themeOptions[nextIndex].id);
  uni.showToast({
    title: `已切换至 ${themeOptions[nextIndex].name}`,
    icon: "none",
  });
};

const selectedMonth = ref(getCurrentMonthKey());
const sortMode = ref<"date" | "amount">("date");
// 月份切换方向：left = 向后（下一月），right = 向前（上一月）
const slideDirection = ref<"left" | "right">("left");

const showAddModal = ref(false);
const showBackupModal = ref(false);
const backupStep = ref<"main" | "import">("main");
const showCatManager = ref(false);
const showPersonManager = ref(false);
const editingBill = ref<Bill | null>(null);
const activeType = ref<"expense" | "income">("expense");

onMounted(() => {
  initData();
});

const selectedMonthLabel = computed(() =>
  formatMonthLabel(selectedMonth.value),
);
const selectedMonthPickerValue = computed(() => `${selectedMonth.value}-01`);

const monthBills = computed(() =>
  bills.value.filter(
    (bill) => getMonthKeyFromDate(String(bill.date)) === selectedMonth.value,
  ),
);

const periodIncome = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === "income")
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodExpense = computed(() =>
  monthBills.value
    .filter((bill) => bill.type === "expense")
    .reduce((sum, bill) => sum + bill.amount, 0),
);

const periodBalance = computed(() => periodIncome.value - periodExpense.value);

const displayedBills = computed(() => {
  return monthBills.value;
});

// viewKey 同时携带方向，确保每次切换 key 不同以触发动画
const viewKey = computed(() => {
  return `list-${selectedMonth.value}-${slideDirection.value}`;
});

const handleAddNew = () => {
  editingBill.value = null;
  showAddModal.value = true;
};
const handleEdit = (bill: Bill) => {
  editingBill.value = bill;
  showAddModal.value = true;
};
const goToStats = () => {
  uni.navigateTo({
    url: "/pages/stats/index",
  });
};
const handleSummaryClick = () => {
  uni.navigateTo({
    url: `/pages/stats-detail/index?month=${selectedMonth.value}`,
  });
};
const handleMonthChange = (event: any) => {
  const value = event?.detail?.value || "";
  if (!value) return;
  const next = String(value).slice(0, 7);
  slideDirection.value = next > selectedMonth.value ? "left" : "right";
  selectedMonth.value = next;
};

const shiftMonth = (offset: number) => {
  const [yearStr, monthStr] = selectedMonth.value.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + offset, 1);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  selectedMonth.value = `${date.getFullYear()}-${nextMonth}`;
};

const handlePrevMonth = () => {
  slideDirection.value = "right";
  shiftMonth(-1);
};

const handleNextMonth = () => {
  slideDirection.value = "left";
  shiftMonth(1);
};

const closeBackupModal = () => {
  backupStep.value = "main";
  showBackupModal.value = false;
};

const handleBackupExport = () => {
  const payload = exportBackupData();
  uni.setClipboardData({
    data: payload,
    success: () => {
      uni.showToast({ title: "已复制备份", icon: "success" });
      closeBackupModal();
    },
  });
};

const confirmRestore = (raw: string) => {
  uni.showModal({
    title: "确认导入",
    content: "这会覆盖当前所有数据，确定吗？",
    confirmColor: "#34C26B",
    success: (res) => {
      if (res.confirm) {
        restoreBackupData(raw);
        uni.showToast({ title: "导入成功", icon: "success" });
        closeBackupModal();
      }
    },
  });
};

const handleImportClipboard = () => {
  uni.getClipboardData({
    success: (res: any) => {
      const raw = String(res.data || "").trim();
      if (raw) confirmRestore(raw);
      else uni.showToast({ title: "剪贴板无数据", icon: "none" });
    },
  });
};

const handleImportFile = () => {
  (uni as any).chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["json", "txt"],
    success: (res: any) => {
      const path = res?.tempFiles?.[0]?.path;
      if (!path) return;
      const fs = (globalThis as any).wx?.getFileSystemManager?.();
      fs.readFile({
        filePath: path,
        encoding: "utf8",
        success: (r: any) => confirmRestore(String(r.data || "").trim()),
      });
    },
  });
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
          @prev-month="handlePrevMonth"
          @next-month="handleNextMonth"
          @pick-month="handleMonthChange"
          @click-balance="handleSummaryClick"
          @click-income="() => {}"
          @click-expense="() => {}"
        />
        <view class="header-actions">
          <view class="header-btn clickable" @click="toggleTheme">🎨</view>
          <view class="header-btn clickable" @click="showBackupModal = true"
            >备</view
          >
        </view>
      </view>

      <!-- 排序工具栏 -->
      <view class="list-toolbar-fixed">
        <view class="toolbar-labels">
          <text class="toolbar-title">排序方式</text>
          <text class="toolbar-hint"
            >当前：{{ sortMode === "date" ? "按日期" : "按金额" }}</text
          >
        </view>
        <view class="sort-toggle">
          <view
            :class="[
              'sort-pill clickable',
              sortMode === 'date' ? 'active' : '',
            ]"
            @click="sortMode = 'date'"
            >按日期</view
          >
          <view
            :class="[
              'sort-pill clickable',
              sortMode === 'amount' ? 'active' : '',
            ]"
            @click="sortMode = 'amount'"
            >按金额</view
          >
        </view>
      </view>
    </view>

    <scroll-view class="scroll-content" scroll-y>
      <!-- 骨架屏：首次数据加载中 -->
      <BillSkeleton v-if="isSkeleton" :count="5" />
      <!-- 账单列表：数据就绪后带方向动画切入 -->
      <view
        v-else
        :key="viewKey"
        class="view-content-wrap"
        :class="slideDirection === 'left' ? 'slide-in-left' : 'slide-in-right'"
      >
        <BillList
          :bills="displayedBills"
          :sort-mode="sortMode"
          @edit="handleEdit"
          class="bill-list"
        />
      </view>
    </scroll-view>

    <view v-if="false" class="stats-fab clickable" @click="goToStats">📊</view>
    <view class="add-fab clickable" @click="handleAddNew">+</view>

    <AddBillModal
      v-model="showAddModal"
      :editData="editingBill"
      @manage-cat="
        (t) => {
          activeType = t;
          showCatManager = true;
        }
      "
      @manage-person="showPersonManager = true"
    />

    <view
      v-if="showBackupModal"
      class="backup-mask"
      @click="closeBackupModal"
      @touchmove.stop.prevent
    >
      <view class="backup-sheet" @click.stop>
        <view class="backup-header">
          <text class="backup-title">数据备份</text>
          <text class="backup-close" @click="closeBackupModal">×</text>
        </view>
        <view v-if="backupStep === 'main'" class="backup-grid">
          <view
            class="backup-card export-card clickable"
            @click="handleBackupExport"
          >
            <text class="backup-card-title">导出备份</text>
            <text class="backup-card-subtitle">复制 JSON 到剪贴板</text>
          </view>
          <view
            class="backup-card import-card clickable"
            @click="backupStep = 'import'"
          >
            <text class="backup-card-title">导入备份</text>
            <text class="backup-card-subtitle">从剪贴板或文件恢复</text>
          </view>
        </view>
        <view v-else class="backup-import-panel">
          <view
            class="backup-import-row clickable"
            @click="handleImportClipboard"
            ><text>从剪贴板导入</text></view
          >
          <view class="backup-import-row clickable" @click="handleImportFile"
            ><text>从文件导入</text></view
          >
          <view class="backup-back clickable" @click="backupStep = 'main'"
            ><text class="backup-back-text">返回</text></view
          >
        </view>
      </view>
    </view>

    <ManagementModals
      v-model:showCat="showCatManager"
      v-model:showPerson="showPersonManager"
      :type="activeType"
    />

    <!-- 保留给页面跳转等全屏 loading 场景 -->
    <GlobalLoading />
  </view>
</template>

<style>
page {
  height: 100%;
  background: var(--theme-page-bg);
}
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(
      circle at top left,
      var(--theme-accent-ambient) 0,
      rgba(255, 255, 255, 0) 42%
    ),
    linear-gradient(
      180deg,
      var(--theme-page-bg) 0%,
      var(--theme-page-bg-alt) 100%
    );
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
  background: rgba(255, 255, 255, 0.4);
}
.ambient-b {
  width: 420rpx;
  height: 420rpx;
  left: -180rpx;
  top: 460rpx;
  background: var(--theme-accent-ambient);
}

.fixed-header {
  flex-shrink: 0;
  padding: 24rpx 32rpx 0;
  position: relative;
  z-index: 100;
}
.header-wrap {
  position: relative;
  margin-bottom: 32rpx;
}
.header-actions {
  position: absolute;
  right: 12rpx;
  top: 16rpx;
  display: flex;
  gap: 12rpx;
}
.header-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-surface-strong);
  border: 1rpx solid rgba(133, 214, 158, 0.42);
  box-shadow: 0 10rpx 20rpx rgba(52, 101, 65, 0.08);
  color: var(--theme-primary);
  font-size: 28rpx;
  font-weight: 700;
}

/* 排序栏固定样式 */
.list-toolbar-fixed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: var(--theme-surface-strong);
  border-radius: 42rpx;
  margin-top: 10rpx;
  margin-bottom: -32rpx;
  position: relative;
  z-index: 10;
}

.toolbar-labels {
  display: flex;
  flex-direction: column;
}
.toolbar-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-muted);
}
.toolbar-hint {
  font-size: 22rpx;
  color: var(--theme-text-muted);
  margin-top: 2rpx;
  opacity: 0.7;
}

.sort-toggle {
  display: inline-flex;
  padding: 6rpx;
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
}
.sort-pill {
  min-width: 110rpx;
  text-align: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
    font-size: 22rpx;
  color: var(--theme-text-muted);
}
.sort-pill.active {
  background: var(--theme-surface-strong);
  color: var(--theme-text);
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.scroll-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}
.bill-list {
  flex: 1;
}
.view-content-wrap {
  padding: 0 32rpx;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 月份切换方向动画 */
.slide-in-left {
  -webkit-animation: slideInFromRight 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation: slideInFromRight 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
.slide-in-right {
  -webkit-animation: slideInFromLeft 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation: slideInFromLeft 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
@-webkit-keyframes slideInFromRight {
  from { opacity: 0; -webkit-transform: translateX(36rpx); transform: translateX(36rpx); }
  to   { opacity: 1; -webkit-transform: translateX(0); transform: translateX(0); }
}
@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(36rpx); }
  to   { opacity: 1; transform: translateX(0); }
}
@-webkit-keyframes slideInFromLeft {
  from { opacity: 0; -webkit-transform: translateX(-36rpx); transform: translateX(-36rpx); }
  to   { opacity: 1; -webkit-transform: translateX(0); transform: translateX(0); }
}
@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-36rpx); }
  to   { opacity: 1; transform: translateX(0); }
}

.add-fab {
  position: fixed;
  right: 28rpx;
  bottom: 34rpx;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  background: var(--theme-fab-gradient);
  color: #fff;
  text-align: center;
  line-height: 108rpx;
  font-size: 68rpx;
  box-shadow: 0 18rpx 30rpx rgba(71, 126, 88, 0.25);
  z-index: 20;
}
.stats-fab {
  position: fixed;
  right: 28rpx;
  bottom: 156rpx;
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  background: var(--theme-fab-gradient);
  color: #fff;
  text-align: center;
  line-height: 108rpx;
  font-size: 40rpx;
  font-weight: 700;
  box-shadow: 0 18rpx 30rpx rgba(71, 126, 88, 0.25);
  z-index: 20;
}
.backup-mask {
  position: fixed;
  inset: 0;
  z-index: 310;
  background: rgba(47, 53, 66, 0.56);
  display: flex;
  align-items: flex-end;
}
.backup-sheet {
  width: 100%;
  background: linear-gradient(180deg, var(--theme-surface-strong) 0%, var(--theme-page-bg) 100%);
  border-radius: 42rpx 42rpx 0 0;
  padding: 34rpx 34rpx 40rpx;
}
.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}
.backup-title { font-size: 38rpx; font-weight: 700; }
.backup-close { font-size: 40rpx; color: var(--theme-text-muted); padding: 8rpx 12rpx; }
.backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.backup-card { padding: 24rpx 22rpx; border-radius: 28rpx; border: 1rpx solid rgba(215,232,221,0.95); background: var(--theme-surface-strong); }
.backup-card-title { display: block; font-size: 30rpx; font-weight: 700; margin-bottom: 8rpx; }
.backup-card-subtitle { font-size: 22rpx; color: var(--theme-text-muted); }
.backup-import-panel { display: flex; flex-direction: column; gap: 14rpx; }
.backup-import-row { padding: 24rpx 22rpx; border-radius: 24rpx; border: 1rpx solid rgba(215,232,221,0.95); background: var(--theme-surface-strong); font-weight: 700; }
.backup-back { margin-top: 10rpx; text-align: center; color: var(--theme-primary); font-size: 24rpx; }
</style>
