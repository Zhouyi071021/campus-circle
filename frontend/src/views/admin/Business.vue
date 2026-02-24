<template>
  <div class="admin-business">
    <h2>商家服务审核</h2>

    <!-- 选项卡：待审核 / 已审核（暂不可用） -->
    <div class="tabs">
      <span
        :class="['tab', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'; fetchData(true)"
      >
        待审核 ({{ pendingCount }})
      </span>
      <span
        :class="['tab', { active: activeTab === 'approved' }]"
        @click="activeTab = 'approved'; fetchData(true)"
        title="功能开发中"
      >
        已通过
      </span>
      <span
        :class="['tab', { active: activeTab === 'rejected' }]"
        @click="activeTab = 'rejected'; fetchData(true)"
        title="功能开发中"
      >
        已拒绝
      </span>
    </div>

    <!-- 列表区域 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="activeTab !== 'pending'" class="empty">该功能暂未开放，请查看待审核列表</div>
    <div v-else-if="list.length === 0" class="empty">暂无数据</div>
    <div v-else>
      <div v-for="item in list" :key="item.id" class="business-card">
        <div class="card-header">
          <span class="badge">{{ item.category || '未分类' }}</span>
          <span class="status" :class="item.status">{{ statusText(item.status) }}</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p class="description">{{ item.description }}</p>
        <div class="details">
          <div><strong>商家：</strong>{{ item.user?.username }}</div>
          <div><strong>价格：</strong>{{ item.price_range || '面议' }}</div>
          <div><strong>电话：</strong>{{ item.contact_phone || '-' }}</div>
          <div><strong>微信：</strong>{{ item.contact_wechat || '-' }}</div>
          <div><strong>地址：</strong>{{ item.location || '-' }}</div>
          <div><strong>营业时间：</strong>{{ item.business_hours || '-' }}</div>
        </div>

        <!-- 图片预览 -->
        <div v-if="item.images && item.images.length" class="images">
          <img
            v-for="(img, idx) in item.images.slice(0, 3)"
            :key="idx"
            :src="img"
            class="preview-img"
            @click="previewImage(img)"
          />
          <span v-if="item.images.length > 3" class="more">+{{ item.images.length - 3 }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button @click="openDetail(item)" class="detail">查看详情</button>
          <button v-if="activeTab === 'pending'" @click="approve(item)" class="approve">通过</button>
          <button v-if="activeTab === 'pending'" @click="reject(item)" class="reject">拒绝</button>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore && activeTab === 'pending'" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-content">
        <h3>服务详情</h3>
        <div class="modal-body">
          <p><strong>ID：</strong>{{ currentItem?.id }}</p>
          <p><strong>标题：</strong>{{ currentItem?.title }}</p>
          <p><strong>描述：</strong>{{ currentItem?.description }}</p>
          <p><strong>分类：</strong>{{ currentItem?.category }}</p>
          <p><strong>价格：</strong>{{ currentItem?.price_range || '面议' }}</p>
          <p><strong>电话：</strong>{{ currentItem?.contact_phone }}</p>
          <p><strong>微信：</strong>{{ currentItem?.contact_wechat }}</p>
          <p><strong>QQ：</strong>{{ currentItem?.contact_qq }}</p>
          <p><strong>地址：</strong>{{ currentItem?.location }}</p>
          <p><strong>营业时间：</strong>{{ currentItem?.business_hours }}</p>
          <p><strong>提交时间：</strong>{{ formatTime(currentItem?.created_at) }}</p>
          <div v-if="currentItem?.images?.length" class="detail-images">
            <img v-for="(img, i) in currentItem.images" :key="i" :src="img" @click="previewImage(img)" />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 拒绝原因输入弹窗 -->
    <div v-if="showRejectModal" class="modal" @click.self="showRejectModal = false">
      <div class="modal-content">
        <h3>拒绝原因</h3>
        <textarea v-model="rejectReason" rows="4" placeholder="请输入拒绝原因（可选）"></textarea>
        <div class="modal-actions">
          <button @click="showRejectModal = false">取消</button>
          <button @click="confirmReject" class="reject">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPendingBusinesses, approveBusiness, rejectBusiness } from '@/api/admin';
import { format } from 'date-fns';

const activeTab = ref('pending');
const list = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const pendingCount = ref(0);

const showDetailModal = ref(false);
const currentItem = ref(null);
const showRejectModal = ref(false);
const rejectReason = ref('');
const currentRejectId = ref(null);

const statusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return map[status] || status;
};

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1;
    list.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    let res;
    const params = { page: page.value, pageSize };
    
    if (activeTab.value === 'pending') {
      res = await getPendingBusinesses(page.value, pageSize);
    } else {
      // 已通过或已拒绝，调用通用接口并传入状态
      params.status = activeTab.value;
      res = await getBusinesses(params);
    }
    
    list.value.push(...res.data.list);
    hasMore.value = list.value.length < res.data.total;
    page.value++;
    
    if (activeTab.value === 'pending') {
      pendingCount.value = res.data.total;
    }
  } catch (err) {
    console.error('获取数据失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchData();

const openDetail = (item) => {
  currentItem.value = item;
  showDetailModal.value = true;
};

const approve = async (item) => {
  if (!confirm('确定通过该服务吗？')) return;
  try {
    await approveBusiness(item.id);
    list.value = list.value.filter(i => i.id !== item.id);
    pendingCount.value--;
  } catch (err) {
    alert('操作失败');
  }
};

const reject = (item) => {
  currentRejectId.value = item.id;
  rejectReason.value = '';
  showRejectModal.value = true;
};

const confirmReject = async () => {
  try {
    await rejectBusiness(currentRejectId.value, rejectReason.value);
    list.value = list.value.filter(i => i.id !== currentRejectId.value);
    pendingCount.value--;
    showRejectModal.value = false;
  } catch (err) {
    alert('操作失败');
  }
};

const previewImage = (url) => {
  window.open(url, '_blank');
};

const formatTime = (ts) => ts ? format(new Date(ts), 'yyyy-MM-dd HH:mm') : '';

onMounted(() => {
  fetchData(true);
});
</script>

<style scoped>
.admin-business {
  padding: 20px;
}
.tabs {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 20px;
}
.tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #6c757d;
  border-bottom: 2px solid transparent;
}
.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}
.business-card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.badge {
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}
.status.pending {
  background-color: #fff3cd;
  color: #856404;
}
.status.approved {
  background-color: #d4edda;
  color: #155724;
}
.status.rejected {
  background-color: #f8d7da;
  color: #721c24;
}
h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}
.description {
  color: #495057;
  margin-bottom: 8px;
}
.details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}
.images {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.preview-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f1f3f5;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.detail {
  background-color: #6c757d;
  color: white;
}
.approve {
  background-color: #28a745;
  color: white;
}
.reject {
  background-color: #dc3545;
  color: white;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-body {
  margin: 16px 0;
}
.modal-body p {
  margin: 4px 0;
}
.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.detail-images img {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  margin: 8px 0;
}
</style>