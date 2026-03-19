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
import ManagementModals from '../../views/Home/ManagementModals.vue';

const { bills, initData, exportBackupData, restoreBackupData } = useBills();
const { themeVars, currentThemeId, themeOptions, setTheme } = useTheme();

const toggleTheme = () => {
  const currentIndex = themeOptions.findIndex((t) => t.id === currentThemeId.value);
  const nextIndex = (currentIndex + 1) % themeOptions.length;
  setTheme(themeOptions[nextIndex].id);
  uni.showToast({ title: `已切换至 ${themeOptions[nextIndex].name}`, icon: 'none' });
};

const activeTab = ref<'list' | 'stats'>('list');
const selectedMonth = ref(getCurrentMonthKey());
const selectedType = ref<'expense' | 'income'>('expense');
const statMode = ref<'month' | 'year'>('month');
const sortMode = ref<'date' | 'amount'>('date');

const showAddModal = ref(false);
const showBackupModal = ref(false);
const backupStep = ref<'main' | 'import'>('main');
const showCatManager = ref(false);
const showPersonManager = ref(false);
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
  monthBills.value.filter((bill) => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0),
);

const periodExpense = computed(() =>
  monthBills.value.filter((bill) => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0),
);

const periodBalance = computed(() => periodIncome.value - periodExpense.value);

const displayedBills = computed(() => {
  return monthBills.value.filter((bill) => bill.type === selectedType.value);
});

const viewKey = computed(() => {
  const base = activeTab.value === 'list' ? `list-${selectedType.value}` : `stats-${statMode.value}`;
  return `${base}-${selectedMonth.value}`;
});

const handleAddNew = () => { editingBill.value = null; showAddModal.value = true; };
const handleEdit = (bill: Bill) => { editingBill.value = bill; showAddModal.value = true; };
const handleMonthChange = (event: any) => {
  const value = event?.detail?.value || '';
  if (value) selectedMonth.value = String(value).slice(0, 7);
};

const shiftMonth = (offset: number) => {
  const [yearStr, monthStr] = selectedMonth.value.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + offset, 1);
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  selectedMonth.value = `${date.getFullYear()}-${nextMonth}`;
};

const closeBackupModal = () => { backupStep.value = 'main'; showBackupModal.value = false; };

const handleBackupExport = () => {
  const payload = exportBackupData();
  uni.setClipboardData({
    data: payload,
    success: () => { uni.showToast({ title: '已复制备份', icon: 'success' }); closeBackupModal(); }
  });
};

const confirmRestore = (raw: string) => {
  uni.showModal({
    title: '确认导入',
    content: '这会覆盖当前所有数据，确定吗？',
    confirmColor: '#34C26B',
    success: (res) => {
      if (res.confirm) {
        restoreBackupData(raw);
        uni.showToast({ title: '导入成功', icon: 'success' });
        closeBackupModal();
      }
    }
  });
};

const handleImportClipboard = () => {
  uni.getClipboardData({
    success: (res: any) => {
      const raw = String(res.data || '').trim();
      if (raw) confirmRestore(raw);
      else uni.showToast({ title: '剪贴板无数据', icon: 'none' });
    }
  });
};

