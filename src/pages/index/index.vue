<template>
  <view class="container">
    <!-- 固定的头部区域 -->
    <view class="fixed-header">
      <!-- 头部总览卡片 -->
      <BillHeader
        :balance="balance"
        :income="totalIncome"
        :expense="totalExpense"
      />

      <!-- 视图切换开关 -->
      <view class="view-switcher">
        <view
          :class="['switch-item', activeTab === 'list' ? 'active' : '']"
          @click="activeTab = 'list'"
          >明细</view
        >
        <view
          :class="['switch-item', activeTab === 'stats' ? 'active' : '']"
          @click="activeTab = 'stats'"
          >分析</view
        >
      </view>
    </view>

    <!-- 可滚动的业务内容区域 -->
    <scroll-view
      class="scroll-content"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="false"
    >
      <!-- 明细视图 -->
      <view v-show="activeTab === 'list'">
        <BillList @edit="handleEdit" />
        <!-- 刷新数据入口 -->
        <view class="refresh-entry" @click="handleRegenerateMock">
          <text>🔄 刷新测试数据</text>
        </view>
      </view>

      <!-- 分析视图 -->
      <view v-show="activeTab === 'stats'">
        <StatsView />
      </view>
    </scroll-view>

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
import { ref, onMounted } from "vue";
import { useBills } from "../../composables/useBills";
import type { Bill } from "../../types";

// 导入业务视图组件
import BillHeader from "../../components/BillHeader.vue";
import BillList from "../../views/Home/BillList.vue";
import StatsView from "../../views/Home/StatsView.vue";
import AddBillModal from "../../views/Home/AddBillModal.vue";
import ManagementModals from "../../views/Home/ManagementModals.vue";

const { balance, totalIncome, totalExpense, initData, inject50MockData } =
  useBills();

const activeTab = ref("list");
const showAddModal = ref(false);
const showCatManager = ref(false);
const showPersonManager = ref(false);
const scrollTop = ref(0);

const editingBill = ref<Bill | null>(null); // 当前正在编辑的账单记录

onMounted(() => {
  initData();
});

// 处理点击"+"号：进入新增模式
const handleAddNew = () => {
  editingBill.value = null; // 确保是新增
  showAddModal.value = true;
};

// 处理点击列表项：进入编辑模式
const handleEdit = (bill: Bill) => {
  editingBill.value = bill;
  showAddModal.value = true;
};

// 重新生成50条mock数据
const handleRegenerateMock = () => {
  inject50MockData();
  // 滚动到顶部
  scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;
  uni.showToast({ title: "已重新生成50条数据", icon: "none" });
};
</script>

<style>
page {
  height: 100%;
}
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f9fb;
}

.fixed-header {
  flex-shrink: 0;
  padding: 30rpx;
  padding-bottom: 0;
  background-color: #f8f9fb;
}

.scroll-content {
  flex: 1;
  height: calc(100vh - 380px);
  padding: 30rpx;
  padding-top: 0;
  padding-bottom: 150rpx;
  box-sizing: border-box;
}

.view-switcher {
  display: flex;
  background: #eee;
  border-radius: 40rpx;
  padding: 6rpx;
  margin-top: 40rpx;
  margin-bottom: 30rpx;
  width: 300rpx;
}
.switch-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #666;
  border-radius: 35rpx;
  transition: all 0.3s;
}
.switch-item.active {
  background: white;
  color: #000;
  font-weight: 700;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}
.add-fab {
  position: fixed;
  right: 50rpx;
  bottom: 60rpx;
  width: 110rpx;
  height: 110rpx;
  background: #000;
  color: white;
  border-radius: 55rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
  z-index: 100;
}
.refresh-entry {
  text-align: center;
  padding: 30rpx;
  margin-top: 20rpx;
}
.refresh-entry text {
  font-size: 24rpx;
  color: #999;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
}
</style>
