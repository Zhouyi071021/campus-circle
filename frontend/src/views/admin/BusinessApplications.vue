<template>
  <div class="admin-business-applications">
    <h2>商家账号审核</h2>

    <!-- 选项卡 -->
    <div class="tabs">
      <span
        :class="['tab', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'; fetchData(true)"
      >
        待审核
      </span>
      <span
        :class="['tab', { active: activeTab === 'approved' }]"
        @click="activeTab = 'approved'; fetchData(true)"
      >
        已通过
      </span>
      <span
        :class="['tab', { active: activeTab === 'rejected' }]"
        @click="activeTab = 'rejected'; fetchData(true)"
      >
        已拒绝
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="item in applications" :key="item.id" class="application-card">
          <div class="card-header">
            <div class="header-left">
              <h3>{{ item.store_name }}</h3>
              <span :class="['badge', item.status]">{{ statusText(item.status) }}</span>
            </div>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>

          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">申请人：</span>
                <span class="value">{{ item.user?.username }}</span>
              </div>
              <div class="info-item">
                <span class="label">联系电话：</span>
                <span class="value">{{ item.contact_phone }}</span>
              </div>
              <div class="info-item">
                <span class="label">微信号：</span>
                <span class="value">{{ item.contact_wechat || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">申请理由：</span>
                <span class="value">{{ item.reason || '-' }}</span>
              </div>
            </div>

            <div v-if="item.business_license" class="attachment">
              <span class="label">营业执照：</span>
              <a :href="item.business_license" target="_blank" class="license-link">查看文件</a>
            </div>

            <!-- 如果被拒绝，显示拒绝原因 -->
            <div v-if="item.status === 'rejected' && item.reject_reason" class="reject-reason">
              <span class="label">拒绝原因：</span>
              <span class="value">{{ item.reject_reason }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewDetail(item)" class="btn-text">查看详情</button>
            </div>
            <div class="footer-right">
              <!-- 待审核状态显示通过/拒绝 -->
              <template v-if="activeTab === 'pending'">
                <button @click="approve(item)" class="btn-approve" title="通过">✓ 通过</button>
                <button @click="reject(item)" class="btn-reject" title="拒绝">✗ 拒绝</button>
              </template>
              <!-- 已通过/已拒绝状态显示删除按钮 -->
              <template v-else>
                <button @click="deleteItem(item)" class="btn-delete" title="删除">🗑️ 删除</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <!-- 拒绝原因弹窗 -->
    <div v-if="showRejectModal" class="modal" @click.self="showRejectModal = false">
      <div class="modal-content">
        <h3>拒绝原因</h3>
        <textarea v-model="rejectReason" rows="4" placeholder="请输入拒绝原因（可选）"></textarea>
        <div class="modal-actions">
          <button @click="showRejectModal = false" class="btn-secondary">取消</button>
          <button @click="confirmReject" class="btn-reject">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getApplications, reviewApplication, deleteApplication } from '@/api/admin';
import { format } from 'date-fns';

const activeTab = ref('pending');
const applications = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const showRejectModal = ref(false);
const rejectReason = ref('');
const currentRejectId = ref(null);

const statusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return map[status] || status;
};

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1;
    applications.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize,
      status: activeTab.value
    };
    const res = await getApplications(params);
    applications.value.push(...res.data.list);
    hasMore.value = applications.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取商家申请失败', err);
    alert('加载失败，请检查权限或网络');
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchData();

const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm');

const viewDetail = (item) => {
  alert(`
店铺名称：${item.store_name}
申请人：${item.user?.username}
联系电话：${item.contact_phone}
微信号：${item.contact_wechat || '-'}
申请理由：${item.reason || '-'}
提交时间：${formatDate(item.created_at)}
  `);
};

const approve = async (item) => {
  if (confirm('确定通过该申请？通过后该用户将成为商家')) {
    try {
      await reviewApplication(item.id, 'approved');
      applications.value = applications.value.filter(i => i.id !== item.id);
    } catch (err) {
      alert('操作失败');
    }
  }
};

const reject = (item) => {
  currentRejectId.value = item.id;
  rejectReason.value = '';
  showRejectModal.value = true;
};

const confirmReject = async () => {
  try {
    await reviewApplication(currentRejectId.value, 'rejected', rejectReason.value);
    applications.value = applications.value.filter(i => i.id !== currentRejectId.value);
    showRejectModal.value = false;
  } catch (err) {
    alert('操作失败');
  }
};

const deleteItem = async (item) => {
  if (!confirm(`确定删除“${item.store_name}”的申请记录吗？此操作不可恢复。`)) return;
  try {
    await deleteApplication(item.id);
    applications.value = applications.value.filter(i => i.id !== item.id);
  } catch (err) {
    console.error('删除失败', err);
    alert('删除失败：' + (err.response?.data?.error || '未知错误'));
  }
};

onMounted(() => fetchData(true));
</script>

<style scoped>
/* 样式与之前相同，仅添加 .btn-delete 样式 */
.btn-delete {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-delete:hover {
  background-color: #c82333;
}
.admin-business-applications {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 选项卡样式 */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 12px;
}
.tab {
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  color: #6c757d;
  font-size: 14px;
  transition: all 0.2s;
}
.tab.active {
  background-color: #007bff;
  color: white;
}
.tab:hover:not(.active) {
  background-color: #e9ecef;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.application-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.application-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.badge.pending {
  background-color: #fff3cd;
  color: #856404;
}
.badge.approved {
  background-color: #d4edda;
  color: #155724;
}
.badge.rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.card-time {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  margin-bottom: 8px;
}
.info-item {
  font-size: 14px;
  color: #495057;
}
.info-item.full-width {
  grid-column: span 2;
}
.label {
  color: #6c757d;
  font-weight: 500;
}
.value {
  color: #212529;
  margin-left: 4px;
}

.attachment {
  font-size: 14px;
  color: #495057;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f3f5;
}
.license-link {
  color: #007bff;
  text-decoration: none;
  margin-left: 4px;
}
.license-link:hover {
  text-decoration: underline;
}

.reject-reason {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8d7da;
  border-radius: 6px;
  color: #721c24;
  font-size: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.btn-text:hover {
  text-decoration: underline;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-approve,
.btn-reject {
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-approve {
  background-color: #28a745;
  color: white;
}
.btn-approve:hover {
  background-color: #218838;
}
.btn-reject {
  background-color: #dc3545;
  color: white;
}
.btn-reject:hover {
  background-color: #c82333;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}
.load-more:hover {
  text-decoration: underline;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
}
.modal-content h3 {
  margin-top: 0;
  font-size: 18px;
  font-weight: 500;
}
.modal-content textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  margin: 16px 0;
  box-sizing: border-box;
  resize: vertical;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background-color: #5a6268;
}
.btn-reject {
  background-color: #dc3545;
  color: white;
}
.btn-reject:hover {
  background-color: #c82333;
}
/* 其他样式保持不变，建议将之前已有的样式合并进来，此处省略 */
</style>