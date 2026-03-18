<template>
  <view class="container">
    <!-- 头部总览卡片 -->
    <BillHeader :balance="balance" :income="totalIncome" :expense="totalExpense" />

    <!-- 视图切换开关 -->
    <view class="view-switcher">
      <view :class="['switch-item', activeTab === 'list' ? 'active' : '']" @click="activeTab = 'list'">明细</view>
      <view :class="['switch-item', activeTab === 'stats' ? 'active' : '']" @click="activeTab = 'stats'">分析</view>
    </view>

    <!-- 业务视图 -->
    <view v-show="activeTab === 'list'">
      <BillList @edit="handleEdit" />
    </view>
    <view v-show="activeTab === 'stats'">
      <StatsView />
    </view>

    <!-- 悬浮添加按钮 (清空编辑状态) -->
    <view class="add-fab" @click="handleAddNew">+</view>

    <!-- 记账弹窗组件 -->
    <AddBillModal 
      v-model="showAddModal" 
      :editData="editingBill"
      @manage-cat="showCatManager = true"
      @manage-person="showPersonManager = true"
    />

    <!-- 管理弹窗组件 -->
    <ManagementModals 
      v-model:showCat="showCatManager" 
      v-model:showPerson="showPersonManager"
      type="expense"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBills } from '../../composables/useBills';
import type { Bill } from '../../types';

// 导入业务视图组件
import BillHeader from '../../components/BillHeader.vue';
import BillList from '../../views/Home/BillList.vue';
import StatsView from '../../views/Home/StatsView.vue';
import AddBillModal from '../../views/Home/AddBillModal.vue';
import ManagementModals from '../../views/Home/ManagementModals.vue';

const { balance, totalIncome, totalExpense, initData } = useBills();

const activeTab = ref('list');
const showAddModal = ref(false);
const showCatManager = ref(false);
const showPersonManager = ref(false);

const editingBill = ref<Bill | null>(null); // 当前正在编辑的账单记录

onMounted(() => {
  initData();
});

// 处理点击“+”号：进入新增模式
const handleAddNew = () => {
  editingBill.value = null; // 确保是新增
  showAddModal.value = true;
};

// 处理点击列表项：进入编辑模式
const handleEdit = (bill: Bill) => {
  editingBill.value = bill;
  showAddModal.value = true;
};
</script>

<style>
.container { min-height: 100vh; background-color: #F8F9FB; padding: 30rpx; padding-bottom: 120rpx; }
.view-switcher { display: flex; background: #EEE; border-radius: 40rpx; padding: 6rpx; margin-bottom: 40rpx; width: 300rpx; }
.switch-item { flex: 1; text-align: center; padding: 12rpx 0; font-size: 26rpx; color: #666; border-radius: 35rpx; transition: all 0.3s; }
.switch-item.active { background: white; color: #000; font-weight: 700; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.05); }
.add-fab { position: fixed; right: 50rpx; bottom: 60rpx; width: 110rpx; height: 110rpx; background: #000; color: white; border-radius: 55rpx; display: flex; align-items: center; justify-content: center; font-size: 60rpx; box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.3); z-index: 100; }
</style>
