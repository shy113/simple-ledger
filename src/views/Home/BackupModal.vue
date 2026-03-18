<template>
  <view v-if="modelValue" class="modal-mask" @click="$emit('update:modelValue', false)">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">数据备份</text>
        <text class="close-btn" @click="$emit('update:modelValue', false)">×</text>
      </view>

      <text class="modal-desc">导出会把账单、分类和人物打包成 JSON；导入会覆盖当前本地数据。</text>

      <view v-if="step === 'main'" class="action-grid">
        <view class="action-card export-card" @click="handleExport">
          <text class="action-title">导出备份</text>
          <text class="action-subtitle">复制到剪贴板</text>
        </view>
        <view class="action-card import-card" @click="step = 'import'">
          <text class="action-title">导入备份</text>
          <text class="action-subtitle">从剪贴板或文件恢复</text>
        </view>
      </view>

      <view v-else class="import-panel">
        <view class="import-row" @click="handleImportClipboard">
          <text class="import-row-title">从剪贴板导入</text>
          <text class="import-row-arrow">›</text>
        </view>
        <view class="import-row" @click="handleImportFile">
          <text class="import-row-title">从文件导入</text>
          <text class="import-row-arrow">›</text>
        </view>
        <view class="back-row" @click="step = 'main'">
          <text class="back-row-text">返回</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useBills } from '../../composables/useBills';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const step = ref<'main' | 'import'>('main');
const { exportBackupData, restoreBackupData } = useBills();

const close = () => {
  step.value = 'main';
  emit('update:modelValue', false);
};

const handleExport = () => {
  const payload = exportBackupData();
  const clipboard = (uni as any).setClipboardData;
  if (typeof clipboard !== 'function') {
    uni.showToast({ title: '当前环境不支持复制', icon: 'none' });
    return;
  }

  clipboard({
    data: payload,
    success: () => {
      uni.showToast({ title: '备份已复制', icon: 'success' });
      close();
    },
    fail: () => {
      uni.showToast({ title: '导出失败', icon: 'none' });
    },
  });
};

const confirmRestore = (raw: string) => {
  uni.showModal({
    title: '确认导入',
    content: '导入会覆盖当前本地数据，确定继续吗？',
    confirmColor: '#34C26B',
    success: (res) => {
      if (!res.confirm) return;
      try {
        restoreBackupData(raw);
        uni.showToast({ title: '导入成功', icon: 'success' });
        close();
      } catch (error) {
        uni.showToast({ title: '导入失败', icon: 'none' });
      }
    },
  });
};

const handleImportClipboard = () => {
  const getClipboard = (uni as any).getClipboardData;
  if (typeof getClipboard !== 'function') {
    uni.showToast({ title: '当前环境不支持剪贴板', icon: 'none' });
    return;
  }

  getClipboard({
    success: (res: any) => {
      const raw = String(res.data || '').trim();
      if (!raw) {
        uni.showToast({ title: '剪贴板为空', icon: 'none' });
        return;
      }
      confirmRestore(raw);
    },
    fail: () => {
      uni.showToast({ title: '读取剪贴板失败', icon: 'none' });
    },
  });
};

const handleImportFile = () => {
  const choose = (uni as any).chooseMessageFile;
  if (typeof choose !== 'function') {
    uni.showToast({ title: '当前环境不支持文件导入', icon: 'none' });
    return;
  }

  choose({
    count: 1,
    type: 'file',
    extension: ['json'],
    success: (res: any) => {
      const file = res?.tempFiles?.[0];
      const path = file?.path;
      if (!path) {
        uni.showToast({ title: '未选择文件', icon: 'none' });
        return;
      }

      const fs = (globalThis as any).wx?.getFileSystemManager?.();
      if (!fs?.readFile) {
        uni.showToast({ title: '当前环境不支持读取文件', icon: 'none' });
        return;
      }

      fs.readFile({
        filePath: path,
        encoding: 'utf8',
        success: (readRes: any) => confirmRestore(String(readRes.data || '').trim()),
        fail: () => uni.showToast({ title: '读取文件失败', icon: 'none' }),
      });
    },
  });
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(47, 53, 66, 0.56);
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 249, 243, 0.98) 100%);
  border-radius: 42rpx 42rpx 0 0;
  padding: 34rpx 34rpx 40rpx;
  box-shadow: 0 -14rpx 40rpx rgba(47, 53, 66, 0.12);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.modal-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--theme-text);
}

.close-btn {
  font-size: 40rpx;
  color: var(--theme-text-muted);
  padding: 8rpx 12rpx;
}

.modal-desc {
  display: block;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--theme-text-muted);
  margin-bottom: 22rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.action-card {
  padding: 24rpx 22rpx;
  border-radius: 28rpx;
  border: 1rpx solid rgba(215, 232, 221, 0.95);
  box-shadow: 0 16rpx 30rpx rgba(52, 101, 65, 0.06);
}

.export-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 248, 239, 0.98) 100%);
}

.import-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(242, 248, 251, 0.98) 100%);
}

.action-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 8rpx;
}

.action-subtitle {
  display: block;
  font-size: 22rpx;
  color: var(--theme-text-muted);
}

.import-panel {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.import-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 22rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(215, 232, 221, 0.95);
  background: rgba(255, 255, 255, 0.98);
}

.import-row-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text);
}

.import-row-arrow {
  font-size: 42rpx;
  color: var(--theme-text-muted);
  line-height: 1;
}

.back-row {
  margin-top: 6rpx;
  text-align: center;
}

.back-row-text {
  font-size: 24rpx;
  color: var(--theme-primary);
}
</style>
