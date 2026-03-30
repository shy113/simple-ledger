<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTheme } from "../../composables/useTheme";
import { useBills } from "../../composables/useBills";
import { useLoading } from "../../composables/useLoading";
import { getCurrentMonthKey } from "../../utils/dateHelper";

const { themeVars } = useTheme();
const { bills, initData, exportBackupData, restoreBackupData } = useBills();
const { showLoading } = useLoading();

const showAbout = ref(false);

onMounted(() => {
  initData();
});

const totalBills = computed(() => bills.value.length);
const totalExpense = computed(() =>
  bills.value
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + b.amount, 0),
);
const totalIncome = computed(() =>
  bills.value
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + b.amount, 0),
);
const netBalance = computed(() => totalIncome.value - totalExpense.value);

const activeDays = computed(() => {
  const days = new Set(bills.value.map((b) => String(b.date).slice(0, 10)));
  return days.size;
});

// ── 智慧分析洞察 (基于本月) ──
const insights = computed(() => {
  const currentMonth = getCurrentMonthKey();
  const monthBills = bills.value.filter(b => String(b.date).startsWith(currentMonth) && b.type === "expense");
  
  if (monthBills.length === 0) return null;

  const monthTotal = monthBills.reduce((s, b) => s + b.amount, 0);
  
  // 1. 日均支出
  const today = new Date();
  const daysCount = today.getDate();
  const dailyAverage = monthTotal / daysCount;

  // 2. 本月最高
  const maxBill = [...monthBills].sort((a, b) => b.amount - a.amount)[0];

  // 3. 最省钱的一天
  const dayMap = new Map<string, number>();
  monthBills.forEach((b) => {
    const d = String(b.date);
    dayMap.set(d, (dayMap.get(d) || 0) + b.amount);
  });
  const mostSavingDay = [...dayMap.entries()].sort((a, b) => a[1] - b[1])[0];

  return {
    dailyAverage,
    maxBill,
    mostSavingDay: mostSavingDay ? { date: mostSavingDay[0], amount: mostSavingDay[1] } : null
  };
});

// ── 人员支出排行 (基于全部数据) ──
const personStats = computed(() => {
  const expenseBills = bills.value.filter(b => b.type === "expense");
  const totalExp = expenseBills.reduce((s, b) => s + b.amount, 0);
  if (totalExp <= 0) return [];

  const totals = new Map<string, number>();
  expenseBills.forEach((bill) => {
    totals.set(bill.personName, (totals.get(bill.personName) || 0) + bill.amount);
  });

  return [...totals.entries()]
    .map(([name, amount]) => {
      const bill = expenseBills.find((b) => b.personName === name);
      return {
        name,
        amount,
        percent: (amount / totalExp) * 100,
        avatar: bill?.personAvatar || "👤",
      };
    })
    .sort((a, b) => b.amount - a.amount);
});

const openPersonDetail = (name: string) => {
  showLoading("请稍候...");
  setTimeout(() => {
    uni.navigateTo({
      url: `/pages/stats-detail/index?kind=person&name=${encodeURIComponent(name)}&mode=month`,
    });
  }, 50);
};

// ── 数据备份 ──
const handleExport = () => {
  const data = exportBackupData();
  uni.setClipboardData({
    data,
    success: () => {
      uni.showToast({
        title: "备份数据已复制到剪贴板",
        icon: "none",
        duration: 2500,
      });
    },
  });
};

// 预校验备份数据格式，返回错误信息或 null（通过）
const validateBackupJson = (raw: string): string | null => {
  let payload: any;
  try {
    payload = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return "不是合法的 JSON 格式";
  }
  if (typeof payload !== "object" || payload === null) {
    return "数据结构不正确";
  }
  if (payload.version !== 1) {
    return "版本号不匹配（需要 version: 1）";
  }
  if (!Array.isArray(payload.bills)) {
    return "缺少 bills 账单数组";
  }
  if (typeof payload.categories !== "object" || payload.categories === null) {
    return "缺少 categories 分类数据";
  }
  return null;
};

const handleImport = () => {
  uni.showModal({
    title: "从剪贴板恢复",
    content: "请确保剪贴板中有有效的备份数据，导入后将覆盖现有数据。",
    confirmText: "导入",
    cancelText: "取消",
    success: (res) => {
      if (!res.confirm) return;
      uni.getClipboardData({
        success: (clip) => {
          if (!clip.data || !clip.data.trim()) {
            uni.showModal({
              title: "剪贴板为空",
              content: "未检测到备份数据，请先导出备份后复制，再执行导入。",
              showCancel: false,
              confirmText: "知道了",
            });
            return;
          }
          const err = validateBackupJson(clip.data);
          if (err) {
            uni.showModal({
              title: "格式不符，导入取消",
              content: `数据校验失败：${err}。\n\n当前数据未做任何修改，请检查剪贴板内容后重试。`,
              showCancel: false,
              confirmText: "知道了",
            });
            return;
          }
          // 格式通过，执行恢复
          restoreBackupData(clip.data);
          // 延迟显示成功提示（等 restoreBackupData 内部 setTimeout 完成）
          setTimeout(() => {
            uni.showToast({
              title: "导入成功 ✓",
              icon: "success",
              duration: 2000,
            });
          }, 600);
        },
      });
    },
  });
};

