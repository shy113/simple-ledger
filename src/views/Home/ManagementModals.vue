<template>
  <view
    v-if="showCat"
    class="modal-mask"
    @click="$emit('update:showCat', false)"
    @touchmove.stop.prevent
  >
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">管理分类</text>
        <text class="close-btn" @click="$emit('update:showCat', false)">×</text>
      </view>
      <view class="cat-list-scroll">
        <view
          v-for="(cat, idx) in categories[type]"
          :key="idx"
          class="cat-manage-item"
        >
          <view class="item-left">
            <text class="item-icon">{{ cat.icon }}</text>
            <text :class="['item-name', { 'is-editing': editingCatIndex === idx }]">{{ cat.name }}</text>
            <text v-if="isCategoryDefault(type, cat.name)" class="default-tag">默认</text>
            <text v-else-if="editingCatIndex === idx" class="edit-tag">编辑中</text>
          </view>
          
          <view class="item-actions">
            <template v-if="!isCategoryDefault(type, cat.name)">
              <view class="action-btn-circle edit" @click="startEditCat(idx, cat)">
                <text class="action-emoji">✏️</text>
              </view>
              <view 
                v-if="isCategoryDeletable(type, cat.name)" 
                class="action-btn-circle del" 
                @click="removeCategory(type, idx)"
              >
                <text class="action-emoji">🗑️</text>
              </view>
            </template>
          </view>
        </view>
      </view>
      <view class="add-form-box">
        <input
          class="mini-input"
          v-model="newCat.icon"
          placeholder="图标"
          confirm-type="done"
          :adjust-position="true"
          :cursor-spacing="70"
        />
        <input
          class="flex-input"
          v-model="newCat.name"
          placeholder="分类名"
          confirm-type="done"
          :adjust-position="true"
          :cursor-spacing="70"
        />
        <button v-if="editingCatIndex === -1" class="add-action" @click="handleAddCat">添加</button>
        <view v-else class="edit-actions">
          <button class="cancel-action" @click="cancelEdit">取消</button>
          <button class="save-action" @click="handleUpdateCat">保存</button>
        </view>
      </view>
    </view>
  </view>

  <view
    v-if="showPerson"
    class="modal-mask"
    @click="$emit('update:showPerson', false)"
    @touchmove.stop.prevent
  >
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">管理成员</text>
        <text class="close-btn" @click="$emit('update:showPerson', false)"
          >×</text
        >
      </view>
      <view class="cat-list-scroll">
        <view 
          v-for="(p, idx) in persons" 
          :key="idx" 
          class="cat-manage-item"
        >
          <view class="item-left">
            <text class="item-icon">{{ p.avatar }}</text>
            <text :class="['item-name', { 'is-editing': editingPersonIndex === idx }]">{{ p.name }}</text>
            <text v-if="isPersonDefault(p.name)" class="default-tag">默认</text>
            <text v-else-if="editingPersonIndex === idx" class="edit-tag">编辑中</text>
          </view>
          
          <view class="item-actions">
            <template v-if="!isPersonDefault(p.name)">
              <view class="action-btn-circle edit" @click="startEditPerson(idx, p)">
                <text class="action-emoji">✏️</text>
              </view>
              <view 
                v-if="isPersonDeletable(p.name)" 
                class="action-btn-circle del" 
                @click="removePerson(idx)"
              >
                <text class="action-emoji">🗑️</text>
              </view>
            </template>
          </view>
        </view>
      </view>
      <view class="add-form-box">
        <input
          class="mini-input"
          v-model="newPerson.avatar"
          placeholder="头像"
          confirm-type="done"
          :adjust-position="true"
          :cursor-spacing="70"
        />
        <input
          class="flex-input"
          v-model="newPerson.name"
          placeholder="姓名"
          confirm-type="done"
          :adjust-position="true"
          :cursor-spacing="70"
        />
        <button v-if="editingPersonIndex === -1" class="add-action" @click="handleAddPerson">添加</button>
        <view v-else class="edit-actions">
          <button class="cancel-action" @click="cancelEdit">取消</button>
          <button class="save-action" @click="handleUpdatePerson">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBills } from "../../composables/useBills";

const props = defineProps<{
  showCat: boolean;
  showPerson: boolean;
  type: "expense" | "income";
}>();

defineEmits(["update:showCat", "update:showPerson"]);

