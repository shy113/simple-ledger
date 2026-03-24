<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTheme } from "../../composables/useTheme";
import { useBills } from "../../composables/useBills";

const { themeVars } = useTheme();
const { bills, initData, exportBackupData, restoreBackupData } = useBills();

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

const topCategory = computed(() => {
  const map = new Map<string, number>();
  bills.value
    .filter((b) => b.type === "expense")
    .forEach((b) => map.set(b.category, (map.get(b.category) ?? 0) + 1));
  if (map.size === 0) return null;
  const [name] = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  return name;
});

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
  // { icon: "📤", label: "导出备份", sub: "复制数据到剪贴板", key: "export" },
  // { icon: "📥", label: "从备份恢复", sub: "从剪贴板导入数据", key: "import" },
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

      <!-- 财务快照 -->
      <view class="snapshot-card">
        <view class="snapshot-title">财务快照</view>
        <view class="snapshot-row">
          <view class="snapshot-item">
            <view class="snapshot-icon expense-bg">💸</view>
            <view class="snapshot-info">
              <text class="snapshot-sub">累计支出</text>
              <text class="snapshot-amount expense-color"
                >¥{{ totalExpense.toFixed(2) }}</text
              >
            </view>
          </view>
          <view class="snapshot-item">
            <view class="snapshot-icon income-bg">💰</view>
            <view class="snapshot-info">
              <text class="snapshot-sub">累计收入</text>
              <text class="snapshot-amount income-color"
                >¥{{ totalIncome.toFixed(2) }}</text
              >
            </view>
          </view>
        </view>
        <view v-if="topCategory" class="snapshot-tip">
          <text class="tip-emoji">🔥</text>
          <text class="tip-text">你最常记录的消费是「{{ topCategory }}」</text>
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

/* 卡片通用 */
.snapshot-card,
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

/* 财务快照 */
.snapshot-title,
.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 20rpx;
}

.snapshot-row {
  display: flex;
  gap: 16rpx;
}

.snapshot-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(248, 249, 252, 0.8);
}

.snapshot-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  flex-shrink: 0;
}

.expense-bg {
  background: var(--theme-expense-soft);
}
.income-bg {
  background: var(--theme-income-soft);
}

.snapshot-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.snapshot-sub {
  font-size: 22rpx;
  color: var(--theme-text-muted);
}

.snapshot-amount {
  font-size: 28rpx;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.snapshot-tip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 18rpx;
  padding: 14rpx 18rpx;
  border-radius: 16rpx;
  background: var(--theme-primary-soft);
}

.tip-emoji {
  font-size: 28rpx;
}

.tip-text {
  font-size: 24rpx;
  color: var(--theme-primary-strong);
  font-weight: 500;
}

/* 主题切换 */
.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(240, 242, 246, 0.8);
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.theme-chip-active {
  background: var(--theme-primary-soft);
  border-color: var(--theme-primary);
}

.chip-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-label {
  font-size: 26rpx;
  color: var(--theme-text);
  font-weight: 500;
}

.chip-check {
  font-size: 22rpx;
  color: var(--theme-primary);
  font-weight: 800;
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
