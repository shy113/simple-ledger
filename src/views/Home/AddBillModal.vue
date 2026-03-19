<template>
  <view
    v-if="modelValue"
    class="modal-mask"
    :class="{ 'mask-show': modelValue }"
    @click="$emit('update:modelValue', false)"
    @touchmove.stop.prevent
  >
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ isEdit ? "修改账单" : "记一笔" }}</text>
        <text class="close-btn" @click="$emit('update:modelValue', false)"
          >×</text
        >
      </view>

      <view class="modal-area">
        <view class="type-tab">
          <view
            :class="[
              'tab-item',
              form.type === 'expense' ? 'active-expense' : '',
            ]"
            @click="handleTypeChange('expense')"
            >支出</view
          >
          <view
            :class="['tab-item', form.type === 'income' ? 'active-income' : '']"
            @click="handleTypeChange('income')"
            >收入</view
          >
        </view>

        <view class="amount-input-box">
          <text class="currency-symbol">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="form.amount"
            placeholder="0.00"
            confirm-type="done"
            :adjust-position="true"
            :cursor-spacing="20"
          />
        </view>

        <view class="note-box">
          <input
            v-model="form.note"
            class="note-input"
            placeholder="备注（可选）"
            confirm-type="done"
            :adjust-position="true"
            :cursor-spacing="20"
          />
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">记录日期</text>
            <text class="manage-btn" @click="formatDate">🪄</text>
          </view>
          <view class="date-input-box">
            <input
              class="date-input"
              v-model="form.date"
              placeholder="输入如 0318"
              confirm-type="done"
              :adjust-position="true"
              :cursor-spacing="20"
            />
            <text class="today-tag" @click="setToday">📍</text>
          </view>
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">选择分类</text>
            <text class="manage-btn" @click="$emit('manage-cat', form.type)">📂+</text>
          </view>
          <scroll-view scroll-x class="scroll-x" :enhanced="true" :show-scrollbar="false">
            <view class="flex-row">
              <view
                v-for="cat in categories[form.type]"
                :key="cat.name"
                :class="[
                  'chip-item',
                  form.category === cat.name ? 'selected' : '',
                ]"
                @click="form.category = cat.name"
              >
                <text>{{ cat.icon }} {{ cat.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">记录成员</text>
            <text class="manage-btn" @click="$emit('manage-person')">👤+</text>
          </view>
          <scroll-view scroll-x class="scroll-x" :enhanced="true" :show-scrollbar="false">
            <view class="flex-row">
              <view
                v-for="p in persons"
                :key="p.name"
                :class="[
                  'chip-item',
                  form.personName === p.name ? 'selected-person' : '',
                ]"
                @click="selectPerson(p)"
              >
                <text>{{ p.avatar }} {{ p.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="modal-footer">
        <button class="save-btn" @click="handleSave">
          {{ isEdit ? "确认修改" : "保存账单" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useBills } from "../../composables/useBills";
import { smartParseDate } from "../../utils/dateHelper";
import type { Bill } from "../../types";

const props = defineProps<{ modelValue: boolean; editData?: Bill | null }>();
const emit = defineEmits(["update:modelValue", "manage-cat", "manage-person"]);

const { categories, persons, addBill, updateBill } = useBills();

const isEdit = computed(() => !!props.editData);

const form = ref({
  id: 0, // 0 表示新增模式，>0 表示正在编辑某条账单
  amount: "",
  type: "expense" as "expense" | "income",
  date: "",
  category: "",
  personName: "",
  personAvatar: "",
  note: "",
});

// 设置今天日期
const setToday = () => {
  const d = new Date();
  form.value.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 重置表单为“新增”状态的初始草稿
const resetToNew = () => {
  setToday();
  form.value.id = 0;
  form.value.amount = "";
  form.value.note = "";
  form.value.type = "expense";
  form.value.category = categories.value.expense[0]?.name || "其他";
  const firstPerson = persons.value[0] || { name: "本人", avatar: "😊" };
  form.value.personName = firstPerson.name;
  form.value.personAvatar = firstPerson.avatar;
};

onMounted(() => {
  resetToNew();
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.editData) {
        // 1. 如果是编辑模式，强制加载被编辑的数据
        form.value = {
          id: props.editData.id,
          amount: String(props.editData.amount),
          type: props.editData.type,
          date: props.editData.date,
          category: props.editData.category,
          personName: props.editData.personName,
          personAvatar: props.editData.personAvatar,
          note: props.editData.note,
        };
      } else {
        // 2. 如果是新增模式
        // 如果当前表单里存的是之前编辑的数据（id > 0），则说明用户点击了底部的“+”号切换到了新增模式，此时需要清空
        if (form.value.id !== 0) {
          resetToNew();
        }
        // 如果 form.value.id 本来就是 0，说明它是之前的草稿，保持原样不动
      }
    }
  },
);

const handleTypeChange = (type: "expense" | "income") => {
  form.value.type = type;
  // 切换类型时，如果当前选中的分类不在新类型的列表里，自动选第一个
  const exists = categories.value[type].some(c => c.name === form.value.category);
  if (!exists) {
    form.value.category = categories.value[type][0]?.name || "其他";
  }
};

const formatDate = () => {
  if (form.value.date) form.value.date = smartParseDate(form.value.date);
};

const selectPerson = (p: any) => {
  form.value.personName = p.name;
  form.value.personAvatar = p.avatar;
};

const handleSave = () => {
  if (!form.value.amount) return;
  formatDate();

  const billPayload = {
    amount: Number(form.value.amount),
    type: form.value.type,
    date: form.value.date,
    category: form.value.category,
    personName: form.value.personName,
    personAvatar: form.value.personAvatar,
    note: form.value.note,
  };

  if (isEdit.value) {
    updateBill({ ...billPayload, id: form.value.id });
    uni.showToast({ title: "修改成功", icon: "success" });
    // 编辑成功关闭后，重置 id 为 0，下次点开新增就是空的了
    setTimeout(() => resetToNew(), 300);
  } else {
    addBill(billPayload);
    uni.showToast({ title: "已记录", icon: "success" });
    // 新增成功后清空草稿
    resetToNew();
  }

  emit("update:modelValue", false);
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0); /* 初始透明 */
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: background-color 0.3s ease;
  backdrop-filter: blur(0px);
}

.mask-show {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4rpx);
}

.modal-content {
  background: var(--theme-card-gradient);
  border-radius: 50rpx 50rpx 0 0;
  padding: 40rpx 40rpx 24rpx;
  max-height: 85vh;
  min-height: 60vh; /* 设置稳定高度，防止渲染初态抖动 */
  display: flex;
  flex-direction: column;
  /* 开启 GPU 加速 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translate3d(0, 100%, 0);
  animation: slideUp 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes slideUp {
  from {
    transform: translate3d(0, 100%, 0);
    opacity: 0.8;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.modal-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--theme-text);
}
.close-btn {
  font-size: 38rpx;
  color: var(--theme-text-muted);
  padding: 10rpx;
}
.modal-area {
  flex: 1;
  margin-bottom: 24rpx;
  overflow: hidden;
}
.date-input-box {
  display: flex;
  align-items: center;
  background: var(--theme-surface-soft);
  border-radius: 20rpx;
  padding: 20rpx;
  gap: 20rpx;
}
.date-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--theme-text);
}
.today-tag {
  font-size: 28rpx;
  color: var(--theme-primary);
}
.type-tab {
  display: flex;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  border-radius: 24rpx;
  padding: 8rpx;
  margin-bottom: 30rpx;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 18rpx;
  color: var(--theme-text-muted);
  transition: all 0.2s;
}
.active-expense {
  background: var(--theme-expense);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(255, 90, 90, 0.2);
}
.active-income {
  background: var(--theme-income);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(42, 191, 150, 0.2);
}
.amount-input-box {
  display: flex;
  align-items: baseline;
  border-bottom: 2rpx solid var(--theme-border);
  padding: 10rpx 0;
  margin-bottom: 20rpx;
}
.currency-symbol {
  font-size: 44rpx;
  margin-right: 10rpx;
  color: var(--theme-text);
}
.amount-input {
  font-size: 74rpx;
  height: 100rpx;
  font-weight: 700;
  color: var(--theme-text);
}
.note-box {
  background: var(--theme-surface-soft);
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  margin-bottom: 28rpx;
}
.note-input {
  font-size: 28rpx;
  color: var(--theme-text);
}
.section-box {
  margin-bottom: 30rpx;
}
.section-label {
  font-size: 28rpx;
  color: var(--theme-text-muted);
  margin-bottom: 10rpx;
  display: block;
}
.section-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.manage-btn {
  font-size: 28rpx;
  color: var(--theme-primary);
}
.scroll-x {
  width: 100%;
  white-space: nowrap;
}
.flex-row {
  display: inline-flex;
  gap: 15rpx;
}
.chip-item {
  padding: 15rpx 25rpx;
  border-radius: 20rpx;
  background: var(--theme-surface-soft);
  border: 2rpx solid var(--theme-border);
  font-size: 28rpx;
  color: var(--theme-text);
}
.chip-item.selected {
  background: var(--theme-expense-soft);
  border-color: var(--theme-expense);
  color: var(--theme-expense);
  font-weight: 600;
}
.chip-item.selected-person {
  background: var(--theme-primary-soft);
  border-color: var(--theme-primary);
  color: var(--theme-primary);
  font-weight: 600;
}
.modal-footer {
  padding-top: 14rpx;
  border-top: 1rpx solid var(--theme-border);
}
.save-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 24rpx;
  background: var(--theme-fab-gradient);
  color: white;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 24rpx rgba(52, 101, 65, 0.18);
}
.save-btn:active {
  transform: scale(0.99);
  opacity: 0.92;
}
</style>