const menuItems = [
  { icon: "📋", label: "关于应用", sub: "版本信息与作者", key: "about" },
];

const onMenu = (key: string) => {
  if (key === "export") {
    handleExport();
    return;
  }
  if (key === "import") {
    handleImport();
    return;
  }
  if (key === "about") {
    showAbout.value = true;
    return;
  }
};
</script>

<template>
  <view class="page" :style="themeVars">
    <!-- 背景装饰 -->
    <view class="bg-blob bg-blob-a"></view>
    <view class="bg-blob bg-blob-b"></view>

    <scroll-view scroll-y class="scroll">
      <!-- 顶部 Hero -->
      <view class="hero">
        <view class="hero-avatar">
          <text class="hero-emoji">🌿</text>
        </view>
        <text class="hero-name">蜉蝣简账</text>
        <text class="hero-sub">轻记录，慢生活</text>
      </view>

      <!-- 数据概览 -->
      <view class="stats-row">
        <view class="stat-cell">
          <text class="stat-val">{{ totalBills }}</text>
          <text class="stat-label">账单总数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-cell">
          <text class="stat-val">{{ activeDays }}</text>
          <text class="stat-label">记账天数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-cell">
          <text
            class="stat-val"
            :class="netBalance >= 0 ? 'income-color' : 'expense-color'"
          >
            {{ netBalance >= 0 ? "+" : "" }}{{ netBalance.toFixed(0) }}
          </text>
          <text class="stat-label">净结余</text>
        </view>
      </view>

      <!-- 财务洞察 -->
      <view class="insights-grid" v-if="insights">
        <view class="insight-item insight-daily">
          <text class="insight-label">本月日均</text>
          <view class="insight-value-row">
            <text class="insight-symbol">¥</text>
            <text class="insight-value">{{ insights.dailyAverage.toFixed(0) }}</text>
          </view>
          <text class="insight-hint">消费节奏</text>
        </view>
        <view class="insight-item insight-max">
          <text class="insight-label">本月最高</text>
          <view class="insight-value-row">
            <text class="insight-symbol">¥</text>
            <text class="insight-value">{{ insights.maxBill?.amount.toFixed(0) }}</text>
          </view>
          <text class="insight-hint">{{ insights.maxBill?.category }}支出</text>
        </view>
        <view class="insight-item insight-saving">
          <text class="insight-label">本月最省</text>
          <view class="insight-value-row">
            <text class="insight-symbol">¥</text>
            <text class="insight-value">{{ insights.mostSavingDay?.amount.toFixed(0) }}</text>
          </view>
          <text class="insight-hint">{{ insights.mostSavingDay?.date.slice(8) }}日</text>
        </view>
      </view>

      <!-- 家庭支出排行 -->
      <view class="section-card person-compare-card" v-if="personStats.length > 0">
        <view class="section-title">家庭支出排行</view>
        <view class="person-ranking-board">
          <view
            v-for="(item, index) in personStats.slice(0, 3)"
            :key="item.name"
            class="ranking-row clickable"
            @click="openPersonDetail(item.name)"
          >
            <view class="ranking-num">
              <text :class="['num-text', index < 3 ? 'num-top' : '']">{{ index + 1 }}</text>
            </view>
            <view class="ranking-avatar-box">
              <text class="ranking-avatar">{{ item.avatar }}</text>
            </view>
            <view class="ranking-main">
              <view class="ranking-info-top">
                <text class="ranking-name">{{ item.name }}</text>
                <text class="ranking-amount">¥{{ item.amount.toFixed(0) }}</text>
              </view>
              <view class="ranking-bar-bg">
                <view 
                  class="ranking-bar-fill" 
                  :style="{ 
                    width: item.percent + '%',
                    background: index === 0 ? 'var(--theme-fab-gradient)' : 'var(--theme-primary)'
                  }"
                ></view>
              </view>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="section-card menu-card">
        <view
          v-for="(item, index) in menuItems"
          :key="item.key"
          :class="[
            'menu-item',
            index < menuItems.length - 1 ? 'menu-item-border' : '',
          ]"
          @click="onMenu(item.key)"
        >
          <view class="menu-icon-wrap">
            <text class="menu-icon">{{ item.icon }}</text>
          </view>
          <view class="menu-text">
            <text class="menu-label">{{ item.label }}</text>
            <text class="menu-sub">{{ item.sub }}</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 底部签名 -->
      <view class="footer">
        <text class="footer-text">蜉寄于天地，蝣乐于当下</text>
        <text class="footer-ver">v1.0.0</text>
      </view>
    </scroll-view>

    <!-- 关于弹窗 -->
    <view v-if="showAbout" class="modal-mask" @click.self="showAbout = false">
      <view class="modal-box">
        <!-- 顶部装饰 -->
        <view class="modal-hero">
          <view class="modal-avatar"
            ><text class="modal-avatar-emoji">🌿</text></view
          >
          <text class="modal-app-name">蜉蝣简账</text>
          <text class="modal-app-slogan">轻记录，慢生活</text>
        </view>

        <!-- 隐私声明 -->
        <view class="modal-privacy">
          <text class="privacy-icon">🔒</text>
          <view class="privacy-text">
            <text class="privacy-title">数据绝对私密</text>
            <text class="privacy-desc"
              >所有数据仅存储在本机，不上传任何服务器，无需注册，无任何追踪</text
            >
          </view>
        </view>

        <!-- 介绍文字 -->
        <text class="modal-body"
          >一款极简风格的个人记账小程序，专注于记录日常收支，只希望帮你保留每一笔生活的痕迹。</text
        >

        <!-- 作者信息 -->
        <view class="modal-author">
          <view class="author-row">
            <text class="author-key">作者</text>
            <text class="author-val">guzhaoheng</text>
          </view>
          <view class="author-divider"></view>
          <view class="author-row">
            <text class="author-key">邮箱</text>
            <text class="author-val">2369118064@qq.com</text>
          </view>
          <view class="author-divider"></view>
          <view class="author-row">
            <text class="author-key">邮箱</text>
            <text class="author-val">guzhaoheng@anthropic.com</text>
          </view>
          <view class="author-divider"></view>
          <view class="author-row">
            <text class="author-key">版本</text>
            <text class="author-val">v1.0.0</text>
          </view>
        </view>

        <view class="modal-btn" @click="showAbout = false">知道了</view>
      </view>
    </view>
  </view>
