<template>
  <view v-if="modelValue" class="modal-mask" @click="$emit('update:modelValue', false)">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ isEdit ? '修改账单' : '记一笔' }}</text>
        <text class="close-btn" @click="$emit('update:modelValue', false)">✕</text>
      </view>

      <scroll-view scroll-y class="modal-scroll-area">
        <view class="type-tab">
          <view :class="['tab-item', form.type === 'expense' ? 'active-expense' : '']" @click="form.type = 'expense'">支出</view>
          <view :class="['tab-item', form.type === 'income' ? 'active-income' : '']" @click="form.type = 'income'">收入</view>
        </view>

        <view class="amount-input-box">
          <text class="currency-symbol">¥</text>
          <input class="amount-input" type="digit" v-model="form.amount" placeholder="0.00" focus />
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">记录日期</text>
            <text class="manage-btn" @click="formatDate">格式化</text>
          </view>
          <view class="date-input-box">
            <input class="date-input" v-model="form.date" placeholder="输入如 0318" />
            <text class="today-tag" @click="setToday">今天</text>
          </view>
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">选择分类</text>
            <text class="manage-btn" @click="$emit('manage-cat')">管理</text>
          </view>
          <scroll-view scroll-x class="scroll-x">
            <view class="flex-row">
              <view v-for="cat in categories[form.type]" :key="cat.name" 
                :class="['chip-item', form.category === cat.name ? 'selected' : '']"
                @click="form.category = cat.name">
                <text>{{ cat.icon }} {{ cat.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="section-box">
          <view class="section-header-inline">
            <text class="section-label">记录人物</text>
            <text class="manage-btn" @click="$emit('manage-person')">管理</text>
          </view>
          <scroll-view scroll-x class="scroll-x">
            <view class="flex-row">
              <view v-for="p in persons" :key="p.name" 
                :class="['chip-item', form.personName === p.name ? 'selected-person' : '']"
                @click="selectPerson(p)">
                <text>{{ p.avatar }} {{ p.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="note-box">
          <input v-model="form.note" placeholder="备注（可选）" />
        </view>
      </scroll-view>

      <button class="save-btn" @click="handleSave">{{ isEdit ? '确认修改' : '保存账单' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useBills } from '../../composables/useBills';
import { smartParseDate } from '../../utils/dateHelper';
import type { Bill } from '../../types';

const props = defineProps<{ 
  modelValue: boolean;
  editData?: Bill | null; // 传入要修改的数据
}>();
const emit = defineEmits(['update:modelValue', 'manage-cat', 'manage-person']);

const { categories, persons, addBill, updateBill } = useBills();

const isEdit = computed(() => !!props.editData);

const form = ref({ 
  id: 0,
  amount: '', type: 'expense' as 'expense' | 'income', 
  date: '', category: '', personName: '', personAvatar: '', note: '' 
});

// 监听打开，填充数据或重置
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.editData) {
      // 编辑模式：回显数据
      form.value = { 
        id: props.editData.id,
        amount: String(props.editData.amount),
        type: props.editData.type,
        date: props.editData.date,
        category: props.editData.category,
        personName: props.editData.personName,
        personAvatar: props.editData.personAvatar,
        note: props.editData.note
      };
    } else {
      // 新增模式：重置表单
      setToday();
      form.value.id = 0;
      form.value.amount = '';
      form.value.note = '';
      form.value.category = categories.value[form.value.type][0]?.name || '其它';
      const firstPerson = persons.value[0] || { name: '本人', avatar: '👨‍💼' };
      form.value.personName = firstPerson.name;
      form.value.personAvatar = firstPerson.avatar;
    }
  }
});

const setToday = () => {
  const d = new Date();
  form.value.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    note: form.value.note
  };

  if (isEdit.value) {
    updateBill({ ...billPayload, id: form.value.id });
    uni.showToast({ title: '修改成功', icon: 'success' });
  } else {
    addBill(billPayload);
    uni.showToast({ title: '已记录', icon: 'success' });
  }

  emit('update:modelValue', false);
};
</script>

<style scoped>
/* 保持原有样式不变 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-content { background: white; border-radius: 50rpx 50rpx 0 0; padding: 40rpx; animation: slideUp 0.3s; max-height: 85vh; display: flex; flex-direction: column; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 20rpx; }
.modal-title { font-size: 36rpx; font-weight: 600; }
.close-btn { font-size: 36rpx; color: #CCC; padding: 10rpx; }
.modal-scroll-area { flex: 1; overflow-y: auto; margin-bottom: 30rpx; }
.date-input-box { display: flex; align-items: center; background: #F8F9FB; border-radius: 20rpx; padding: 20rpx; gap: 20rpx; }
.date-input { flex: 1; font-size: 28rpx; color: #333; }
.today-tag { font-size: 24rpx; color: #999; }
.type-tab { display: flex; background: #F5F5F5; border-radius: 20rpx; padding: 8rpx; margin-bottom: 30rpx; }
.tab-item { flex: 1; text-align: center; padding: 15rpx 0; font-size: 28rpx; border-radius: 15rpx; }
.active-expense { background: #FF7F50; color: white; font-weight: 600; }
.active-income { background: #2ECC71; color: white; font-weight: 600; }
.amount-input-box { display: flex; align-items: baseline; border-bottom: 2rpx solid #EEE; padding: 10rpx 0; margin-bottom: 30rpx; }
.currency-symbol { font-size: 40rpx; margin-right: 10rpx; }
.amount-input { font-size: 70rpx; height: 100rpx; font-weight: 700; }
.section-box { margin-bottom: 30rpx; }
.section-label { font-size: 24rpx; color: #999; margin-bottom: 10rpx; display: block; }
.section-header-inline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.manage-btn { font-size: 24rpx; color: #007AFF; }
.scroll-x { width: 100%; white-space: nowrap; }
.flex-row { display: inline-flex; gap: 15rpx; }
.chip-item { padding: 15rpx 25rpx; border-radius: 20rpx; background: #F8F9FB; border: 2rpx solid #F5F5F5; font-size: 26rpx; color: #666; }
.chip-item.selected { background: #FFF4F0; border-color: #FF7F50; color: #FF7F50; font-weight: 600; }
.chip-item.selected-person { background: #F0F7FF; border-color: #007AFF; color: #007AFF; font-weight: 600; }
.note-box { background: #F8F9FB; padding: 20rpx; border-radius: 20rpx; margin-bottom: 20rpx; }
.save-btn { background: linear-gradient(135deg, #2C3E50 0%, #000000 100%); color: white; border-radius: 30rpx; height: 100rpx; line-height: 100rpx; font-size: 32rpx; font-weight: 700; box-shadow: 0 15rpx 30rpx rgba(0,0,0,0.15); margin-top: 20rpx; border: none; }
.save-btn:active { transform: scale(0.98); opacity: 0.9; }
</style>