const handleImportFile = () => {
  (uni as any).chooseMessageFile({
    count: 1, type: 'file', extension: ['json', 'txt'],
    success: (res: any) => {
      const path = res?.tempFiles?.[0]?.path;
      if (!path) return;
      const fs = (globalThis as any).wx?.getFileSystemManager?.();
      fs.readFile({
        filePath: path, encoding: 'utf8',
        success: (r: any) => confirmRestore(String(r.data || '').trim())
      });
    }
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
          @prev-month="shiftMonth(-1)"
          @next-month="shiftMonth(1)"
          @pick-month="handleMonthChange"
        />
        <view class="header-actions">
          <view class="header-btn" @click="toggleTheme">🎨</view>
          <view class="header-btn" @click="showBackupModal = true">备</view>
        </view>
      </view>

      <view class="view-switcher">
        <view :class="['switch-item', activeTab === 'list' ? 'active' : '']" @click="activeTab = 'list'">明细</view>
        <view :class="['switch-item', activeTab === 'stats' ? 'active' : '']" @click="activeTab = 'stats'">统计</view>
      </view>

      <view class="type-switcher">
        <template v-if="activeTab === 'list'">
          <view :class="['type-item', selectedType === 'expense' ? 'active' : '']" @click="selectedType = 'expense'">支出</view>
          <view :class="['type-item', selectedType === 'income' ? 'active' : '']" @click="selectedType = 'income'">收入</view>
        </template>
        <template v-else>
          <view :class="['type-item', statMode === 'month' ? 'active' : '']" @click="statMode = 'month'">月度(支出)</view>
          <view :class="['type-item', statMode === 'year' ? 'active' : '']" @click="statMode = 'year'">年度(支出)</view>
        </template>
      </view>

      <!-- 排序工具栏：压在列表上方的药丸 -->
      <view v-if="activeTab === 'list'" class="list-toolbar-fixed">
        <view class="toolbar-labels">
          <text class="toolbar-title">排序方式</text>
          <text class="toolbar-hint">当前：{{ sortMode === "date" ? "按日期" : "按金额" }}</text>
        </view>
        <view class="sort-toggle">
          <view :class="['sort-pill', sortMode === 'date' ? 'active' : '']" @click="sortMode = 'date'">按日期</view>
          <view :class="['sort-pill', sortMode === 'amount' ? 'active' : '']" @click="sortMode = 'amount'">按金额</view>
        </view>
      </view>
    </view>

    <scroll-view class="scroll-content" scroll-y>
      <view :key="viewKey" class="view-content-wrap fade-in">
        <BillList v-if="activeTab === 'list'" :bills="displayedBills" :sort-mode="sortMode" @edit="handleEdit" />
        <StatsView v-else :all-bills="bills" :period-key="selectedMonth" :mode="statMode" />
      </view>
    </scroll-view>

    <view class="add-fab" @click="handleAddNew">+</view>

    <AddBillModal v-model="showAddModal" :editData="editingBill" @manage-cat="showCatManager = true" @manage-person="showPersonManager = true" />

    <view v-if="showBackupModal" class="backup-mask" @click="closeBackupModal" @touchmove.stop.prevent>
      <view class="backup-sheet" @click.stop>
        <view class="backup-header">
          <text class="backup-title">数据备份</text>
          <text class="backup-close" @click="closeBackupModal">×</text>
        </view>
        <view v-if="backupStep === 'main'" class="backup-grid">
          <view class="backup-card export-card" @click="handleBackupExport">
            <text class="backup-card-title">导出备份</text>
            <text class="backup-card-subtitle">复制 JSON 到剪贴板</text>
          </view>
          <view class="backup-card import-card" @click="backupStep = 'import'">
            <text class="backup-card-title">导入备份</text>
            <text class="backup-card-subtitle">从剪贴板或文件恢复</text>
          </view>
        </view>
        <view v-else class="backup-import-panel">
          <view class="backup-import-row" @click="handleImportClipboard"><text>从剪贴板导入</text></view>
          <view class="backup-import-row" @click="handleImportFile"><text>从文件导入</text></view>
          <view class="backup-back" @click="backupStep = 'main'"><text class="backup-back-text">返回</text></view>
        </view>
      </view>
    </view>

    <ManagementModals v-model:showCat="showCatManager" v-model:showPerson="showPersonManager" type="expense" />
  </view>
</template>

<style>
page { height: 100%; background: var(--theme-page-bg); }
.container { position: relative; display: flex; flex-direction: column; height: 100%; background: radial-gradient(circle at top left, var(--theme-accent-ambient) 0, rgba(255, 255, 255, 0) 42%), linear-gradient(180deg, var(--theme-page-bg) 0%, var(--theme-page-bg-alt) 100%); overflow: hidden; }
.ambient { position: absolute; border-radius: 50%; filter: blur(20px); opacity: 0.5; pointer-events: none; }
.ambient-a { width: 360rpx; height: 360rpx; right: -120rpx; top: -90rpx; background: rgba(255, 255, 255, 0.40); }
.ambient-b { width: 420rpx; height: 420rpx; left: -180rpx; top: 460rpx; background: var(--theme-accent-ambient); }

.fixed-header { flex-shrink: 0; padding: 24rpx 32rpx 0; position: relative; z-index: 100; /* 提高整体头部层级 */ }
.header-wrap { position: relative; margin-bottom: 18rpx; }
.header-actions { position: absolute; right: 12rpx; top: 16rpx; display: flex; gap: 12rpx; }
.header-btn { width: 68rpx; height: 68rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--theme-surface-strong); border: 1rpx solid rgba(133, 214, 158, 0.42); box-shadow: 0 10rpx 20rpx rgba(52, 101, 65, 0.08); color: var(--theme-primary); font-size: 28rpx; font-weight: 700; }

.view-switcher { display: flex; background: var(--theme-surface); border: 1rpx solid var(--theme-border); border-radius: 999rpx; padding: 6rpx; margin-bottom: 18rpx; backdrop-filter: blur(18rpx); }
.switch-item { flex: 1; text-align: center; padding: 12rpx 0; font-size: 26rpx; color: var(--theme-text-muted); border-radius: 999rpx; transition: all 0.24s ease; }
.switch-item.active { background: var(--theme-surface-strong); color: var(--theme-text); font-weight: 700; box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05); }

.type-switcher { display: flex; gap: 16rpx; margin-bottom: 18rpx; height: 72rpx; }
.type-item { flex: 1; text-align: center; line-height: 72rpx; font-size: 26rpx; color: var(--theme-text-muted); border-radius: 999rpx; background: var(--theme-surface); border: 1rpx solid var(--theme-border); transition: all 0.24s ease; }
.type-item.active { color: var(--theme-primary); font-weight: 700; background: var(--theme-surface-strong); border-color: var(--theme-primary); box-shadow: 0 6rpx 16rpx rgba(52, 101, 65, 0.08); }

/* 排序栏固定样式：使用负的 margin-bottom 实现对列表的“压制” */
.list-toolbar-fixed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: var(--theme-surface-strong);
  border-radius: 42rpx;
  margin-top: 10rpx;
  margin-bottom: -32rpx; /* 关键：负边距让列表向上抽取 */
  position: relative;
  z-index: 10; /* 确保药丸压在滚动内容上方 */
}