</template>

<style>
page {
  height: 100%;
  background: var(--theme-page-bg);
}

.page {
  position: relative;
  min-height: 100%;
  background: var(--theme-page-bg);
  overflow: hidden;
}

.scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 0 0 48rpx;
}

/* 背景装饰 */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40rpx);
  pointer-events: none;
  z-index: 0;
}

.bg-blob-a {
  width: 480rpx;
  height: 480rpx;
  top: -160rpx;
  right: -160rpx;
  background: var(--theme-accent-ambient);
}

.bg-blob-b {
  width: 360rpx;
  height: 360rpx;
  bottom: 200rpx;
  left: -120rpx;
  background: var(--theme-primary-soft);
}

/* Hero */
.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
}

.hero-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: var(--theme-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 28rpx var(--theme-accent-ambient);
  animation: avatar-breathe 2.8s ease-in-out infinite;
}

.hero-emoji {
  font-size: 72rpx;
  line-height: 1;
}

.hero-name {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--theme-text);
  letter-spacing: 2rpx;
}

.hero-sub {
  font-size: 26rpx;
  color: var(--theme-text-muted);
  margin-top: 8rpx;
}

/* 数据概览条 */
.stats-row {
  position: relative;
  z-index: 1;
  margin: 0 24rpx 20rpx;
  padding: 28rpx 0;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 8rpx 24rpx rgba(110, 123, 144, 0.1);
  backdrop-filter: blur(12rpx);
  display: flex;
  align-items: center;
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.stat-val {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--theme-text);
  line-height: 1.1;
}

.stat-label {
  font-size: 22rpx;
  color: var(--theme-text-muted);
}

.stat-divider {
  width: 1rpx;
  height: 56rpx;
  background: rgba(200, 205, 215, 0.4);
}

.income-color {
  color: var(--theme-income);
}
.expense-color {
  color: var(--theme-expense);
}

/* 财务洞察网格 */
.insights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin: 0 24rpx 24rpx;
}

.insight-item {
  background: rgba(255, 255, 255, 0.88);
  padding: 24rpx 16rpx;
  border-radius: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8rpx 24rpx rgba(110, 123, 144, 0.08);
}

.insight-label {
  font-size: 20rpx;
  color: var(--theme-text-muted);
  font-weight: 500;
  margin-bottom: 8rpx;
}

