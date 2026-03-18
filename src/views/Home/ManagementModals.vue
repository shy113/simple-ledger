<template>
  <view v-if="showCat" class="modal-mask" @click="$emit('update:showCat', false)">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">管理分类</text>
        <text class="close-btn" @click="$emit('update:showCat', false)">×</text>
      </view>
      <view class="cat-list-scroll">
        <view v-for="(cat, idx) in categories[type]" :key="idx" class="cat-manage-item">
          <text>{{ cat.icon }} {{ cat.name }}</text>
          <text class="del-btn" @click="removeCategory(type, idx)">删除</text>
        </view>
      </view>
      <view class="add-form-box">
        <input class="mini-input" v-model="newCat.icon" placeholder="图标" confirm-type="done" :adjust-position="false" />
        <input class="flex-input" v-model="newCat.name" placeholder="分类名" confirm-type="done" :adjust-position="false" />
        <button class="add-action" @click="handleAddCat">添加</button>
      </view>
    </view>
  </view>

  <view v-if="showPerson" class="modal-mask" @click="$emit('update:showPerson', false)">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">管理人物</text>
        <text class="close-btn" @click="$emit('update:showPerson', false)">×</text>
      </view>
      <view class="cat-list-scroll">
        <view v-for="(p, idx) in persons" :key="idx" class="cat-manage-item">
          <text>{{ p.avatar }} {{ p.name }}</text>
          <text class="del-btn" @click="removePerson(idx)">删除</text>
        </view>
      </view>
      <view class="add-form-box">
        <input class="mini-input" v-model="newPerson.avatar" placeholder="头像" confirm-type="done" :adjust-position="false" />
        <input class="flex-input" v-model="newPerson.name" placeholder="姓名" confirm-type="done" :adjust-position="false" />
        <button class="add-action" @click="handleAddPerson">添加</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useBills } from '../../composables/useBills';

const props = defineProps<{ 
  showCat: boolean; 
  showPerson: boolean;
  type: 'expense' | 'income';
}>();

defineEmits(['update:showCat', 'update:showPerson']);

const { categories, persons, addCategory, removeCategory, addPerson, removePerson } = useBills();

const newCat = ref({ name: '', icon: '🧩' });
const newPerson = ref({ name: '', avatar: '👤' });

const handleAddCat = () => {
  if (!newCat.value.name) return;
  addCategory(props.type, { ...newCat.value });
  newCat.value = { name: '', icon: '🧩' };
};

const handleAddPerson = () => {
  if (!newPerson.value.name) return;
  addPerson({ ...newPerson.value });
  newPerson.value = { name: '', avatar: '👤' };
};
</script>

<style scoped>
.modal-mask { position: fixed; inset: 0; background: rgba(47, 53, 66, 0.52); z-index: 300; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-content { background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 249, 244, 0.98) 100%); border-radius: 50rpx 50rpx 0 0; padding: 40rpx; animation: slideUp 0.3s; max-height: 70vh; display: flex; flex-direction: column; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; }
.modal-title { font-size: 38rpx; font-weight: 700; color: var(--theme-text); }
.close-btn { font-size: 36rpx; color: var(--theme-text-muted); }
.cat-list-scroll { flex: 1; overflow-y: auto; margin-bottom: 30rpx; }
.cat-manage-item { display: flex; justify-content: space-between; padding: 26rpx 0; border-bottom: 1rpx solid rgba(215, 232, 221, 0.95); color: var(--theme-text); }
.del-btn { color: var(--theme-expense); font-size: 28rpx; }
.add-form-box { display: flex; gap: 15rpx; padding-top: 20rpx; border-top: 1rpx solid rgba(215, 232, 221, 0.95); }
.mini-input { width: 80rpx; background: rgba(242, 248, 243, 0.98); border-radius: 12rpx; text-align: center; height: 84rpx; }
.flex-input { flex: 1; background: rgba(242, 248, 243, 0.98); border-radius: 12rpx; padding-left: 20rpx; height: 84rpx; }
.add-action { background: var(--theme-primary); color: white; font-size: 28rpx; height: 84rpx; line-height: 84rpx; padding: 0 40rpx; border-radius: 12rpx; }
</style>