const {
  categories,
  persons,
  addCategory,
  removeCategory,
  updateCategory,
  addPerson,
  removePerson,
  updatePerson,
  isCategoryDeletable,
  isPersonDeletable,
  isCategoryDefault,
  isPersonDefault,
} = useBills();

const newCat = ref({ name: "", icon: "🧩" });
const newPerson = ref({ name: "", avatar: "😊" });

const editingCatIndex = ref(-1);
const editingPersonIndex = ref(-1);

const startEditCat = (index: number, cat: any) => {
  editingCatIndex.value = index;
  newCat.value = { ...cat };
};

const startEditPerson = (index: number, p: any) => {
  editingPersonIndex.value = index;
  newPerson.value = { ...p };
};

const cancelEdit = () => {
  editingCatIndex.value = -1;
  editingPersonIndex.value = -1;
  newCat.value = { name: "", icon: "🧩" };
  newPerson.value = { name: "", avatar: "😊" };
};

const handleAddCat = () => {
  if (!newCat.value.name) return;
  addCategory(props.type, { ...newCat.value });
  newCat.value = { name: "", icon: "🧩" };
};

const handleUpdateCat = () => {
  if (!newCat.value.name || editingCatIndex.value === -1) return;
  updateCategory(props.type, editingCatIndex.value, { ...newCat.value });
  cancelEdit();
  uni.showToast({ title: "已同步更新", icon: "success" });
};

const handleAddPerson = () => {
  if (!newPerson.value.name) return;
  addPerson({ ...newPerson.value });
  newPerson.value = { name: "", avatar: "😊" };
};

const handleUpdatePerson = () => {
  if (!newPerson.value.name || editingPersonIndex.value === -1) return;
  updatePerson(editingPersonIndex.value, { ...newPerson.value });
  cancelEdit();
  uni.showToast({ title: "已同步更新", icon: "success" });
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 300;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.modal-content {
  background: var(--theme-card-gradient);
  border-radius: 50rpx 50rpx 0 0;
  padding: 40rpx;
  animation: slideUp 0.3s;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}
.modal-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--theme-text);
}
.close-btn {
  font-size: 36rpx;
  color: var(--theme-text-muted);
}
.cat-list-scroll {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 30rpx;
}
.cat-manage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid var(--theme-border);
  color: var(--theme-text);
}
.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.item-icon {
  font-size: 36rpx;
}
.item-name {
  font-size: 32rpx;
}
.is-editing {
  color: var(--theme-primary);
  font-weight: 700;
}
.default-tag {
  font-size: 20rpx;
  color: var(--theme-text-muted);
  background: var(--theme-surface-soft);
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  border: 1rpx solid var(--theme-border);
}
.edit-tag {
  font-size: 20rpx;
  color: white;
  background: var(--theme-primary);
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
}
.item-actions {
  display: flex;
  gap: 20rpx;
  align-items: center;
}
.action-btn-circle {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, opacity 0.1s;
}
.action-btn-circle:active {
  transform: scale(0.9);
  opacity: 0.8;
}
.action-btn-circle.edit {
  background: var(--theme-primary-soft);
}
.action-btn-circle.del {
  background: var(--theme-expense-soft);
}
.action-emoji {
  font-size: 30rpx;
}
.add-form-box {
  display: flex;
  gap: 15rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid var(--theme-border);
}
.mini-input {
  width: 90rpx;
  background: var(--theme-surface-soft);
  border-radius: 16rpx;
  text-align: center;
  height: 90rpx;
  color: var(--theme-text);
}
.flex-input {
  flex: 1;
  background: var(--theme-surface-soft);
  border-radius: 16rpx;
  padding-left: 20rpx;
  height: 90rpx;
  color: var(--theme-text);
}
.add-action {
  background: var(--theme-primary);
  color: white;
  font-size: 28rpx;
  height: 90rpx;
  line-height: 90rpx;
  padding: 0 44rpx;
  border-radius: 16rpx;
  font-weight: 700;
}
.edit-actions {
  display: flex;
  gap: 10rpx;
}
.cancel-action {
  background: var(--theme-surface-soft);
  color: var(--theme-text-muted);
  font-size: 26rpx;
  height: 90rpx;
  line-height: 90rpx;
  padding: 0 30rpx;
  border-radius: 16rpx;
}
.save-action {
  background: var(--theme-income);
  color: white;
  font-size: 28rpx;
  height: 90rpx;
  line-height: 90rpx;
  padding: 0 44rpx;
  border-radius: 16rpx;
  font-weight: 700;
}
</style>