.insight-value-row {
  display: flex;
  align-items: baseline;
  gap: 2rpx;
  margin-bottom: 4rpx;
}

.insight-symbol {
  font-size: 18rpx;
  color: var(--theme-text);
  font-weight: 600;
}

.insight-value {
  font-size: 34rpx;
  font-weight: 900;
  color: var(--theme-text);
}

.insight-hint {
  font-size: 18rpx;
  color: var(--theme-primary-strong);
  background: var(--theme-primary-soft);
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-weight: 600;
  white-space: nowrap;
}

.insight-max .insight-hint {
  color: var(--theme-expense);
  background: var(--theme-expense-soft);
}

/* 卡片通用 */
.section-card {
  position: relative;
  z-index: 1;
  margin: 0 24rpx 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 8rpx 24rpx rgba(110, 123, 144, 0.1);
  backdrop-filter: blur(12rpx);
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 20rpx;
}

/* 人员排行看板 */
.person-ranking-board {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ranking-num {
  width: 32rpx;
  display: flex;
  justify-content: center;
}

.num-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--theme-text-muted);
  opacity: 0.5;
}

.num-top {
  color: var(--theme-primary);
  opacity: 1;
}

.ranking-avatar-box {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: var(--theme-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ranking-avatar {
  font-size: 30rpx;
}

.ranking-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.ranking-info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ranking-name {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--theme-text);
}

.ranking-amount {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--theme-text-muted);
}

.ranking-bar-bg {
  height: 10rpx;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 999rpx;
  overflow: hidden;
}

.ranking-bar-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 功能菜单 */
.menu-card {
  padding: 0;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 24rpx;
  transition: background 0.15s ease;
}

.menu-item:active {
  background: rgba(240, 242, 246, 0.9);
}

.menu-item-border {
  border-bottom: 1rpx solid rgba(230, 232, 238, 0.5);
}

.menu-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: var(--theme-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon {
  font-size: 32rpx;
}

.menu-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.menu-label {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--theme-text);
}

.menu-sub {
  font-size: 22rpx;
  color: var(--theme-text-muted);
}

.menu-arrow {
  font-size: 32rpx;
  color: #c8cdd8;
}

/* 底部 */
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 40rpx 0 20rpx;
}

.footer-text {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  letter-spacing: 1rpx;
}

.footer-ver {
  font-size: 20rpx;
  color: rgba(160, 165, 175, 0.7);
}

/* 关于弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6rpx);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.modal-box {
  width: 100%;
  border-radius: 40rpx;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 32rpx 64rpx rgba(0, 0, 0, 0.2);
}

/* 弹窗顶部 hero */
.modal-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 44rpx 40rpx 32rpx;
  background: linear-gradient(
    160deg,
    var(--theme-accent-ambient) 0%,
    var(--theme-primary-soft) 100%
  );
}

.modal-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
  animation: avatar-breathe 2.8s ease-in-out infinite;
}

.modal-avatar-emoji {
  font-size: 52rpx;
  line-height: 1;
}

.modal-app-name {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--theme-text);
  letter-spacing: 2rpx;
}

.modal-app-slogan {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  margin-top: 6rpx;
}

@keyframes avatar-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.86;
  }
}

/* 隐私声明 */
.modal-privacy {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin: 24rpx 32rpx 0;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: rgba(42, 191, 150, 0.1);
  border: 1rpx solid rgba(42, 191, 150, 0.2);
}

.privacy-icon {
  font-size: 36rpx;
  line-height: 1.2;
  flex-shrink: 0;
}

.privacy-text {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.privacy-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1a8f6a;
}

.privacy-desc {
  font-size: 22rpx;
  line-height: 1.7;
  color: #4aab86;
}

/* 介绍文字 */
.modal-body {
  display: block;
  font-size: 26rpx;
  line-height: 1.9;
  color: var(--theme-text-muted);
  margin: 20rpx 32rpx;
}

/* 作者信息表格 */
.modal-author {
  margin: 0 32rpx 28rpx;
  border-radius: 20rpx;
  overflow: hidden;
  border: 1rpx solid rgba(220, 222, 230, 0.6);
}

.author-row {
  display: flex;
  align-items: center;
  padding: 18rpx 24rpx;
  background: rgba(248, 249, 252, 0.8);
}

.author-divider {
  height: 1rpx;
  background: rgba(220, 222, 230, 0.5);
}

.author-key {
  font-size: 24rpx;
  color: var(--theme-text-muted);
  width: 80rpx;
  flex-shrink: 0;
}

.author-val {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-text);
}

.modal-btn {
  margin: 0 32rpx 32rpx;
  height: 88rpx;
  border-radius: 999rpx;
  background: var(--theme-fab-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx var(--theme-accent-ambient);
}
</style>