.toolbar-labels { display: flex; flex-direction: column; }
.toolbar-title { font-size: 28rpx; font-weight: 700; color: var(--theme-text-muted); }
.toolbar-hint { font-size: 22rpx; color: var(--theme-text-muted); margin-top: 2rpx; opacity: 0.7; }

.sort-toggle { display: inline-flex; padding: 6rpx; border-radius: 999rpx; background: var(--theme-surface); border: 1rpx solid var(--theme-border); }
.sort-pill { min-width: 110rpx; text-align: center; padding: 10rpx 16rpx; border-radius: 999rpx; font-size: 22rpx; color: var(--theme-text-muted); }
.sort-pill.active { background: var(--theme-surface-strong); color: var(--theme-text); font-weight: 700; box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05); }

.scroll-content { flex: 1; width: 100%; min-height: 0; }
.view-content-wrap { padding: 0 32rpx; min-height: 100%; display: flex; flex-direction: column; }

/* 列表卡片：取消圆角，并确保它被药丸压在下面 */
/* 强制取消列表卡片的所有圆角 */
.view-content-wrap:has(.list-content-card) .list-content-card {
  border-radius: 0 !important;
  margin-top: 0;
}
.fade-in { animation: fadeIn 0.4s ease-out both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16rpx); } to { opacity: 1; transform: translateY(0); } }

.add-fab { position: fixed; right: 28rpx; bottom: 34rpx; width: 108rpx; height: 108rpx; border-radius: 50%; background: var(--theme-fab-gradient); color: #fff; text-align: center; line-height: 108rpx; font-size: 68rpx; box-shadow: 0 18rpx 30rpx rgba(71, 126, 88, 0.25); z-index: 20; }
.backup-mask { position: fixed; inset: 0; z-index: 310; background: rgba(47, 53, 66, 0.56); display: flex; align-items: flex-end; }
.backup-sheet { width: 100%; background: linear-gradient(180deg, var(--theme-surface-strong) 0%, var(--theme-page-bg) 100%); border-radius: 42rpx 42rpx 0 0; padding: 34rpx 34rpx 40rpx; }
.backup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.backup-title { font-size: 38rpx; font-weight: 700; }
.backup-close { font-size: 40rpx; color: var(--theme-text-muted); padding: 8rpx 12rpx; }
.backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.backup-card { padding: 24rpx 22rpx; border-radius: 28rpx; border: 1rpx solid rgba(215, 232, 221, 0.95); background: var(--theme-surface-strong); }
.backup-card-title { display: block; font-size: 30rpx; font-weight: 700; margin-bottom: 8rpx; }
.backup-card-subtitle { font-size: 22rpx; color: var(--theme-text-muted); }
.backup-import-panel { display: flex; flex-direction: column; gap: 14rpx; }
.backup-import-row { padding: 24rpx 22rpx; border-radius: 24rpx; border: 1rpx solid rgba(215, 232, 221, 0.95); background: var(--theme-surface-strong); font-weight: 700; }
.backup-back { margin-top: 10rpx; text-align: center; color: var(--theme-primary); font-size: 24rpx; }
</style>
